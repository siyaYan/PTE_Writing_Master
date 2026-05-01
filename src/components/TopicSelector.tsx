'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CAT_GRADS } from '../constants';
import topicsData from '../data/topics.json';
import { Shuffle, ChevronDown, ChevronUp } from 'lucide-react';

interface RawSource {
  source: string;
  number: string;
  original_title?: string;
  firefly_no?: number;
  title?: string;
}

interface ProcessedTopic {
  id: string;
  topic: string;
  topic_sentence: string;
  predict: boolean;
  cat: string;
  sourceLabel: string;
}

function categorize(topic: string): string {
  const t = topic.toLowerCase();
  if (/technolog|digital|\bai\b|artificial intelligence|social media|cyber|robot|automat|smartphone|software|cashless|e-learning|online.*learn|remote work|computer/.test(t)) return 'Technology';
  if (/environment|climat|pollution|nature|wildlife|renewable|fossil fuel|carbon|global warming|biodiversity|plastic|recycling|sustainab|ecology|conservation|deforest/.test(t)) return 'Environment';
  if (/education|school|student|universit|learning|teacher|curriculum|exam|college|classroom|degree|scholarship|homework|literacy|vocational|written examination|study/.test(t)) return 'Education';
  if (/health|medical|diet|fitness|mental.*health|disease|obes|exercise|hospital|medicine|wellbeing|nutrition|healthcare|vaccine|drug/.test(t)) return 'Health';
  if (/economy|economic|trade|business|market|financial|income|poverty|employment|unemploy|tax|wage|tourism|industry|commerce|globaliz|consumer|advertis/.test(t)) return 'Economy';
  if (/government|policy|laws? |regulat|democracy|legislation|justice|crime|punishment|political|authority|compulsory|mandatory/.test(t)) return 'Government';
  if (/science|research|genetic|space|innovation|experiment|nuclear/.test(t)) return 'Science';
  if (/\bmedia\b|news|journalism|television|film|entertainment|celebrity/.test(t)) return 'Media';
  if (/\bwork\b|\bjob\b|career|employee|employer|workplace|profession|labour|labor|workforce|volunteer|gap year|internship/.test(t)) return 'Work';
  if (/city|urban|rural|housing|transport|infrastructure|immigr/.test(t)) return 'Urban';
  return 'Society';
}

const ALL_TOPICS: ProcessedTopic[] = (
  topicsData.topics as Array<{
    topic: string;
    topic_sentence: string;
    predict: string;
    source: RawSource[];
  }>
).map((t, i) => ({
  id: `T${i}`,
  topic: t.topic,
  topic_sentence: t.topic_sentence,
  predict: t.predict === 'Y',
  cat: categorize(t.topic),
  sourceLabel: t.source.map(s => `${s.source} ${s.number}`).join(' · '),
}));

interface TopicSelectorProps {
  onTopicChange: (title: string, desc: string, isPredicted?: boolean, sourceId?: string) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({ onTopicChange }) => {
  const [predictedOnly, setPredictedOnly] = useState(false);
  const [activeCat, setActiveCat] = useState('All');
  const [selectedId, setSelectedId] = useState<string>('custom');
  const [customTitle, setCustomTitle] = useState('');
  const [hintOpen, setHintOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(ALL_TOPICS.map(t => t.cat));
    return ['All', ...Array.from(cats).sort()];
  }, []);

  const filteredTopics = useMemo(() => {
    let topics = predictedOnly ? ALL_TOPICS.filter(t => t.predict) : ALL_TOPICS;
    if (activeCat !== 'All') topics = topics.filter(t => t.cat === activeCat);
    return topics;
  }, [predictedOnly, activeCat]);

  const selectedTopic = selectedId !== 'custom' ? ALL_TOPICS.find(t => t.id === selectedId) ?? null : null;

  const handlePredictedToggle = () => {
    const next = !predictedOnly;
    setPredictedOnly(next);
    if (selectedTopic && next && !selectedTopic.predict) {
      setSelectedId('custom');
      onTopicChange(customTitle, '', false, '');
    }
  };

  const handleCatClick = (cat: string) => {
    setActiveCat(cat);
    if (selectedTopic && cat !== 'All' && selectedTopic.cat !== cat) {
      setSelectedId('custom');
      onTopicChange(customTitle, '', false, '');
    }
  };

  const handleRandomize = useCallback(() => {
    if (filteredTopics.length === 0) return;
    const pick = filteredTopics[Math.floor(Math.random() * filteredTopics.length)];
    setSelectedId(pick.id);
    setHintOpen(false);
    onTopicChange(pick.topic, pick.topic_sentence, pick.predict, pick.sourceLabel);
  }, [filteredTopics, onTopicChange]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    setHintOpen(false);
    if (id === 'custom') {
      onTopicChange(customTitle, '', false, '');
    } else {
      const t = ALL_TOPICS.find(t => t.id === id);
      if (t) onTopicChange(t.topic, t.topic_sentence, t.predict, t.sourceLabel);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTitle(val);
    if (selectedId === 'custom') onTopicChange(val, '', false, '');
  };

  const catCount = (cat: string) => {
    const base = predictedOnly ? ALL_TOPICS.filter(t => t.predict) : ALL_TOPICS;
    return cat === 'All' ? base.length : base.filter(t => t.cat === cat).length;
  };

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={handlePredictedToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${predictedOnly ? 'bg-indigo-500' : 'bg-slate-200'}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${predictedOnly ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700">
            Predicted Topics Only
          </span>
          {predictedOnly && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
              {ALL_TOPICS.filter(t => t.predict).length} topics
            </span>
          )}
        </label>

        <div className="flex-1" />

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleRandomize}
          disabled={filteredTopics.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Shuffle size={15} />
          Random Topic
        </motion.button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat, i) => {
          const grad = CAT_GRADS[i % CAT_GRADS.length];
          const isActive = activeCat === cat;
          const count = catCount(cat);
          if (count === 0) return null;
          return (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCatClick(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm border ${
                isActive ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200'
              }`}
              style={{
                background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                color: '#1e293b',
              }}
            >
              {cat} <span className="opacity-50">{count}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Topic Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Topic{' '}
              <span className="font-normal text-slate-400 normal-case tracking-normal">
                ({filteredTopics.length} available)
              </span>
            </label>
            <select
              value={selectedId}
              onChange={handleSelectChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="custom">Custom topic (type below)</option>
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.predict ? '★ ' : ''}{t.cat} — {t.topic}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Custom Topic / Notes
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={handleCustomChange}
              placeholder={selectedId === 'custom' ? 'Type your own topic...' : 'Add topic notes...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Selected Topic Card */}
        <AnimatePresence>
          {selectedTopic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden">
                {/* Topic prompt */}
                <div className="px-4 pt-4 pb-3 flex items-start gap-2">
                  {selectedTopic.predict && (
                    <span className="mt-0.5 shrink-0 text-[10px] font-bold bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Predicted
                    </span>
                  )}
                  <p className="text-base font-bold text-slate-900 leading-snug">
                    {selectedTopic.topic}
                  </p>
                </div>

                {/* Hint accordion */}
                <div className="border-t border-indigo-100">
                  <button
                    onClick={() => setHintOpen(h => !h)}
                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100/50 transition-colors"
                  >
                    <span>Hint — Topic Sentence Scaffold</span>
                    {hintOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {hintOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-indigo-800 leading-relaxed italic">
                          {selectedTopic.topic_sentence}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Source footer */}
                <div className="px-4 py-2 bg-white/60 border-t border-indigo-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Source
                  </span>
                  <span className="text-xs font-semibold text-slate-600 font-mono">
                    {selectedTopic.sourceLabel}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
