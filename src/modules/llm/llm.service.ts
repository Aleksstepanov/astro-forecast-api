import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createHash } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { TLlmNarrative } from './types/llm.types';

type TChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type TCache = {
  get: (key: string) => Promise<unknown>;
  set: (
    key: string,
    value: unknown,
    options?: { ttl?: number },
  ) => Promise<void>;
};

@Injectable()
export class LlmService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: TCache,
  ) {}

  private getHeaders = (): Record<string, string> => {
    const key = this.config.get<string>('OPENROUTER_API_KEY', '');
    const siteUrl = this.config.get<string>('OPENROUTER_SITE_URL', '');
    const appName = this.config.get<string>('OPENROUTER_APP_NAME', '');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };

    if (siteUrl) headers['HTTP-Referer'] = siteUrl;
    if (appName) headers['X-Title'] = appName;

    return headers;
  };

  private normalizeError = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message || 'llm_failed';

    if (typeof error === 'object' && error !== null) {
      const rec = error as Record<string, unknown>;
      if (typeof rec.code === 'string') return rec.code;
      if (typeof rec.message === 'string') return rec.message;
    }

    return 'llm_failed';
  };

  private isLlmNarrative = (v: unknown): v is TLlmNarrative => {
    if (typeof v !== 'object' || v === null) return false;
    const rec = v as Record<string, unknown>;

    // TLlmNarrative: { source: 'llm'|'fallback', text: string, model: string, error?: string }
    if (rec.source !== 'llm' && rec.source !== 'fallback') return false;
    if (typeof rec.text !== 'string') return false;
    if (typeof rec.model !== 'string') return false;

    if (
      'error' in rec &&
      rec.error !== undefined &&
      typeof rec.error !== 'string'
    ) {
      return false;
    }

    return true;
  };

  private makeCacheKey = (args: {
    tz: string;
    period: 'day' | 'week' | 'month';
    summary: string;
    topHours: Array<{ ts: string; observingScore: number; reasons: string[] }>;
  }): string => {
    const payload = {
      tz: args.tz,
      period: args.period,
      summary: args.summary,
      topHours: args.topHours.map((h) => ({
        ts: h.ts,
        observingScore: h.observingScore,
        reasons: [...h.reasons].sort(),
      })),
      promptVersion: 1,
    };

    const raw = JSON.stringify(payload);
    const hash = createHash('sha256').update(raw).digest('hex');
    return `llm:narrative:${hash}`;
  };

  private fallbackText = (args: {
    summary: string;
    topHours: Array<{ ts: string; observingScore: number; reasons: string[] }>;
  }): string => {
    const best = args.topHours.slice(0, 5);

    const bestLines =
      best.length === 0
        ? 'Лучших часов не найдено.'
        : best
            .map(
              (h) =>
                `• ${h.ts} — ${h.observingScore}/100 (${h.reasons.join(', ')})`,
            )
            .join('\n');

    return [
      'Наш ИИ-друг ушёл в туман 🌫️, поэтому кратко руками:',
      args.summary,
      '',
      'Лучшие часы по текущим данным:',
      bestLines,
      '',
      'Подсказка: если облачность высокая — смысла выходить мало, даже при комфортном ветре.',
    ].join('\n');
  };

  generateNarrative = async (args: {
    tz: string;
    period: 'day' | 'week' | 'month';
    summary: string;
    topHours: Array<{ ts: string; observingScore: number; reasons: string[] }>;
  }): Promise<TLlmNarrative> => {
    const model = this.config.get<string>(
      'OPENROUTER_MODEL',
      'openai/gpt-4o-mini',
    );
    const timeoutMs = Number(
      this.config.get<string>('OPENROUTER_TIMEOUT_MS', '8000'),
    );

    const cacheKey = this.makeCacheKey(args);

    // 1) читаем кэш безопасно (unknown -> guard)
    const cachedRaw = await this.cache.get(cacheKey);
    if (this.isLlmNarrative(cachedRaw)) {
      return cachedRaw;
    }

    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const system = [
      'Ты помощник для астропрогноза.',
      'Пиши кратко, по делу, по-русски.',
      'Не выдумывай данных: опирайся только на вход.',
      'Дай: 1) общий вердикт 2) лучшие часы 3) почему (коротко).',
    ].join(' ');

    const user = [
      `Таймзона: ${args.tz}. Горизонт: ${args.period}.`,
      `Сводка данных: ${args.summary}`,
      `Лучшие часы (ts, score, reasons):`,
      JSON.stringify(args.topHours),
      'Сформируй короткий текст (6-10 строк), без таблиц.',
    ].join('\n');

    try {
      const resp = await firstValueFrom(
        this.http.post<TChatCompletionResponse>(
          url,
          {
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            temperature: 0.4,
            max_tokens: 220,
          },
          {
            headers: this.getHeaders(),
            timeout: timeoutMs,
          },
        ),
      );

      const text = resp.data.choices?.[0]?.message?.content?.trim();

      const result: TLlmNarrative = text
        ? { source: 'llm', text, model }
        : {
            source: 'fallback',
            text: this.fallbackText({
              summary: args.summary,
              topHours: args.topHours,
            }),
            model,
            error: 'empty_response',
          };

      const ttl = Number(this.config.get<string>('LLM_CACHE_TTL_SEC', '43200'));
      await this.cache.set(cacheKey, result, { ttl });

      return result;
    } catch (e: unknown) {
      const err = this.normalizeError(e);

      const result: TLlmNarrative = {
        source: 'fallback',
        text: this.fallbackText({
          summary: args.summary,
          topHours: args.topHours,
        }),
        model,
        error: err,
      };

      const negativeTtl = Number(
        this.config.get<string>('LLM_NEGATIVE_CACHE_TTL_SEC', '300'),
      );
      await this.cache.set(cacheKey, result, { ttl: negativeTtl });

      return result;
    }
  };
}
