import React, { useState } from 'react';
import { motion } from 'motion/react';
import { generateTemplate, TemplateResult } from '../services/geminiService';
import { Layout, Sparkles, Info } from 'lucide-react';

export const TemplateGenerator: React.FC = () => {
  const [mode, setMode] = useState('balanced');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TemplateResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const tpl = await generateTemplate(mode, notes);
      setResult(tpl);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Template Style</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'balanced', label: 'Balanced', desc: 'Adv vs Disadv' },
              { id: 'opinion', label: 'Strong Opinion', desc: 'Agree or Disagree' },
              { id: 'problem', label: 'Problem-Solution', desc: 'Causes & Fixes' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  mode === m.id 
                    ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`text-sm font-bold ${mode === m.id ? 'text-indigo-600' : 'text-slate-700'}`}>{m.label}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Custom Preferences (Optional)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. keep sentences concise; use cohesive devices (moreover, therefore)..."
            className="w-full min-h-[80px] p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={18} />
              Generate Template
            </>
          )}
        </button>
      </div>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Layout size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Your Custom Template</h3>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {result.template}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.tips.map((tip, i) => (
              <div key={i} className="flex gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="text-indigo-500 shrink-0"><Info size={18} /></div>
                <div className="text-sm text-slate-600">{tip}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
