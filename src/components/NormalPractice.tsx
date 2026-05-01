'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { generateNormalEssay, NormalEssay } from '../services/geminiService';
import { FileText, Sparkles, Clipboard, Timer, RotateCcw, Send, Bot, CheckCircle, XCircle } from 'lucide-react';

interface NormalPracticeProps {
  topic: string;
  desc: string;
  isPredicted: boolean;
  sourceId: string;
}

const ESSAY_SECONDS = 20 * 60;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? 'http://localhost:5000/mcp/incoming';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const NormalPractice: React.FC<NormalPracticeProps> = ({ topic, desc, isPredicted, sourceId }) => {
  const [sentences, setSentences] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalEssay | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timerSeconds, setTimerSeconds] = useState(ESSAY_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeTakenSnapshot, setTimeTakenSnapshot] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Review action states
  const [sendingReview, setSendingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copiedForClaude, setCopiedForClaude] = useState(false);

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timerSeconds]);

  const handleSentenceChange = (index: number, value: string) => {
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
    if (!timerRunning && value.length > 0 && timerSeconds > 0) setTimerRunning(true);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(ESSAY_SECONDS);
  };

  const totalWordCount = sentences.join(' ').trim().split(/\s+/).filter(w => w.length > 0).length;

  const timerColor =
    timerSeconds <= 120
      ? 'text-red-600'
      : timerSeconds <= 300
      ? 'text-amber-600'
      : 'text-slate-700';

  const timerBg =
    timerSeconds <= 120
      ? 'bg-red-50 border-red-200'
      : timerSeconds <= 300
      ? 'bg-amber-50 border-amber-200'
      : 'bg-slate-50 border-slate-200';

  const handleGenerate = async () => {
    if (sentences.some(s => !s.trim())) return;
    setTimerRunning(false);
    setTimeTakenSnapshot(ESSAY_SECONDS - timerSeconds);
    setLoading(true);
    setError(null);
    setReviewStatus('idle');
    try {
      const essay = await generateNormalEssay(topic, desc, sentences);
      setResult(essay);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : 'Unable to build the essay right now.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.essay) {
      navigator.clipboard.writeText(result.essay);
    }
  };

  const buildPayload = () => ({
    Topic: topic,
    Is_Predicted: isPredicted ? 'Y' : 'N',
    Source_Id: sourceId || 'N/A',
    Essay_Content: result?.essay ?? sentences.filter(Boolean).join('\n\n'),
    Word_Count: result?.wordCount ?? totalWordCount,
    Time_Taken: formatTime(timeTakenSnapshot),
  });

  const handleSendForReview = async () => {
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
      {/* Timer bar */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${timerBg} transition-colors`}>
        <div className="flex items-center gap-2">
          <Timer size={16} className={timerSeconds <= 300 ? (timerSeconds <= 120 ? 'text-red-500' : 'text-amber-500') : 'text-slate-400'} />
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
            {totalWordCount} <span className="font-normal">words</span>
          </span>
          <button
            onClick={resetTimer}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            title="Reset timer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Complex #1 (Advantage)', placeholder: 'While technology enables...' },
          { label: 'Complex #2 (Advantage)', placeholder: 'Furthermore, it is often argued...' },
          { label: 'Complex #3 (Disadvantage)', placeholder: 'Conversely, some critics point out...' },
          { label: 'Simple #1 (Advantage)', placeholder: 'This leads to better efficiency.' },
          { label: 'Simple #2 (Disadvantage)', placeholder: 'However, costs can be high.' },
        ].map((item, i) => (
          <div key={i} className={i === 4 ? 'md:col-span-2' : ''}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </label>
            <textarea
              value={sentences[i]}
              onChange={(e) => handleSentenceChange(i, e.target.value)}
              placeholder={item.placeholder}
              className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || sentences.some(s => !s.trim())}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Sparkles size={18} />
            Build Full Essay
          </>
        )}
      </button>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative group">
            <div className="absolute top-6 right-6 flex gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-all"
                title="Copy essay to clipboard"
              >
                <Clipboard size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Final Essay</h3>
                <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{result.wordCount} Words</span>
                  <span>Score: {result.score.pte}/5</span>
                  <span>Time: {formatTime(timeTakenSnapshot)}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                {result.essay}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.notes.map((note, i) => (
              <div key={i} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm text-indigo-900 italic">
                {note}
              </div>
            ))}
          </div>

          {/* Review Actions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Submit for Review</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Send your essay for official scoring or copy a prompt for Claude.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Webhook button */}
              <button
                onClick={handleSendForReview}
                disabled={sendingReview}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm disabled:opacity-60 ${
                  reviewStatus === 'success'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : reviewStatus === 'error'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                {sendingReview ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : reviewStatus === 'success' ? (
                  <CheckCircle size={16} />
                ) : reviewStatus === 'error' ? (
                  <XCircle size={16} />
                ) : (
                  <Send size={16} />
                )}
                {sendingReview
                  ? 'Sending…'
                  : reviewStatus === 'success'
                  ? 'Sent Successfully'
                  : reviewStatus === 'error'
                  ? 'Failed — Retry'
                  : 'Send for Official Review'}
              </button>

              {/* Copy for Claude button */}
              <button
                onClick={handleCopyForClaude}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm border transition-all ${
                  copiedForClaude
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {copiedForClaude ? <CheckCircle size={16} /> : <Bot size={16} />}
                {copiedForClaude ? 'Copied to Clipboard!' : 'Copy for Claude'}
              </button>
            </div>

            {reviewStatus === 'error' && (
              <p className="text-xs text-red-500">
                Could not reach <span className="font-mono">{WEBHOOK_URL}</span>. Make sure the local MCP server is running.
              </p>
            )}

            {/* Payload preview */}
            <details className="group">
              <summary className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors list-none flex items-center gap-1">
                <span className="group-open:hidden">▶</span>
                <span className="hidden group-open:inline">▼</span>
                Preview Payload
              </summary>
              <pre className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(buildPayload(), null, 2)}
              </pre>
            </details>
          </div>
        </motion.div>
      )}
    </div>
  );
};
