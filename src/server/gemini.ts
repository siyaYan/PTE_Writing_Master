import { GoogleGenAI, Type } from '@google/genai';
import type {
  FastFeedback,
  FastFeedbackRequest,
  NormalEssay,
  NormalEssayRequest,
  TemplateRequest,
  TemplateResult,
} from '@/types/gemini';

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Add it to .env.local or Vercel environment variables.');
  }

  return new GoogleGenAI({ apiKey });
}

function parseJson<T>(text: string | undefined): T {
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(text) as T;
}

export async function generateFastFeedback({
  topic,
  desc,
  sentence,
}: FastFeedbackRequest): Promise<FastFeedback> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Topic: ${topic}
      Context: ${desc}
      Student's topic sentence: "${sentence}"
    `,
    config: {
      systemInstruction: `
        You are a PTE Writing coach. The student is practising ONE complex topic sentence.
        Provide detailed feedback in JSON format.
        Score should be 0-5.
        Issues should include specific spans of text that need improvement.
      `,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected: { type: Type.STRING },
          score: {
            type: Type.OBJECT,
            properties: { pte: { type: Type.NUMBER } },
            required: ['pte'],
          },
          advice: { type: Type.STRING },
          recommendedExpressions: { type: Type.ARRAY, items: { type: Type.STRING } },
          structure: {
            type: Type.OBJECT,
            properties: {
              complexity: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              coherence: { type: Type.NUMBER },
            },
            required: ['complexity', 'clarity', 'coherence'],
          },
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                spanText: { type: Type.STRING },
                reason: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
              },
              required: ['label', 'spanText', 'reason', 'suggestion', 'start', 'end'],
            },
          },
          alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'corrected',
          'score',
          'advice',
          'recommendedExpressions',
          'structure',
          'issues',
          'alternatives',
        ],
      },
    },
  });

  return parseJson<FastFeedback>(response.text);
}

export async function generateNormalEssay({
  topic,
  desc,
  sentences,
}: NormalEssayRequest): Promise<NormalEssay> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Topic: ${topic}
      Context: ${desc}
      Topic sentences:
      1. ${sentences[0]}
      2. ${sentences[1]}
      3. ${sentences[2]}
      4. ${sentences[3]}
      5. ${sentences[4]}
    `,
    config: {
      systemInstruction: `
        Assemble a PTE Write-Essay (200-300 words) using the five topic sentences.
        Structure: Intro (paraphrase + thesis) -> Body A -> Body B -> Body C -> Conclusion.
        Keep word count 200-300. Return JSON.
      `,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          essay: { type: Type.STRING },
          score: {
            type: Type.OBJECT,
            properties: { pte: { type: Type.NUMBER } },
            required: ['pte'],
          },
          wordCount: { type: Type.NUMBER },
          notes: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['essay', 'score', 'wordCount', 'notes'],
      },
    },
  });

  return parseJson<NormalEssay>(response.text);
}

export async function generateTemplateResult({
  mode,
  notes,
}: TemplateRequest): Promise<TemplateResult> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Mode: ${mode}
      Notes: ${notes}
    `,
    config: {
      systemInstruction: `
        Create a robust, reusable PTE Write-Essay template.
        Return JSON with the template text and usage tips.
      `,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          template: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['template', 'tips'],
      },
    },
  });

  return parseJson<TemplateResult>(response.text);
}
