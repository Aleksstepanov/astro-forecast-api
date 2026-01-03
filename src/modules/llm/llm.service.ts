import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { TLlmNarrative } from './types/llm.types';

type TChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

@Injectable()
export class LlmService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getHeaders = (): Record<string, string> => {
    const key = this.config.get<string>('OPENROUTER_API_KEY', '');
    const siteUrl = this.config.get<string>('OPENROUTER_SITE_URL', '');
    const appName = this.config.get<string>('OPENROUTER_APP_NAME', '');

    const headers: Record<string, string> = {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };

    // Опциональная атрибуция OpenRouter
    if (siteUrl) headers['HTTP-Referer'] = siteUrl;
    if (appName) headers['X-Title'] = appName;

    return headers;
  };

  private normalizeError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message || 'llm_failed';
    }

    if (this.hasStringProp(error, 'code')) {
      return error.code;
    }

    if (this.hasStringProp(error, 'message')) {
      return error.message;
    }

    return 'llm_failed';
  }

  private hasStringProp<T extends string>(
    value: unknown,
    prop: T,
  ): value is Record<T, string> {
    if (typeof value !== 'object' || value === null) return false;

    // Тут value: object. Приводим к Record<string, unknown> — это НЕ any.
    const rec = value as Record<string, unknown>;
    return typeof rec[prop] === 'string';
  }

  /**
   * Генерирует "человеческий" текст.
   * Важно: никогда не кидает исключение наружу — либо llm, либо fallback.
   */
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

      if (!text) {
        return {
          source: 'fallback',
          text: this.fallbackText(args),
          model,
          error: 'empty_response',
        };
      }

      return { source: 'llm', text, model };
    } catch (e: unknown) {
      const err = this.normalizeError(e);

      return {
        source: 'fallback',
        text: this.fallbackText(args),
        model,
        error: err,
      };
    }
  };

  private fallbackText = (args: {
    tz: string;
    period: 'day' | 'week' | 'month';
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
}
