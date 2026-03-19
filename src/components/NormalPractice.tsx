import React, { useState } from 'react';
import { motion } from 'motion/react';
import { generateNormalEssay, NormalEssay } from '../services/geminiService';
import { FileText, Sparkles, Clipboard } from 'lucide-react';

interface NormalPracticeProps {
  topic: string;
  desc: string;
}

export const NormalPractice: React.FC<NormalPracticeProps> = ({ topic, desc }) => {
  const [sentences, setSentences] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalEssay | null>(null);

  const handleSentenceChange = (index: number, value: string) => {
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
  };

  const handleGenerate = async () => {
    if (sentences.some(s => !s.trim())) return;
    setLoading(true);
    try {
      const essay = await generateNormalEssay(topic, desc, sentences);
      setResult(essay);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.essay) {
      navigator.clipboard.writeText(result.essay);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Complex #1 (Advantage)', placeholder: 'While technology enables...' },
          { label: 'Complex #2 (Advantage)', placeholder: 'Furthermore, it is often argued...' },
          { label: 'Complex #3 (Disadvantage)', placeholder: 'Conversely, some critics point out...' },
          { label: 'Simple #1 (Advantage)', placeholder: 'This leads to better efficiency.' },
          { label: 'Simple #2 (Disadvantage)', placeholder: 'However, costs can be high.' }
        ].map((item, i) => (
          <div key={i} className={i === 4 ? 'md:col-span-2' : ''}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</label>
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
                title="Copy to clipboard"
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
        </motion.div>
      )}
    </div>
  );
};
