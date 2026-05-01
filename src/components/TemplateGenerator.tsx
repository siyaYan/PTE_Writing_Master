'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTemplate, TemplateResult } from '../services/geminiService';
import { Layout, Sparkles, Clipboard, CheckCircle, Info } from 'lucide-react';
import {
  ESSAY_TYPES, EssayTypeId, getEssayType,
  substituteTemplate, ParagraphDef,
} from '../data/essayTemplates';

interface TemplateGeneratorProps {
  topic?: string;
}

const ACCENT_ACTIVE: Record<string, string> = {
  emerald: 'bg-emerald-600 text-white ring-2 ring-emerald-300',
  indigo:  'bg-indigo-600 text-white ring-2 ring-indigo-300',
  amber:   'bg-amber-500 text-white ring-2 ring-amber-300',
  rose:    'bg-rose-600 text-white ring-2 ring-rose-300',
};
const ACCENT_IDLE: Record<string, string> = {
  emerald: 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300',
  indigo:  'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300',
  amber:   'bg-white text-slate-700 border border-slate-200 hover:border-amber-300',
  rose:    'bg-white text-slate-700 border border-slate-200 hover:border-rose-300',
};
const ACCENT_SECTION: Record<string, string> = {
  emerald: 'border-emerald-200 bg-emerald-50/40',
  indigo:  'border-indigo-200 bg-indigo-50/40',
  amber:   'border-amber-200 bg-amber-50/40',
  rose:    'border-rose-200 bg-rose-50/40',
};
const ACCENT_HEADER: Record<string, string> = {
  emerald: 'text-emerald-800 border-b border-emerald-200',
  indigo:  'text-indigo-800 border-b border-indigo-200',
  amber:   'text-amber-800 border-b border-amber-200',
  rose:    'text-rose-800 border-b border-rose-200',
};
const PLACEHOLDER_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800',
  indigo:  'bg-indigo-100 text-indigo-800',
  amber:   'bg-amber-100 text-amber-800',
  rose:    'bg-rose-100 text-rose-800',
};

function renderLine(text: string, topic: string, placeholderClass: string): React.ReactNode[] {
  const withTopic = text
    .replace(/\{topic\}/g, '\x00TOPIC\x00')
    .replace(/\{Topic\}/g, '\x00TOPICCAP\x00');
  const cap = topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : '[topic]';
  const parts = withTopic.split(/(\[[^\]]+\]|\x00TOPIC\x00|\x00TOPICCAP\x00)/g);
  return parts.map((p, i) => {
    if (p === '\x00TOPIC\x00') return <strong key={i} className="font-semibold underline underline-offset-2">{topic || '[topic]'}</strong>;
    if (p === '\x00TOPICCAP\x00') return <strong key={i} className="font-semibold underline underline-offset-2">{cap}</strong>;
    if (p.startsWith('[') && p.endsWith(']')) return <span key={i} className={`${placeholderClass} rounded px-0.5 font-medium`}>{p}</span>;
    return p;
  });
}

function StaticTemplate({ para, topic, accent }: { para: ParagraphDef; topic: string; accent: string }) {
  const phClass = PLACEHOLDER_COLOR[accent];
  return (
    <div className={`rounded-xl border ${ACCENT_SECTION[accent]} overflow-hidden`}>
      <div className={`px-4 py-2.5 font-bold text-sm ${ACCENT_HEADER[accent]}`}>
        {para.section}
        <span className="ml-2 text-[10px] font-normal opacity-60">{para.pattern}</span>
      </div>
      <div className="px-4 py-3 space-y-1.5 text-sm leading-relaxed text-slate-700">
        {para.sentences.map((s, i) => (
          <p key={i}>{renderLine(substituteTemplate(s.template, topic), topic, phClass)}</p>
        ))}
      </div>
    </div>
  );
}

export const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({ topic = '' }) => {
  const [essayType, setEssayType] = useState<EssayTypeId>('discuss');
  const [aiMode, setAiMode] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<TemplateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const typeDef = getEssayType(essayType);
  const accent = typeDef.accent;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setAiResult(null);
    try {
      const result = await generateTemplate(topic, essayType, notes || undefined);
      setAiResult(result);
      setAiMode(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to generate a template right now.');
    } finally {
      setLoading(false);
    }
  };

  const staticText = typeDef.paragraphs
    .map(p => p.sentences.map(s => substituteTemplate(s.template, topic)).join(' '))
    .join('\n\n');

  const handleCopy = () => {
    const text = aiMode && aiResult ? aiResult.template : staticText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Essay Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ESSAY_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setEssayType(t.id); setAiMode(false); setAiResult(null); }}
            className={`px-3 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              essayType === t.id ? ACCENT_ACTIVE[t.accent] : ACCENT_IDLE[t.accent]
            }`}
          >
            <div className="font-bold text-sm">{t.shortLabel}</div>
            <div className={`mt-0.5 font-normal text-[10px] leading-tight ${essayType === t.id ? 'opacity-80' : 'text-slate-400'}`}>
              {t.description}
            </div>
          </button>
        ))}
      </div>

      {/* Mode toggle bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiMode(false)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              !aiMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Static Template
          </button>
          <button
            onClick={() => aiResult && setAiMode(true)}
            disabled={!aiResult}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              aiMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 disabled:opacity-40'
            }`}
          >
            AI Version
          </button>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            copied ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
          }`}
        >
          {copied ? <CheckCircle size={13} /> : <Clipboard size={13} />}
          {copied ? 'Copied!' : 'Copy Template'}
        </button>
      </div>

      {/* Template Display */}
      <AnimatePresence mode="wait">
        {!aiMode ? (
          <motion.div key="static" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {!topic && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                <Info size={14} className="shrink-0" />
                Select a topic in Step 1 to substitute <span className="font-mono">[topic]</span> automatically.
              </div>
            )}
            {typeDef.paragraphs.map((para, i) => (
              <StaticTemplate key={i} para={para} topic={topic} accent={accent} />
            ))}
          </motion.div>
        ) : (
          <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {aiResult && (
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Layout size={16} />
                    </div>
                    <h3 className="font-bold text-slate-900">AI-Generated Essay</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{aiResult.template}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiResult.tips.map((tip, i) => (
                    <div key={i} className="flex gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generate section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Generate AI Version</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            AI will write a complete model essay for <strong>{topic || 'the selected topic'}</strong> using the <strong>{typeDef.label}</strong> pattern.
          </p>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional: extra instructions (e.g. keep it formal, use cohesive devices…)"
          rows={2}
          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-400 outline-none transition-all text-sm resize-none"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Sparkles size={16} /> Generate AI Essay</>
          )}
        </button>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}
      </div>
    </div>
  );
};
