import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface FastFeedback {
  corrected: string;
  score: { pte: number };
  advice: string;
  recommendedExpressions: string[];
  structure: { complexity: number; clarity: number; coherence: number };
  issues: {
    label: string;
    spanText: string;
    reason: string;
    suggestion: string;
    start: number;
    end: number;
  }[];
  alternatives: string[];
}

export interface NormalEssay {
  essay: string;
  score: { pte: number };
  wordCount: number;
  notes: string[];
}

export interface TemplateResult {
  template: string;
  tips: string[];
}

export const getFastFeedback = async (topic: string, desc: string, sentence: string): Promise<FastFeedback> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected: { type: Type.STRING },
          score: {
            type: Type.OBJECT,
            properties: { pte: { type: Type.NUMBER } },
            required: ["pte"]
          },
          advice: { type: Type.STRING },
          recommendedExpressions: { type: Type.ARRAY, items: { type: Type.STRING } },
          structure: {
            type: Type.OBJECT,
            properties: {
              complexity: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              coherence: { type: Type.NUMBER }
            },
            required: ["complexity", "clarity", "coherence"]
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
                end: { type: Type.NUMBER }
              },
              required: ["label", "spanText", "reason", "suggestion", "start", "end"]
            }
          },
          alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["corrected", "score", "advice", "recommendedExpressions", "structure", "issues", "alternatives"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateNormalEssay = async (topic: string, desc: string, sentences: string[]): Promise<NormalEssay> => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
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
        Assemble a PTE Write-Essay (200–300 words) using the five topic sentences.
        Structure: Intro (paraphrase + thesis) -> Body A -> Body B -> Body C -> Conclusion.
        Keep word count 200-300. Return JSON.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          essay: { type: Type.STRING },
          score: {
            type: Type.OBJECT,
            properties: { pte: { type: Type.NUMBER } },
            required: ["pte"]
          },
          wordCount: { type: Type.NUMBER },
          notes: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["essay", "score", "wordCount", "notes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateTemplate = async (mode: string, notes: string): Promise<TemplateResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      Mode: ${mode}
      Notes: ${notes}
    `,
    config: {
      systemInstruction: `
        Create a robust, reusable PTE Write-Essay template.
        Return JSON with the template text and usage tips.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          template: { type: Type.STRING },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["template", "tips"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
