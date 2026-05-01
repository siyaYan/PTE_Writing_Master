'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNormalEssay, NormalEssay } from '../services/geminiService';
import {
  Sparkles, Timer, RotateCcw,
  Send, Bot, CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  ESSAY_TYPES, EssayTypeId, getEssayType,
  buildParagraphText, substituteTemplate,
} from '../data/essayTemplates';

interface NormalPracticeProps {
  topic: string;
  desc: string;
  isPredicted: boolean;
  sourceId: string;
}

const ESSAY_SECONDS = 20 * 60;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? 'http://localhost:5000/mcp/incoming';

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
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copiedForClaude, setCopiedForClaude] = useState(false);

  const typeDef = getEssayType(essayType);
  const accent = typeDef.accent;

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) { setTimerRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timerSeconds]);

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
    : timerSeconds <= 300 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200';

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
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReviewStatus('success');
    } catch {
      setReviewStatus('error');
    } finally {
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

      {/* Timer bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${timerBg} transition-colors`}>
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
          <span className="text-xs font-semibold text-slate-400 tabular-nums">
            {totalWords} <span className="font-normal">words</span>
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
            disabled={sendingReview || totalWords === 0}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50 ${
              reviewStatus === 'success' ? 'bg-emerald-600 text-white'
                : reviewStatus === 'error' ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {sendingReview
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : reviewStatus === 'success' ? <CheckCircle size={16} />
              : reviewStatus === 'error' ? <XCircle size={16} />
              : <Send size={16} />}
            {sendingReview ? 'Sending…'
              : reviewStatus === 'success' ? 'Sent!'
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
    </div>
  );
};
