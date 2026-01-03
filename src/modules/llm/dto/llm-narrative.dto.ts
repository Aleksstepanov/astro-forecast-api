import { ApiProperty } from '@nestjs/swagger';

export class LlmNarrativeDto {
  @ApiProperty({ example: 'llm', enum: ['llm', 'fallback'] as const })
  source!: 'llm' | 'fallback';

  @ApiProperty({
    example: 'Сегодня в Москве облачность высокая... Лучшие часы: ...',
  })
  text!: string;

  @ApiProperty({ example: 'openai/gpt-4o-mini', required: false })
  model?: string;

  @ApiProperty({ example: 'timeout', required: false })
  error?: string;
}
