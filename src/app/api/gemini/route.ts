import { NextResponse } from 'next/server';
import {
  generateFastFeedback,
  generateNormalEssay,
  generateTemplateResult,
} from '@/server/gemini';
import type { GeminiProxyRequest } from '@/types/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json()) as unknown;

    if (
      !rawBody ||
      typeof rawBody !== 'object' ||
      !('action' in rawBody) ||
      !('payload' in rawBody)
    ) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const body = rawBody as GeminiProxyRequest;

    switch (body.action) {
      case 'fast-feedback':
        return NextResponse.json(await generateFastFeedback(body.payload));
      case 'normal-essay':
        return NextResponse.json(await generateNormalEssay(body.payload));
      case 'template':
        return NextResponse.json(await generateTemplateResult(body.payload));
      default:
        return NextResponse.json({ error: 'Unsupported Gemini action.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Gemini proxy error', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unexpected error while contacting Gemini.',
      },
      { status: 500 },
    );
  }
}
