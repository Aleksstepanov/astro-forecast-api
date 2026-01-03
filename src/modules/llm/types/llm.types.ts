export type TLlmNarrative = Readonly<{
  source: 'llm' | 'fallback';
  text: string;
  model?: string;
  error?: string;
}>;
