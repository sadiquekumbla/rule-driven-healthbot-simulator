
import React, { useState } from 'react';
import { AdminRules, ConversationContext, TrainingExample, MediaTrigger, WhatsAppConfig } from '../types';
import { Save, RefreshCcw, Plus, Trash2, X, CheckCircle2, Zap, Brain, Terminal, Sliders, Key, AlertCircle, MessageSquare, Smartphone, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface AdminPanelProps {
  rules: AdminRules;
  context: ConversationContext;
  onSave: (rules: AdminRules) => void;
  onResetChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  onSimulateMessage?: (text: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ rules, context, onSave, onResetChat, isOpen, onClose }) => {
  const [localRules, setLocalRules] = useState<AdminRules>(() => ({
    ...rules,
    trainingExamples: rules.trainingExamples || [],
    mediaTriggers: rules.mediaTriggers || [],
    whatsappConfig: rules.whatsappConfig || {
      phoneNumberId: "",
      accessToken: "",
      verifyToken: "",
      webhookUrl: "",
      isEnabled: false
    }
  }));
  const [activeTab, setActiveTab] = useState<'rules' | 'training' | 'triggers' | 'api' | 'whatsapp'>('rules');
  const [hasSaved, setHasSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const addTrigger = () => {
    const newT: MediaTrigger = { id: Date.now().toString(), keyword: "", type: "video", url: "", botReply: "" };
    setLocalRules(prev => ({ ...prev, mediaTriggers: [...(prev.mediaTriggers || []), newT] }));
  };

  const updateTrigger = (id: string, field: keyof MediaTrigger, value: string) => {
    setLocalRules(prev => ({
      ...prev,
      mediaTriggers: (prev.mediaTriggers || []).map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  const addExample = () => {
    const newEx: TrainingExample = { id: Date.now().toString(), userPrompt: "", botResponse: "" };
    setLocalRules(prev => ({ ...prev, trainingExamples: [...(prev.trainingExamples || []), newEx] }));
  };

  const updateExample = (id: string, field: keyof TrainingExample, value: string) => {
    setLocalRules(prev => ({
      ...prev,
      trainingExamples: (prev.trainingExamples || []).map(ex => ex.id === id ? { ...ex, [field]: value } : ex)
    }));
  };

  const updateWhatsApp = (field: keyof WhatsAppConfig, value: string | boolean) => {
    setLocalRules(prev => ({
      ...prev,
      whatsappConfig: { ...prev.whatsappConfig, [field]: value as any }
    }));
  };

  const handleSave = () => {
    onSave(localRules);
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 800);
  };

  const handleSaveGeminiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gemini_api_key', trimmed);
    }
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[101] flex justify-end" onClick={onClose}>
      <div className="w-full md:w-[500px] bg-wa-bg border-l border-wa-border flex flex-col shadow-2xl animate-fade-in h-full" onClick={e => e.stopPropagation()}>
        <header className="p-6 bg-wa-surface border-b border-wa-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2 tracking-tight uppercase">System Control</h2>
            <p className="text-[11px] text-wa-muted font-bold uppercase tracking-widest mt-0.5">Admin & Engine Blueprint</p>
          </div>
          <X onClick={onClose} className="w-6 h-6 text-wa-muted cursor-pointer hover:text-wa-text" />
        </header>

        {/* Tab Navigation with horizontal scrolling for mobile responsiveness */}
        <div className="flex bg-wa-surface/30 px-2 pt-2 border-b border-wa-border shrink-0 overflow-x-auto scrollbar-hide">
          {(['rules', 'training', 'triggers', 'api', 'whatsapp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-none px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-wa-accent text-wa-accent' : 'border-transparent text-wa-muted hover:text-wa-text'}`}
            >
              {tab === 'api' ? 'Assistant API' : tab === 'whatsapp' ? 'WhatsApp API' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
          {activeTab === 'rules' && (
            <div className="space-y-8 animate-fade-in">
              <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-[32px] flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1">Quota Warning</p>
                  <p className="text-[10px] text-wa-muted font-medium leading-relaxed">
                    If you encounter "Quota Exceeded" errors, please switch to a paid API key in the Assistant API tab.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-wa-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-wa-accent" /> Engine Personality
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['gemini', 'openai', 'deepseek', 'claude'] as const).map(p => (
                    <button key={p} onClick={() => setLocalRules({ ...localRules, apiProvider: p })} className={`py-3 px-4 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-between ${localRules.apiProvider === p ? 'border-wa-accent bg-wa-accent/10 text-wa-accent shadow-lg' : 'border-wa-border bg-wa-surface/40 text-wa-muted'}`}>
                      <span className="capitalize">{p}</span>
                      {localRules.apiProvider === p && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-wa-muted uppercase tracking-[0.2em] flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-purple-400" /> Thinking Profile
                </label>
                <div className="flex flex-col gap-2">
                  {(['flash', 'reasoning', 'deepseek'] as const).map(m => (
                    <button key={m} onClick={() => setLocalRules({ ...localRules, engineMode: m })} className={`py-4 px-5 text-xs font-bold rounded-2xl border-2 transition-all text-left flex items-center justify-between ${localRules.engineMode === m ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-wa-border bg-wa-surface/40 text-wa-muted'}`}>
                      <div>
                        <span className="capitalize block">{m === 'reasoning' ? 'Professional Logic' : m === 'deepseek' ? 'Deep Reasoning R1' : 'Fast Response'}</span>
                        <span className="text-[10px] opacity-60 font-medium">{m === 'flash' ? 'Speed optimized' : m === 'reasoning' ? 'Clinical analysis' : 'Exhaustive thinking'}</span>
                      </div>
                      {localRules.engineMode === m && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-wa-accent/10 border border-wa-accent/20 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-wa-accent" />
                  <div>
                    <p className="text-xs font-bold text-wa-text">Few-Shot Training</p>
                    <p className="text-[10px] text-wa-muted font-medium uppercase mt-1">Teach by Example</p>
                  </div>
                </div>
                <button onClick={addExample} className="p-2 bg-wa-accent rounded-lg text-wa-bg hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {(localRules.trainingExamples || []).map(ex => (
                  <div key={ex.id} className="p-5 bg-wa-surface border border-wa-border rounded-3xl space-y-4 relative group">
                    <button onClick={() => setLocalRules(prev => ({ ...prev, trainingExamples: (prev.trainingExamples || []).filter(x => x.id !== ex.id) }))} className="absolute top-4 right-4 text-wa-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-wa-muted uppercase">User Prompt</label>
                      <textarea value={ex.userPrompt} onChange={e => updateExample(ex.id, 'userPrompt', e.target.value)} placeholder="e.g. I am 180cm tall" className="w-full bg-wa-bg border border-wa-border p-2.5 rounded-xl text-[12px] font-medium outline-none focus:border-wa-accent" rows={2} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-wa-muted uppercase">Bot Expected JSON Response</label>
                      <textarea value={ex.botResponse} onChange={e => updateExample(ex.id, 'botResponse', e.target.value)} placeholder='{"reply": "Great!", "context": {...}}' className="w-full bg-wa-bg border border-wa-border p-2.5 rounded-xl text-[10px] font-mono outline-none focus:border-wa-accent" rows={4} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-wa-accent/10 border border-wa-accent/20 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-wa-accent" />
                  <div>
                    <p className="text-xs font-bold text-wa-text">Media Triggers</p>
                    <p className="text-[10px] text-wa-muted font-medium uppercase mt-1">Keywords for Auto-Media</p>
                  </div>
                </div>
                <button onClick={addTrigger} className="p-2 bg-wa-accent rounded-lg text-wa-bg hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {(localRules.mediaTriggers || []).map(t => (
                  <div key={t.id} className="p-5 bg-wa-surface border border-wa-border rounded-3xl space-y-4 relative group animate-fade-in">
                    <button onClick={() => setLocalRules(prev => ({ ...prev, mediaTriggers: (prev.mediaTriggers || []).filter(x => x.id !== t.id) }))} className="absolute top-4 right-4 text-wa-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-wa-muted uppercase">Keyword</label>
                        <input value={t.keyword} onChange={e => updateTrigger(t.id, 'keyword', e.target.value)} placeholder="e.g. video" className="w-full bg-wa-bg border border-wa-border p-2.5 rounded-xl text-[12px] font-bold outline-none focus:border-wa-accent" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-wa-muted uppercase">Type</label>
                        <select value={t.type} onChange={e => updateTrigger(t.id, 'type', e.target.value as any)} className="w-full bg-wa-bg border border-wa-border p-2.5 rounded-xl text-[12px] font-bold outline-none">
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="audio">Audio</option>
                          <option value="document">Document</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-wa-muted uppercase">Media URL</label>
                      <input value={t.url} onChange={e => updateTrigger(t.id, 'url', e.target.value)} placeholder="https://..." className="w-full bg-wa-bg border border-wa-border p-2.5 rounded-xl text-[10px] font-mono outline-none focus:border-wa-accent" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-wa-muted uppercase">Bot Reply Text</label>
                      <textarea value={t.botReply} onChange={e => updateTrigger(t.id, 'botReply', e.target.value)} placeholder="Here is your media..." className="w-full bg-wa-bg border border-wa-border p-2.5 rounded-xl text-[12px] font-medium outline-none focus:border-wa-accent" rows={2} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-8 animate-fade-in">
              <div className="p-6 bg-wa-accent/10 border border-wa-accent/30 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-wa-accent" />
                  <h5 className="text-[11px] font-black text-wa-accent uppercase tracking-[0.2em]">API Key Management</h5>
                </div>
                <p className="text-[10px] text-wa-muted font-medium leading-relaxed">
                  This Gemini API key is stored locally in this browser and used for all conversations. You can update it anytime.
                </p>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-wa-muted uppercase tracking-[0.2em]">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-[12px] font-mono outline-none focus:border-wa-accent"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    disabled={!apiKeyInput.trim()}
                    className={`w-full py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-wa-accent/10 transition-all ${
                      apiKeySaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-wa-accent text-wa-bg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {apiKeySaved ? 'Key Saved' : 'Save API Key'}
                  </button>
                  <p className="text-[9px] text-wa-muted mt-1">
                    Tip: For production on Vercel, also set <code>GEMINI_API_KEY</code> in your environment variables.
                  </p>
                </div>
              </div>

              <div className="p-6 bg-wa-surface border border-wa-border rounded-[32px] space-y-6">
                <h5 className="text-[10px] font-black text-wa-muted uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4" /> Technical Parameters
                </h5>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-wa-muted uppercase">Temperature: {localRules.temperature}</label>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={localRules.temperature}
                      onChange={e => setLocalRules({ ...localRules, temperature: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-wa-border rounded-lg appearance-none cursor-pointer accent-wa-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-500" />
                  <h5 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">WhatsApp Cloud Setup</h5>
                </div>
                <p className="text-[10px] text-wa-muted font-medium leading-relaxed">
                  Configure your Meta Business App credentials to sync this simulator with real WhatsApp numbers.
                </p>
                <div className="flex items-center justify-between p-3 bg-wa-bg/50 border border-wa-border rounded-xl">
                  <span className="text-[11px] font-bold text-wa-text uppercase tracking-widest">Enable Integration</span>
                  <button
                    onClick={() => updateWhatsApp('isEnabled', !localRules.whatsappConfig.isEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${localRules.whatsappConfig.isEnabled ? 'bg-wa-accent' : 'bg-wa-border'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localRules.whatsappConfig.isEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="p-5 bg-wa-surface border border-wa-border rounded-[32px] space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-wa-muted uppercase tracking-widest">Phone Number ID</label>
                  <input
                    value={localRules.whatsappConfig.phoneNumberId}
                    onChange={e => updateWhatsApp('phoneNumberId', e.target.value)}
                    placeholder="e.g. 1042304928..."
                    className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-[12px] font-mono outline-none focus:border-wa-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-wa-muted uppercase tracking-widest">Permanent Access Token</label>
                  <textarea
                    value={localRules.whatsappConfig.accessToken}
                    onChange={e => updateWhatsApp('accessToken', e.target.value)}
                    placeholder="EAAG..."
                    className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-[10px] font-mono outline-none focus:border-wa-accent"
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-wa-muted uppercase tracking-widest">Verify Token (Webhook)</label>
                  <input
                    value={localRules.whatsappConfig.verifyToken}
                    onChange={e => updateWhatsApp('verifyToken', e.target.value)}
                    placeholder="mysecrettoken123"
                    className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-[12px] font-mono outline-none focus:border-wa-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-wa-muted uppercase tracking-widest">Webhook URL Endpoint</label>
                  <input
                    value={localRules.whatsappConfig.webhookUrl}
                    onChange={e => updateWhatsApp('webhookUrl', e.target.value)}
                    placeholder="https://.../api/webhook"
                    className="w-full bg-wa-bg border border-wa-border p-3.5 rounded-2xl text-[12px] font-mono outline-none focus:border-wa-accent"
                  />
                  <p className="text-[9px] text-wa-muted/60 mt-1 font-medium">Auto-configured Vercel Endpoint (Editable)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="p-6 border-t border-wa-border bg-wa-surface flex gap-4 shrink-0">
          <button onClick={handleSave} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-500 shadow-xl ${hasSaved ? 'bg-emerald-600 text-white' : 'bg-wa-accent text-wa-bg'}`}>
            {hasSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {hasSaved ? 'Config Saved' : 'Sync Changes'}
          </button>
          <button onClick={onResetChat} className="w-14 h-14 rounded-2xl border border-wa-border flex items-center justify-center hover:bg-wa-bg transition-all group">
            <RefreshCcw className="w-6 h-6 text-wa-muted group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminPanel;
