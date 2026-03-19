'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TopicSelector } from './components/TopicSelector';
import { FastPractice } from './components/FastPractice';
import { NormalPractice } from './components/NormalPractice';
import { TemplateGenerator } from './components/TemplateGenerator';
import { BookOpen, Zap, FileText, Layout } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'fast' | 'normal' | 'template'>('fast');
  const [topic, setTopic] = useState({ title: '', desc: '' });

  const handleTopicChange = (title: string, desc: string) => {
    setTopic({ title, desc });
  };

  const tabs = [
    { id: 'fast', label: 'Fast Practice', icon: <Zap size={18} />, desc: 'One sentence feedback' },
    { id: 'normal', label: 'Normal Mode', icon: <FileText size={18} />, desc: 'Build full essay' },
    { id: 'template', label: 'Templates', icon: <Layout size={18} />, desc: 'AI Generator' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <header className="bg-white border-b border-slate-200 pt-12 pb-8 px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center gap-3 text-indigo-600">
            <BookOpen size={28} strokeWidth={2.5} />
            <h1 className="text-3xl font-black tracking-tighter uppercase">PTE Writing Master</h1>
          </div>
          <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">
            Master the art of topic sentences and essay structure. 
            Choose a mode below to start your 5-minute practice session.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        {/* Topic Selection - Global for all modes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Step 1: Choose Context</h2>
          </div>
          <TopicSelector onTopicChange={handleTopicChange} />
        </section>

        {/* Mode Selection Tabs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Step 2: Practice Mode</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-5 rounded-3xl border text-left transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl w-fit mb-4 transition-colors ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-500'
                }`}>
                  {tab.icon}
                </div>
                <div className={`font-bold text-lg ${activeTab === tab.id ? 'text-white' : 'text-slate-900'}`}>
                  {tab.label}
                </div>
                <div className={`text-xs font-medium ${activeTab === tab.id ? 'text-slate-400' : 'text-slate-500'}`}>
                  {tab.desc}
                </div>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-indigo-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Active Panel */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'fast' && <FastPractice topic={topic.title} desc={topic.desc} />}
                {activeTab === 'normal' && <NormalPractice topic={topic.title} desc={topic.desc} />}
                {activeTab === 'template' && <TemplateGenerator />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 mt-20 py-8 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            © 2026 PTE Writing Master · AI Powered
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest">Terms</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
