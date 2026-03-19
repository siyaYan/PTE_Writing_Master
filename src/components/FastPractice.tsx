import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getFastFeedback, FastFeedback } from '../services/geminiService';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface FastPracticeProps {
  topic: string;
  desc: string;
}

export const FastPractice: React.FC<FastPracticeProps> = ({ topic, desc }) => {
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FastFeedback | null>(null);
  const [expandedAdvice, setExpandedAdvice] = useState(false);

  const handleAnalyze = async () => {
    if (!sentence.trim()) return;
    setLoading(true);
    try {
      const result = await getFastFeedback(topic, desc, sentence);
      setFeedback(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (score: number) => {
    if (score <= 2) return 'var(--score-red)';
    if (score === 3) return 'var(--score-amber)';
    return 'var(--score-green)';
  };

  const highlightSentence = (original: string, issues: FastFeedback['issues']) => {
    if (!issues || issues.length === 0) return original;
    
    const sortedIssues = [...issues].sort((a, b) => a.start - b.start);
    let result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedIssues.forEach((issue, idx) => {
      if (issue.start > lastIndex) {
        result.push(original.substring(lastIndex, issue.start));
      }
      result.push(
        <mark key={idx} className="bg-yellow-200 px-0.5 rounded cursor-help group relative">
          {original.substring(issue.start, issue.end)}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-10">
            <strong>{issue.label}:</strong> {issue.reason}
          </span>
        </mark>
      );
      lastIndex = issue.end;
    });

    if (lastIndex < original.length) {
      result.push(original.substring(lastIndex));
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Your Topic Sentence</label>
          <textarea 
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Write one complex topic sentence here..."
            className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={loading || !sentence.trim()}
          className="w-full py-3 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={18} />
              Analyze Sentence
            </>
          )}
        </button>
      </div>

      {feedback && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-10 gap-6"
        >
          {/* Left Panel: Score Ring */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <motion.circle 
                  cx="60" cy="60" r="46" fill="none" 
                  stroke={getBandColor(feedback.score.pte)} 
                  strokeWidth="12" 
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "289 289", strokeDashoffset: 289 }}
                  animate={{ strokeDashoffset: 289 - (feedback.score.pte / 5) * 289 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900">{feedback.score.pte}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Score / 5</span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-4">
              {[
                { label: 'Complexity', val: feedback.structure.complexity },
                { label: 'Clarity', val: feedback.structure.clarity },
                { label: 'Coherence', val: feedback.structure.coherence }
              ].map(m => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{m.label}</span>
                    <span>{m.val}/5</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.val / 5) * 100}%` }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-slate-500 leading-relaxed">
              <p className={expandedAdvice ? '' : 'line-clamp-3'}>{feedback.advice}</p>
              <button 
                onClick={() => setExpandedAdvice(!expandedAdvice)}
                className="text-indigo-600 font-semibold mt-1 flex items-center gap-1"
              >
                {expandedAdvice ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> Read Full Advice</>}
              </button>
            </div>
          </div>

          {/* Right Panel: Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analysis</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-lg leading-relaxed font-medium text-slate-800">
                {highlightSentence(sentence, feedback.issues)}
              </div>
              
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Fixes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {feedback.issues.map((issue, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-sm">
                      <span className="font-bold text-indigo-600 mr-2">{issue.label}:</span>
                      <span className="text-slate-600">{issue.suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Corrected Version</h3>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-lg leading-relaxed font-semibold text-indigo-900">
                {feedback.corrected}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {feedback.recommendedExpressions.map((exp, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                    {exp}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Upgraded Alternatives</h3>
              <div className="space-y-3">
                {feedback.alternatives.map((alt, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm italic text-slate-600">
                    {alt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
