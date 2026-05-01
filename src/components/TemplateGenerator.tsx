'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { generateTemplate, generateNormalEssay, TemplateResult, NormalEssay } from '../services/geminiService';
import { Sparkles, Clipboard, CheckCircle, Info, RotateCcw, FileText } from 'lucide-react';
import {
  ESSAY_TYPES, EssayTypeId, getEssayType,
  buildParagraphText,
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
const ACCENT_BORDER: Record<string, string> = {
  emerald: 'border-emerald-200 focus:ring-emerald-300',
  indigo:  'border-indigo-200 focus:ring-indigo-300',
  amber:   'border-amber-200 focus:ring-amber-300',
  rose:    'border-rose-200 focus:ring-rose-300',
};
const ACCENT_HEADER: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-800 border-b border-emerald-100',
  indigo:  'bg-indigo-50 text-indigo-800 border-b border-indigo-100',
  amber:   'bg-amber-50 text-amber-800 border-b border-amber-100',
  rose:    'bg-rose-50 text-rose-800 border-b border-rose-100',
};
const ACCENT_RESET: Record<string, string> = {
  emerald: 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100',
  indigo:  'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100',
  amber:   'text-amber-500 hover:text-amber-700 hover:bg-amber-100',
  rose:    'text-rose-400 hover:text-rose-700 hover:bg-rose-100',
};

const PARA_ROWS = [3, 6, 6, 3];

export const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({ topic = '' }) => {
  const [essayType, setEssayType] = useState<EssayTypeId>('discuss');
  const [paraTexts, setParaTexts] = useState<string[]>(['', '', '', '']);

  // loading: 'none' | 'template' | 'essay'
  const [loadingAction, setLoadingAction] = useState<'none' | 'template' | 'essay'>('none');
  const [templateResult, setTemplateResult] = useState<TemplateResult | null>(null);
  const [essayResult, setEssayResult] = useState<NormalEssay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [essayCopied, setEssayCopied] = useState(false);

  const typeDef = getEssayType(essayType);
  const accent = typeDef.accent;

  // Reset paragraph texts when essay type changes
  useEffect(() => {
    setParaTexts(typeDef.paragraphs.map(p => buildParagraphText(p, topic)));
    setTemplateResult(null);
    setEssayResult(null);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essayType]);

  const resetParagraph = (idx: number) => {
    const text = buildParagraphText(typeDef.paragraphs[idx], topic);
    setParaTexts(prev => { const n = [...prev]; n[idx] = text; return n; });
  };

  const handleParaChange = (idx: number, value: string) => {
    setParaTexts(prev => { const n = [...prev]; n[idx] = value; return n; });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paraTexts.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generates a new [placeholder]-style template and fills the textareas
  const handleAiTemplate = async () => {
    setLoadingAction('template');
    setError(null);
    setTemplateResult(null);
    try {
      const result = await generateTemplate(topic, essayType, 'template');
      setTemplateResult(result);
      // Split returned template into 4 paragraphs and fill textareas
      const parts = result.template.split(/\n\n+/);
      const padded: string[] = [...parts, '', '', '', ''].slice(0, 4);
      setParaTexts(padded);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to generate template right now.');
    } finally {
      setLoadingAction('none');
    }
  };

  // Generates a full written essay from the current template content
  const handleAiEssay = async () => {
    setLoadingAction('essay');
    setError(null);
    setEssayResult(null);
    try {
      const result = await generateNormalEssay(topic, '', paraTexts, essayType);
      setEssayResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to generate essay right now.');
    } finally {
      setLoadingAction('none');
    }
  };

  const handleCopyEssay = () => {
    if (!essayResult) return;
    navigator.clipboard.writeText(essayResult.essay);
    setEssayCopied(true);
    setTimeout(() => setEssayCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Essay Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ESSAY_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setEssayType(t.id)}
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

      {/* Action bar */}
      <div className="flex items-center gap-2 justify-between">
        {!topic ? (
          <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
            <Info size={12} /> Select a topic in Step 1 to fill in the template.
          </p>
        ) : <span />}

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {copied ? <CheckCircle size={13} /> : <Clipboard size={13} />}
            {copied ? 'Copied!' : 'Copy Template'}
          </button>

          <button
            onClick={handleAiTemplate}
            disabled={loadingAction !== 'none'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 transition-all"
          >
            {loadingAction === 'template'
              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Sparkles size={13} />}
            {loadingAction === 'template' ? 'Generating…' : 'AI Template'}
          </button>
        </div>
      </div>

      {/* Editable paragraph sections */}
      <div className="space-y-4">
        {typeDef.paragraphs.map((para, idx) => (
          <div key={para.section} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className={`flex items-center justify-between px-4 py-2.5 ${ACCENT_HEADER[accent]}`}>
              <div>
                <span className="font-bold text-sm">{para.section}</span>
                <span className="ml-2 text-[10px] font-normal opacity-60">{para.pattern}</span>
              </div>
              <button
                onClick={() => resetParagraph(idx)}
                className={`p-1.5 rounded-lg transition-colors ${ACCENT_RESET[accent]}`}
                title="Reset to default template"
              >
                <RotateCcw size={13} />
              </button>
            </div>
            <textarea
              value={paraTexts[idx]}
              onChange={e => handleParaChange(idx, e.target.value)}
              rows={PARA_ROWS[idx]}
              className={`w-full px-4 py-3 text-sm leading-relaxed text-slate-700 bg-white outline-none resize-y focus:ring-2 focus:ring-inset ${ACCENT_BORDER[accent]}`}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* AI Essay Generate button */}
      <button
        onClick={handleAiEssay}
        disabled={loadingAction !== 'none' || paraTexts.every(p => !p.trim())}
        className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
      >
        {loadingAction === 'essay'
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><FileText size={18} /> Generate AI Essay from Template</>}
      </button>

      {/* AI Essay Result */}
      {essayResult && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                <span className="font-bold text-sm text-indigo-800">AI Generated Essay</span>
                <span className="text-[10px] text-indigo-400 font-semibold">{essayResult.wordCount} words · {essayResult.score.pte}/5</span>
              </div>
              <button
                onClick={handleCopyEssay}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  essayCopied
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-indigo-200 text-indigo-600 hover:border-indigo-400'
                }`}
              >
                {essayCopied ? <CheckCircle size={12} /> : <Clipboard size={12} />}
                {essayCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{essayResult.essay}</p>
            </div>
          </div>

          {essayResult.notes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {essayResult.notes.map((note, i) => (
                <div key={i} className="flex gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <Info size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600">{note}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
