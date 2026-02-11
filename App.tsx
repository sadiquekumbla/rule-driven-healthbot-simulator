
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, AdminRules, ConversationContext, Client, MediaTrigger } from './types';
import { DEFAULT_RULES, INITIAL_COURSES } from './constants';
import { HealthBotService } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import Analysis from './components/Analysis';
import ClientList from './components/ClientList';
import Courses from './components/Courses';
import Login from './components/Login';
import { Send, MoreVertical, Phone, Video, Paperclip, Brain, Zap, Sparkles, LayoutDashboard, MessageSquare, Globe, PieChart, Mic, Square, Trash2, BookOpen, Image as ImageIcon, FileText, UserCircle, Key, Settings as SettingsIcon, ChevronLeft, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'chat' | 'dashboard' | 'analysis' | 'courses'>('chat');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('healthcore_is_authenticated') === 'true';
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem("gemini_api_key")) {
      return true;
    }
    // Check env vars synchronously if possible or default to false
    // @ts-ignore
    const env: any = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
    return !!(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY);
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const [rules, setRules] = useState<AdminRules>(() => {
    const base = { ...DEFAULT_RULES };
    // Pre-fill webhook URL if client-side
    if (typeof window !== 'undefined') {
      base.whatsappConfig = {
        ...base.whatsappConfig,
        webhookUrl: `${window.location.origin}/api/webhook`,
        verifyToken: base.whatsappConfig?.verifyToken || 'mysecrettoken123'
      };
    }
    base.systemPrompt = base.systemPrompt.replace('{COURSES_LIST}', INITIAL_COURSES.map(c => c.title).join(', '));
    return base;
  });

  const [botService] = useState(() => new HealthBotService(rules));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simplified key check effect that mainly handles AI Studio check
  useEffect(() => {
    const checkKey = async () => {
      // If we already have a key from init state (localStorage/env), we're good usually.
      // But let's check AI Studio just in case user wants to use that.
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === "function") {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          if (selected) setHasKey(true);
        } catch (err) {
          console.error("AI Studio key check failed", err);
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelection = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === "function") {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        return;
      } catch (err) {
        console.error("Key selection failed", err);
      }
    }

    // Fallback: allow manual Gemini API key entry
    setShowKeyInput(true);
  };

  const handleSaveManualKey = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("gemini_api_key", trimmed);
    }
    setHasKey(true);
    setShowKeyInput(false);
    setApiKeyInput("");
  };

  const activeClient = useMemo(() =>
    clients.find(c => c.id === activeClientId) || null
    , [clients, activeClientId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (view === 'chat' && activeClient) {
      scrollToBottom(activeClient.messages.length <= 1 ? "auto" : "smooth");
    }
  }, [activeClient?.messages.length, isTyping, view, scrollToBottom]);

  const createNewClient = useCallback(async () => {
    const newId = `client-${Date.now()}`;
    const newClient: Client = {
      id: newId,
      name: `Lead #${clients.length + 1}`,
      messages: [],
      context: {
        age: null, height: null, weight: null, bmi: null, bmiCategory: null,
        medicalConditions: null, suggestedCourse: null, priceQuote: null, stage: 'GREETING'
      },
      createdAt: new Date(),
      lastMessageAt: new Date()
    };

    setClients(prev => [...prev, newClient]);
    setActiveClientId(newId);
    setView('chat');
    botService.reset();
  }, [clients.length, botService]);

  useEffect(() => {
    if (clients.length === 0) createNewClient();
  }, [clients.length, createNewClient]);

  const checkForTriggers = (text: string): MediaTrigger | null => {
    const lowText = text.toLowerCase();
    return (rules.mediaTriggers || []).find(t => lowText.includes(t.keyword.toLowerCase())) || null;
  };

  // Fix: Implemented handleUpdateRules to bridge AdminPanel and HealthBotService
  const handleUpdateRules = useCallback((newRules: AdminRules) => {
    setRules(newRules);
    botService.updateRules(newRules);
  }, [botService]);

  const handleSend = async (customValue?: string, audioData?: { data: string, mimeType: string }) => {
    const valueToSend = customValue || inputValue;
    if (!valueToSend.trim() && !audioData && !activeClientId) return;

    if (valueToSend.toLowerCase().includes('manual')) {
      const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text: "Requesting manual assistant...", timestamp: new Date() };
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, messages: [...c.messages, userMsg], lastMessageAt: new Date() } : c));
      setInputValue('');
      setIsTyping(true);
      setTimeout(() => {
        const botMsg: Message = { id: `bot-${Date.now()}`, role: 'model', text: "Human coach coming in. Sit tight! 🎧", timestamp: new Date() };
        setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, messages: [...c.messages, botMsg], lastMessageAt: new Date() } : c));
        setIsTyping(false);
      }, 1000);
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: audioData ? "🎤 Voice Message" : valueToSend,
      timestamp: new Date()
    };

    setClients(prev => prev.map(c =>
      c.id === activeClientId ? { ...c, messages: [...c.messages, userMsg], lastMessageAt: new Date() } : c
    ));
    setInputValue('');
    setIsTyping(true);
    setShowAttachmentMenu(false);

    const trigger = checkForTriggers(valueToSend);
    try {
      const result = await botService.sendMessage(valueToSend, audioData);

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: trigger ? trigger.botReply : result.reply,
        thought: result.thought,
        timestamp: new Date(),
        attachment: trigger ? {
          type: trigger.type,
          url: trigger.url,
          name: trigger.keyword
        } : undefined
      };

      setClients(prev => prev.map(c =>
        c.id === activeClientId ? { ...c, messages: [...c.messages, botMsg], context: result.context, lastMessageAt: new Date() } : c
      ));
    } catch (e: any) {
      if (e.message?.includes("API key not valid") || e.message?.includes("key expired")) {
        setHasKey(false);
      }
      // Quota errors or other errors should just show the message, not force re-entry of key unless it's actually invalid.
      const botMsg: Message = {
        id: `bot-err-${Date.now()}`,
        role: 'model',
        text: "My brain's a bit tired (API Quota). Mind connecting a paid key in the control panel? 😅",
        timestamp: new Date()
      };
      setClients(prev => prev.map(c => c.id === activeClientId ? { ...c, messages: [...c.messages, botMsg] } : c));
    }
    setIsTyping(false);
  };

  const quickReplies = [
    "I weight 80kg",
    "How much for the course?",
    "Show exercise video",
    "Talk to human 🎧"
  ];

  const startRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const duration = Date.now() - recordingStartTimeRef.current;
        if (duration < 600) {
          console.warn("Too short");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          handleSend(undefined, { data: base64Audio, mimeType: 'audio/webm' });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);

      // Haptic feedback for recording start if available
      if ('vibrate' in navigator) navigator.vibrate(50);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Mic access required for this.");
    }
  };

  const stopRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if ('vibrate' in navigator) navigator.vibrate(20);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showChatArea = !isMobile || (isMobile && activeClientId !== null);
  const showSidebar = !isMobile || (isMobile && activeClientId === null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen bg-wa-bg text-wa-text font-sans antialiased overflow-hidden selection:bg-wa-accent/30">
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-wa-bg text-wa-text font-sans antialiased overflow-hidden selection:bg-wa-accent/30">
      {!hasKey && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-wa-surface border border-wa-border p-8 rounded-[32px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              <Key className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black mb-3">Sync Your Key</h2>
            <p className="text-wa-muted text-sm mb-8 leading-relaxed font-medium">
              We need a Gemini API key from a billing project to keep these simulation engines running smooth.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleOpenKeySelection}
                className="w-full bg-wa-accent text-wa-bg py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all"
              >
                Connect Paid Key
              </button>
              <button onClick={() => setHasKey(true)} className="block w-full text-[10px] font-black text-wa-muted uppercase tracking-widest py-2">Try anyway</button>
              <div className="pt-4 border-t border-wa-border/50">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] font-black text-wa-accent hover:underline uppercase tracking-widest">Docs</a>
              </div>
              {showKeyInput && (
                <div className="mt-4 text-left space-y-2">
                  <label className="block text-[10px] font-black text-wa-muted uppercase tracking-[0.18em]">
                    Paste Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-wa-bg/80 border border-wa-border/70 text-xs outline-none focus:border-wa-accent focus:ring-1 focus:ring-wa-accent/60 transition-all"
                    placeholder="AIza..."
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualKey}
                    disabled={!apiKeyInput.trim()}
                    className="w-full bg-wa-accent/90 text-wa-bg py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-[0.22em] shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Save API Key
                  </button>
                  <p className="text-[9px] text-wa-muted mt-1">
                    Key is stored locally in this browser only and used to call the Gemini API.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="h-[56px] bg-wa-surface border-b border-wa-border flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-2 cursor-default shrink-0">
            <div className="w-8 h-8 rounded-xl bg-wa-accent flex items-center justify-center shadow-lg shadow-wa-accent/20">
              <Zap className="w-5 h-5 text-wa-bg fill-current" />
            </div>
            <span className="hidden md:inline text-sm font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-wa-accent to-emerald-400 uppercase">HEALTHCORE</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide shrink">
            <button onClick={() => setView('chat')} className={`nav-btn shrink-0 ${view === 'chat' ? 'active' : ''}`}><MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Sim</span></button>
            <button onClick={() => setView('courses')} className={`nav-btn shrink-0 ${view === 'courses' ? 'active' : ''}`}><BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Plans</span></button>
            <button onClick={() => setView('dashboard')} className={`nav-btn shrink-0 ${view === 'dashboard' ? 'active' : ''}`}><LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Stats</span></button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="w-9 h-9 rounded-xl bg-wa-border/40 hover:bg-wa-border/70 border border-wa-border/60 flex items-center justify-center text-wa-muted hover:text-wa-accent transition-all"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className={`flex-1 overflow-hidden relative ${view === 'chat' ? 'app-container' : 'flex flex-col'}`}>
        {view === 'chat' && showSidebar && (
          <aside className="border-r border-wa-border bg-wa-bg flex flex-col shrink-0 z-20 h-full overflow-hidden">
            <ClientList
              clients={clients}
              activeClientId={activeClientId}
              onSelectClient={(id) => setActiveClientId(id)}
              onNewChat={createNewClient}
            />
          </aside>
        )}

        <main className={`flex-1 flex flex-col relative bg-wa-bg z-10 overflow-hidden h-full ${!showChatArea && isMobile ? 'hidden' : ''}`}>
          {view === 'chat' ? (
            activeClient ? (
              <>
                <header className="h-[60px] bg-wa-surface flex items-center justify-between px-3 border-b border-wa-border z-20 shadow-sm">
                  <div className="flex items-center gap-2">
                    {isMobile && (
                      <button onClick={() => setActiveClientId(null)} className="p-2 -ml-1 text-wa-muted hover:text-wa-text">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-full bg-wa-border/40 p-0.5 overflow-hidden border border-wa-border">
                      <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${rules.botName}`} className="w-full h-full" alt="Bot" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="font-bold text-[14px] tracking-tight truncate">{rules.botName}</h1>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-wa-accent rounded-full animate-pulse"></div>
                        <p className="text-[10px] text-wa-accent font-black uppercase tracking-widest">Natural Flow</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 text-wa-muted shrink-0">
                    <Video className="w-5 h-5 cursor-pointer hover:text-wa-text hidden sm:block" />
                    <Phone className="w-4.5 h-4.5 cursor-pointer hover:text-wa-text hidden sm:block" />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-wa-text" />
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3 relative bg-[#0b141a] scrollbar-hide">
                  <div className="whatsapp-dark-pattern"></div>
                  <div className="max-w-[800px] mx-auto relative z-10">
                    <div className="flex justify-center mb-6">
                      <span className="bg-[#182229] text-[9px] font-black text-wa-muted px-4 py-1.5 rounded-lg uppercase tracking-widest border border-wa-border/30">MESSAGES ENCRYPTED</span>
                    </div>
                    {activeClient.messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                    {isTyping && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="bg-wa-received text-wa-text px-4 py-2.5 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1.5 border border-wa-border/40">
                          <div className="w-1.5 h-1.5 bg-wa-accent rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-wa-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-wa-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>

                <div className="px-4 py-2 bg-wa-bg/80 border-t border-wa-border/40 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                  {quickReplies.map((r, i) => (
                    <button key={i} onClick={() => handleSend(r)} className="shrink-0 bg-wa-surface border border-wa-border px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight text-wa-accent hover:bg-wa-accent hover:text-wa-bg transition-all active:scale-95">
                      {r}
                    </button>
                  ))}
                </div>

                <footer className="h-[70px] bg-wa-surface flex items-center gap-3 px-3 border-t border-wa-border z-20 relative shrink-0">
                  {showAttachmentMenu && (
                    <div className="absolute bottom-[80px] left-3 bg-wa-surface border border-wa-border p-3 rounded-2xl shadow-2xl flex flex-col gap-1 z-50 animate-fade-in">
                      <button onClick={() => handleSend("Trigger image context")} className="flex items-center gap-3 px-4 py-2 hover:bg-wa-bg rounded-xl text-[11px] font-bold text-wa-accent transition-colors">
                        <ImageIcon className="w-4 h-4" /> Image
                      </button>
                      <button onClick={() => handleSend("Exercise video")} className="flex items-center gap-3 px-4 py-2 hover:bg-wa-bg rounded-xl text-[11px] font-bold text-wa-accent transition-colors">
                        <Video className="w-4 h-4" /> Video
                      </button>
                      <button onClick={() => handleSend("Get health report")} className="flex items-center gap-3 px-4 py-2 hover:bg-wa-bg rounded-xl text-[11px] font-bold text-wa-accent transition-colors">
                        <FileText className="w-4 h-4" /> Doc
                      </button>
                    </div>
                  )}

                  <Paperclip
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={`w-6 h-6 cursor-pointer transition-colors shrink-0 ${showAttachmentMenu ? 'text-wa-accent' : 'text-wa-muted hover:text-wa-text'}`}
                  />

                  <div className="flex-1 bg-wa-border/40 rounded-2xl flex items-center px-4 py-3 transition-all focus-within:bg-wa-border/60 overflow-hidden min-h-[48px]">
                    {isRecording ? (
                      <div className="flex items-center gap-3 animate-pulse text-red-500">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
                        <span className="text-[13px] font-black uppercase tracking-widest">RECORDING {formatTime(recordingTime)}</span>
                        <span className="text-[10px] text-wa-muted font-bold ml-auto opacity-50">Release to Send</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Say hi..."
                        className="flex-1 bg-transparent outline-none text-[15px] text-wa-text placeholder-wa-muted/60"
                      />
                    )}
                  </div>

                  <div className="flex shrink-0">
                    {inputValue.trim() ? (
                      <button onClick={() => handleSend()} className="w-11 h-11 bg-wa-accent text-wa-bg rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                        <Send className="w-5.5 h-5.5 ml-0.5" />
                      </button>
                    ) : (
                      <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        onTouchCancel={stopRecording}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 touch-none select-none ${isRecording ? 'bg-red-500 scale-125 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-wa-accent text-wa-bg shadow-md active:scale-95'}`}
                      >
                        {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5.5 h-5.5" />}
                      </button>
                    )}
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 whatsapp-dark-pattern-container">
                <div className="whatsapp-dark-pattern"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-wa-surface rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl border border-wa-border">
                    <UserCircle className="w-10 h-10 text-wa-accent opacity-50" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-wa-text mb-4">Select a Chat</h2>
                  <p className="text-wa-muted text-sm mb-10 max-w-xs font-medium">Pick a lead or start a new simulation to test the natural flow.</p>
                  <button onClick={createNewClient} className="bg-wa-accent text-wa-bg px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">New Assessment</button>
                </div>
              </div>
            )
          ) : view === 'courses' ? (
            <div className="flex-1 overflow-hidden animate-fade-in bg-wa-bg"><Courses activeClient={activeClient} /></div>
          ) : view === 'dashboard' ? (
            <div className="flex-1 overflow-hidden animate-fade-in bg-wa-bg"><Dashboard clients={clients} activeClient={activeClient} rules={rules} /></div>
          ) : (
            <div className="flex-1 overflow-hidden animate-fade-in bg-wa-bg"><Analysis clients={clients} rules={rules} /></div>
          )}
        </main>
      </div>

      <AdminPanel
        rules={rules}
        context={activeClient?.context || {} as any}
        onSave={handleUpdateRules}
        onResetChat={() => {
          setActiveClientId(null);
          setClients([]);
        }}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <style>{`
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.2s ease-in-out;
          color: #8696a0;
        }
        .nav-btn:hover { color: #e9edef; background: rgba(255, 255, 255, 0.05); }
        .nav-btn.active { color: #00a884; background: rgba(0, 168, 132, 0.1); }
      `}</style>
    </div>
  );
};

export default App;
