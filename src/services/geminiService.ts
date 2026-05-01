import type {
  FastFeedback,
  GeminiAction,
  NormalEssay,
  TemplateResult,
} from '@/types/gemini';

async function requestGemini<T>(action: GeminiAction, payload: unknown): Promise<T> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data === 'object' && 'error' in data
        ? String(data.error)
        : 'The request failed.',
    );
  }

  return data as T;
}

export type { FastFeedback, NormalEssay, TemplateResult } from '@/types/gemini';

export function getFastFeedback(
  topic: string,
  desc: string,
  sentence: string,
): Promise<FastFeedback> {
  return requestGemini<FastFeedback>('fast-feedback', { topic, desc, sentence });
}

export function generateNormalEssay(
  topic: string,
  desc: string,
  paragraphs: string[],
  essayType: string,
): Promise<NormalEssay> {
  return requestGemini<NormalEssay>('normal-essay', { topic, desc, paragraphs, essayType });
}

export function generateTemplate(
  topic: string,
  essayType: string,
  mode?: 'template' | 'essay',
  notes?: string,
): Promise<TemplateResult> {
  return requestGemini<TemplateResult>('template', { topic, essayType, mode, notes });
}
