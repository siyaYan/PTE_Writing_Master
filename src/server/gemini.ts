import { GoogleGenAI, Type } from '@google/genai';
import type {
  FastFeedback,
  FastFeedbackRequest,
  NormalEssay,
  NormalEssayRequest,
  TemplateRequest,
  TemplateResult,
} from '@/types/gemini';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

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
    model: MODEL,
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
  paragraphs,
  essayType,
}: NormalEssayRequest): Promise<NormalEssay> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `
      Topic: ${topic}
      Essay Type: ${essayType}
      Context / hint: ${desc || 'none'}

      Student's paragraphs:

      INTRODUCTION:
      ${paragraphs[0] || '(empty)'}

      BODY PARAGRAPH 1:
      ${paragraphs[1] || '(empty)'}

      BODY PARAGRAPH 2:
      ${paragraphs[2] || '(empty)'}

      CONCLUSION:
      ${paragraphs[3] || '(empty)'}
    `,
    config: {
      systemInstruction: `
        You are a PTE Writing coach. The student has written a ${essayType}-style essay
        across four paragraphs. Polish these into a cohesive PTE Write-Essay of 200-300 words.
        Improve sentence variety, cohesion and flow but preserve the student's ideas and
        sentence structures. Target word count: 220-280. Return JSON.
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
  topic,
  essayType,
  mode = 'essay',
  notes,
}: TemplateRequest): Promise<TemplateResult> {
  const ai = getClient();

  const isTemplateMode = mode === 'template';
  const systemInstruction = isTemplateMode
    ? `
        You are a PTE Writing expert. Generate a structured essay TEMPLATE with [placeholder]
        markers for the ${essayType} pattern. Do NOT write the actual essay content.
        Use [placeholder text] wherever the student should fill in their own ideas, reasons,
        or examples. Use the actual topic "${topic || 'the topic'}" in the fixed structural
        sentences (e.g. "People have different views about ${topic || 'the topic'}.") but keep
        all content slots as [placeholder] markers.
        Structure: exactly 4 paragraphs — Introduction (3 sentences), Body Paragraph 1
        (5 sentences), Body Paragraph 2 (5 sentences), Conclusion (2 sentences).
        Separate paragraphs with a blank line. Return JSON with the 4-paragraph template
        string as "template" and 3-4 writing tips as "tips".
      `
    : `
        You are a PTE Writing expert. Generate a complete model ${essayType}-style
        PTE Write-Essay (220-280 words) about the given topic.
        Structure: Introduction (3 sentences) → Body 1 (5 sentences) →
        Body 2 (5 sentences) → Conclusion (2 sentences).
        Use a mix of simple and complex sentence structures appropriate for PTE.
        Return JSON with the full essay as "template" and 3-4 practical writing tips as "tips".
      `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `
      Topic: ${topic || 'a general PTE writing topic'}
      Essay Type: ${essayType}
      ${notes ? `Extra instructions: ${notes}` : ''}
    `,
    config: {
      systemInstruction,
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
