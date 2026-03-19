'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PTE_TOPICS, CAT_GRADS } from '../constants';

interface TopicSelectorProps {
  onTopicChange: (title: string, desc: string) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({ onTopicChange }) => {
  const [activeCat, setActiveCat] = useState('All');
  const [selectedId, setSelectedId] = useState('custom');
  const [customTitle, setCustomTitle] = useState('');

  const categories = useMemo(() => {
    const cats = new Set(PTE_TOPICS.map(t => t.cat));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredTopics = useMemo(() => {
    if (activeCat === 'All') return PTE_TOPICS;
    return PTE_TOPICS.filter(t => t.cat === activeCat);
  }, [activeCat]);

  const handleCatClick = (cat: string) => {
    setActiveCat(cat);
    setSelectedId('custom');
    onTopicChange(customTitle, '');
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    if (id === 'custom') {
      onTopicChange(customTitle, '');
    } else {
      const topic = PTE_TOPICS.find(t => t.id === id);
      if (topic) {
        onTopicChange(topic.title, topic.desc);
      }
    }
  };

  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTitle(val);
    if (selectedId === 'custom') {
      onTopicChange(val, '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat, i) => {
          const grad = CAT_GRADS[i % CAT_GRADS.length];
          const isActive = activeCat === cat;
          return (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCatClick(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border ${
                isActive 
                  ? 'ring-2 ring-indigo-500 border-transparent' 
                  : 'border-slate-200'
              }`}
              style={{
                background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`,
                color: '#1e293b'
              }}
            >
              {cat}
            </motion.button>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Topic</label>
            <select 
              value={selectedId}
              onChange={handleSelectChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="custom">Custom topic (type below)</option>
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>[{t.cat}] {t.title}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Custom Topic / Notes</label>
            <input 
              type="text"
              value={customTitle}
              onChange={handleCustomTitleChange}
              placeholder={selectedId === 'custom' ? "Type your own topic..." : "Add topic notes..."}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <AnimatePresence>
          {selectedId !== 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-slate-600 italic border-l-2 border-indigo-200 pl-3 py-1"
            >
              {PTE_TOPICS.find(t => t.id === selectedId)?.desc}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
