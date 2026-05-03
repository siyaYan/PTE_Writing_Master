'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNormalEssay, NormalEssay } from '../services/geminiService';
import {
  Sparkles, Timer, RotateCcw,
  Send, Bot, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Trophy, ThumbsUp, Target, FileText,
} from 'lucide-react';

import {
  ESSAY_TYPES, EssayTypeId, getEssayType,
  buildParagraphText, substituteTemplate,
} from '../data/essayTemplates';

interface ScoringResult {
  scores: { content: number; coherence: number; grammar: number; vocabulary: number; spelling: number; overall: number; };
  strengths: string[];
  areasToImprove: string[];
  feedbackSummary: string;
}

const DIMS: { key: keyof ScoringResult['scores']; label: string; max: number }[] = [
  { key: 'content',    label: 'Content',    max: 3 },
  { key: 'coherence',  label: 'Coherence',  max: 2 },
  { key: 'grammar',    label: 'Grammar',    max: 2 },
  { key: 'vocabulary', label: 'Vocabulary', max: 2 },
  { key: 'spelling',   label: 'Spelling',   max: 2 },
];

function toBullets(val: unknown): string[] {
  const s = typeof val === 'string' ? val : '';
  return s.split('\n')
    .map(line => line.replace(/^[•\-]\s*/, '').trim())
    .filter(line => line.length > 0);
}

function parseScoringResult(raw: Record<string, unknown>): ScoringResult {
  const sc = (raw?.scores ?? {}) as Record<string, number>;
  return {
    scores: {
      content:    sc.content    ?? 0,
      coherence:  sc.coherence  ?? 0,
      grammar:    sc.grammar    ?? 0,
      vocabulary: sc.vocabulary ?? 0,
      spelling:   sc.spelling   ?? 0,
      overall:    sc.overall    ?? 0,
    },
    strengths:      toBullets(raw?.strengths),
    areasToImprove: toBullets(raw?.areasToImprove),
    feedbackSummary: typeof raw?.feedbackSummary === 'string' ? raw.feedbackSummary.trim() : '',
  };
}

interface NormalPracticeProps {
  topic: string;
  desc: string;
  isPredicted: boolean;
  sourceId: string;
}

const ESSAY_SECONDS = 20 * 60;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? 'http://localhost:5000/mcp/incoming';
const WEBHOOK_BASE = (() => {
  try { return new URL(WEBHOOK_URL).origin; } catch { return ''; }
})();

const TYPE_COLOR: Record<string, string> = {
  Simple: 'bg-sky-100 text-sky-700',
  Complex: 'bg-violet-100 text-violet-700',
  Compound: 'bg-teal-100 text-teal-700',
  'Complex/Compound': 'bg-purple-100 text-purple-700',
  'Simple/Compound': 'bg-cyan-100 text-cyan-700',
};

const ACCENT_ACTIVE: Record<string, string> = {
  emerald: 'bg-emerald-600 text-white border-emerald-600',
  indigo:  'bg-indigo-600 text-white border-indigo-600',
  amber:   'bg-amber-500 text-white border-amber-500',
  rose:    'bg-rose-600 text-white border-rose-600',
};
const ACCENT_IDLE: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
  amber:   'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400',
  rose:    'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
};
const ACCENT_HINT: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-100',
  indigo:  'bg-indigo-50 border-indigo-100',
  amber:   'bg-amber-50 border-amber-100',
  rose:    'bg-rose-50 border-rose-100',
};
const ACCENT_FILL: Record<string, string> = {
  emerald: 'text-emerald-700 hover:bg-emerald-100',
  indigo:  'text-indigo-700 hover:bg-indigo-100',
  amber:   'text-amber-700 hover:bg-amber-100',
  rose:    'text-rose-700 hover:bg-rose-100',
};

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export const NormalPractice: React.FC<NormalPracticeProps> = ({
  topic, desc, isPredicted, sourceId,
}) => {
  const [essayType, setEssayType] = useState<EssayTypeId>('discuss');
  const [paragraphs, setParagraphs] = useState(['', '', '', '']);
  const [hintsOpen, setHintsOpen] = useState([false, false, false, false]);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<NormalEssay | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timerSeconds, setTimerSeconds] = useState(ESSAY_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null]);

  const [sendingReview, setSendingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [webhookFeedback, setWebhookFeedback] = useState<ScoringResult | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [copiedForClaude, setCopiedForClaude] = useState(false);

  const typeDef = getEssayType(essayType);
  const accent = typeDef.accent;

  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { clearInterval(timerRef.current!); };
  }, [timerRunning]);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleParaChange = (idx: number, value: string) => {
    const next = [...paragraphs];
    next[idx] = value;
    setParagraphs(next);
    if (!timerRunning && value.length > 0 && timerSeconds > 0) setTimerRunning(true);
  };

  const fillParagraph = useCallback((idx: number) => {
    const text = buildParagraphText(typeDef.paragraphs[idx], topic);
    const next = [...paragraphs];
    next[idx] = text;
    setParagraphs(next);
  }, [typeDef, topic, paragraphs]);

  const insertSentence = useCallback((paraIdx: number, template: string) => {
    const resolved = substituteTemplate(template, topic);
    const next = [...paragraphs];
    const current = next[paraIdx].trimEnd();
    next[paraIdx] = current ? `${current} ${resolved}` : resolved;
    setParagraphs(next);
    textareaRefs.current[paraIdx]?.focus();
  }, [topic, paragraphs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, idx: number) => {
    if (e.key === 'Tab' && !paragraphs[idx].trim()) {
      e.preventDefault();
      fillParagraph(idx);
    }
  };

  const toggleHints = (idx: number) => {
    const next = [...hintsOpen];
    next[idx] = !next[idx];
    setHintsOpen(next);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(ESSAY_SECONDS);
  };

  const stopTimer = () => setTimerRunning(false);

  const totalWords = wordCount(paragraphs.join(' '));

  const timerColor = timerSeconds <= 120 ? 'text-red-600'
    : timerSeconds <= 300 ? 'text-amber-600' : 'text-slate-700';
  const timerBg = timerSeconds <= 120 ? 'bg-red-50 border-red-200'
    : timerSeconds <= 300 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200';

  const WORD_LIMIT = 300;
  const isOverLimit = totalWords > WORD_LIMIT;
  const wordCountColor = isOverLimit ? 'text-red-600' : totalWords > 270 ? 'text-amber-600' : 'text-slate-500';

  const buildPayload = () => ({
    Topic: topic,
    Is_Predicted: isPredicted ? 'Y' : 'N',
    Source_Id: sourceId || 'N/A',
    Essay_Content: paragraphs.filter(Boolean).join('\n\n'),
    Word_Count: totalWords,
    Time_Taken: formatTime(ESSAY_SECONDS - timerSeconds),
  });

  const handleGetFeedback = async () => {
    if (totalWords === 0) return;
    stopTimer();
    setLoading(true);
    setError(null);
    try {
      const result = await generateNormalEssay(topic, desc, paragraphs, essayType);
      setFeedback(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to get feedback right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForReview = async () => {
    stopTimer();
    setSendingReview(true);
    setReviewStatus('idle');
    setWebhookFeedback(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const jobId: string = data.scoring_job_id;
      setSendingReview(false);
      setReviewStatus('polling');
      pollingRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${WEBHOOK_BASE}/result/${jobId}`);
          if (!r.ok) return;
          const job = await r.json();
          if (job.status === 'done') {
            clearInterval(pollingRef.current!);
            setWebhookFeedback(parseScoringResult(job.result as Record<string, unknown>));
            setReviewStatus('success');
          } else if (job.status === 'error') {
            clearInterval(pollingRef.current!);
            setReviewStatus('error');
          }
        } catch { /* keep polling */ }
      }, 3000);
    } catch {
      setReviewStatus('error');
      setSendingReview(false);
    }
  };

  const handleCopyForClaude = () => {
    stopTimer();
    const p = buildPayload();
    const prompt = `Please score the following content based on the official PTE guidelines in my NotebookLM.
Topic: "${p.Topic}",
Is_Predicted: "${p.Is_Predicted}",
Source_Id: "${p.Source_Id}",
Essay_Content: "${p.Essay_Content}",
Word_Count: ${p.Word_Count},
Time_Taken: "${p.Time_Taken}"
After scoring, use the Notion MCP to log this to my PTE Tracker.`;
    navigator.clipboard.writeText(prompt);
    setCopiedForClaude(true);
    setTimeout(() => setCopiedForClaude(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Essay Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ESSAY_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setEssayType(t.id)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
              essayType === t.id ? ACCENT_ACTIVE[t.accent] : ACCENT_IDLE[t.accent]
            }`}
          >
            <div className="font-bold">{t.shortLabel}</div>
            <div className={`mt-0.5 font-normal text-[10px] leading-tight ${essayType === t.id ? 'opacity-80' : 'opacity-60'}`}>
              {t.description.split(' ').slice(0, 5).join(' ')}…
            </div>
          </button>
        ))}
      </div>

      {/* Timer bar — sticky so it floats while scrolling */}
      <div className={`sticky top-2 z-40 flex items-center justify-between px-4 py-3 rounded-2xl border shadow-md ${timerBg} transition-colors`}>
        <div className="flex items-center gap-2">
          <Timer size={16} className={timerSeconds <= 120 ? 'text-red-500' : timerSeconds <= 300 ? 'text-amber-500' : 'text-slate-400'} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Essay Timer</span>
          {timerSeconds === 0 && (
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Time&apos;s up!</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black font-mono tabular-nums ${timerColor} ${timerSeconds <= 120 && timerSeconds > 0 ? 'animate-pulse' : ''}`}>
            {formatTime(timerSeconds)}
          </span>
          <span className={`text-xs font-semibold tabular-nums ${wordCountColor}`}>
            {totalWords}<span className="font-normal text-slate-400">/300</span>
            {isOverLimit && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Over limit</span>}
          </span>
          <button onClick={resetTimer} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors" title="Reset timer">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Paragraph Sections */}
      {typeDef.paragraphs.map((para, idx) => {
        const pWords = wordCount(paragraphs[idx]);
        const isOpen = hintsOpen[idx];
        return (
          <div key={para.section} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <span className="font-bold text-sm text-slate-900">{para.section}</span>
                <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{para.pattern}</span>
              </div>
              <button
                onClick={() => toggleHints(idx)}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${ACCENT_FILL[accent]}`}
              >
                Sentence Guide {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`${ACCENT_HINT[accent]} border-b px-4 py-3 space-y-2`}>
                    {para.sentences.map((s, si) => (
                      <div key={si} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 w-5 text-center font-bold text-slate-400 mt-0.5">S{si + 1}</span>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${TYPE_COLOR[s.type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {s.type}
                        </span>
                        <span className="flex-1 text-slate-600 leading-snug">
                          <span className="text-slate-400 italic mr-1">{s.hint}:</span>
                          {substituteTemplate(s.template, topic)}
                        </span>
                        <button
                          onClick={() => insertSentence(idx, s.template)}
                          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${ACCENT_FILL[accent]} bg-white border border-current`}
                        >
                          Insert ↑
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 space-y-2">
              <textarea
                ref={el => { textareaRefs.current[idx] = el; }}
                value={paragraphs[idx]}
                onChange={e => handleParaChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(e, idx)}
                placeholder={
                  !paragraphs[idx]
                    ? `${substituteTemplate(para.sentences[0].template, topic)}\n↹ Press Tab to fill full template`
                    : ''
                }
                rows={idx === 0 || idx === 3 ? 4 : 6}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm leading-relaxed resize-y"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => fillParagraph(idx)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${ACCENT_FILL[accent]}`}
                >
                  Fill Template ▸
                </button>
                <span className="text-xs text-slate-400 tabular-nums">{pWords} words</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleGetFeedback}
          disabled={loading || totalWords === 0}
          className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Sparkles size={18} /> Get AI Feedback</>}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSendForReview}
            disabled={sendingReview || reviewStatus === 'polling' || totalWords === 0}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50 ${
              reviewStatus === 'success' ? 'bg-emerald-600 text-white'
                : reviewStatus === 'error' ? 'bg-red-600 text-white'
                : reviewStatus === 'polling' ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {sendingReview || reviewStatus === 'polling'
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : reviewStatus === 'success' ? <CheckCircle size={16} />
              : reviewStatus === 'error' ? <XCircle size={16} />
              : <Send size={16} />}
            {sendingReview ? 'Sending…'
              : reviewStatus === 'polling' ? 'Scoring…'
              : reviewStatus === 'success' ? 'Scored!'
              : reviewStatus === 'error' ? 'Failed — Retry'
              : 'Send for Review'}
          </button>

          <button
            onClick={handleCopyForClaude}
            disabled={totalWords === 0}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm border transition-all disabled:opacity-50 ${
              copiedForClaude
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {copiedForClaude ? <CheckCircle size={16} /> : <Bot size={16} />}
            {copiedForClaude ? 'Copied!' : 'Copy for Claude'}
          </button>
        </div>

        {reviewStatus === 'error' && (
          <p className="text-xs text-red-500 px-1">
            Could not reach <span className="font-mono">{WEBHOOK_URL}</span>. Check the MCP server is running.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* AI Feedback Result */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-indigo-600">{feedback.score.pte}</span>
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">/ 5</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">AI Feedback</h3>
              <p className="text-xs text-slate-400">{feedback.wordCount} words analysed · {typeDef.label}</p>
            </div>
          </div>
          <ul className="space-y-2">
            {feedback.notes.map((note, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="shrink-0 text-indigo-400 font-bold">{i + 1}.</span>
                {note}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Official Scoring Result */}
      {webhookFeedback && (() => {
        const ov = webhookFeedback.scores.overall;
        const ovBand = ov >= 79 ? { label: 'Expert', bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
          : ov >= 65 ? { label: 'Advanced', bg: 'from-sky-500 to-indigo-600', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' }
          : ov >= 50 ? { label: 'Competent', bg: 'from-amber-400 to-orange-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
          : { label: 'Developing', bg: 'from-rose-400 to-red-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' };
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg"
          >
            {/* Gradient header */}
            <div className={`bg-gradient-to-r ${ovBand.bg} px-6 py-5 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={16} className="opacity-80" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Official Score Report</span>
                  </div>
                  <p className="text-sm opacity-75">{typeDef.label} · {topic.slice(0, 50)}{topic.length > 50 ? '…' : ''}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-black leading-none tabular-nums">{ov || '–'}</div>
                  <div className="text-xs opacity-70 font-semibold mt-0.5">out of 90</div>
                  {ov > 0 && <div className="mt-1 text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block">{ovBand.label}</div>}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 space-y-5">
              {/* Dimension score tiles */}
              <div className="grid grid-cols-5 gap-2">
                {DIMS.map(({ key, label, max }) => {
                  const score = webhookFeedback.scores[key] as number;
                  const full = score >= max;
                  const partial = score > 0 && score < max;
                  const tileColor = full ? 'bg-emerald-50 border-emerald-200' : partial ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
                  const numColor = full ? 'text-emerald-700' : partial ? 'text-amber-700' : 'text-red-600';
                  const dotFill = full ? 'bg-emerald-500' : partial ? 'bg-amber-400' : 'bg-slate-200';
                  const dotEmpty = 'bg-slate-200';
                  return (
                    <div key={key} className={`rounded-xl border p-2 text-center ${tileColor}`}>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 leading-tight">{label}</div>
                      <div className={`text-lg font-black tabular-nums leading-none ${numColor}`}>{score}</div>
                      <div className="text-[9px] text-slate-400 font-medium mb-1.5">/{max}</div>
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: max }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < score ? dotFill : dotEmpty}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Score legend */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 px-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Full marks</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Partial</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Missed</span>
              </div>

              {/* Feedback summary */}
              {webhookFeedback.feedbackSummary && (
                <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <FileText size={15} className="shrink-0 text-slate-400 mt-0.5" />
                  <p className="text-sm text-slate-600 leading-relaxed">{webhookFeedback.feedbackSummary}</p>
                </div>
              )}

              {/* Strengths */}
              {webhookFeedback.strengths.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp size={13} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Strengths</span>
                  </div>
                  <div className="space-y-2">
                    {webhookFeedback.strengths.map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5">
                          <span className="text-white text-[9px] font-black">✓</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas to improve */}
              {webhookFeedback.areasToImprove.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Target size={13} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Areas to Improve</span>
                  </div>
                  <div className="space-y-2">
                    {webhookFeedback.areasToImprove.map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center mt-0.5">
                          <span className="text-white text-[9px] font-black">{i + 1}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
};
