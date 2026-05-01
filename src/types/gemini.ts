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

export interface FastFeedbackRequest {
  topic: string;
  desc: string;
  sentence: string;
}

export interface NormalEssayRequest {
  topic: string;
  desc: string;
  paragraphs: string[];
  essayType: string;
}

export interface TemplateRequest {
  topic: string;
  essayType: string;
  notes?: string;
}

export type GeminiAction = 'fast-feedback' | 'normal-essay' | 'template';

export type GeminiProxyRequest =
  | {
      action: 'fast-feedback';
      payload: FastFeedbackRequest;
    }
  | {
      action: 'normal-essay';
      payload: NormalEssayRequest;
    }
  | {
      action: 'template';
      payload: TemplateRequest;
    };
