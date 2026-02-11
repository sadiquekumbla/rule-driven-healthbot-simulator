
import React, { useState } from 'react';
import { Message } from '../types';
import { ChevronDown, ChevronUp, Brain, Mic, CheckCheck, Play, Download, FileText } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const [showThought, setShowThought] = useState(false);
  const isBot = message.role === 'model';
  const isVoice = message.text.includes("🎤 Voice Message");
  
  return (
    <div className={`flex w-full mb-3 animate-fade-in will-change-transform ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[90%] sm:max-w-[85%] md:max-w-[70%] px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl shadow-md relative ${
          isBot 
            ? 'bg-wa-received text-wa-text rounded-tl-none border border-wa-border/40' 
            : 'bg-wa-sent text-wa-text rounded-tr-none'
        }`}
      >
        {isBot && message.thought && (
          <div className="mb-2 md:mb-3 border-b border-wa-border/50 pb-2 md:pb-2.5">
            <button 
              onClick={() => setShowThought(!showThought)}
              className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-wa-muted hover:text-wa-text uppercase tracking-[0.15em] transition-colors"
            >
              <Brain className="w-3 md:w-3.5 h-3 md:h-3.5 text-wa-accent" />
              {showThought ? 'Hide reasoning' : 'Inspect reasoning'}
            </button>
            {showThought && (
              <div className="mt-2 text-[10px] md:text-[11px] leading-relaxed text-wa-muted bg-wa-bg/60 p-2.5 md:p-3 rounded-xl italic border-l-2 border-wa-accent/60 animate-fade-in font-medium">
                {message.thought}
              </div>
            )}
          </div>
        )}

        {message.attachment && (
          <div className="mb-2 md:mb-3 rounded-lg md:rounded-xl overflow-hidden border border-white/10 bg-black/20">
            {message.attachment.type === 'video' && (
              <div className="relative aspect-video flex items-center justify-center bg-black group cursor-pointer">
                <video src={message.attachment.url} className="w-full h-full object-cover opacity-60" />
                <Play className="absolute w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
            )}
            {message.attachment.type === 'image' && (
              <img src={message.attachment.url} className="w-full h-auto" alt="attachment" />
            )}
            {message.attachment.type === 'document' && (
              <div className="p-3 md:p-4 flex items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-wa-accent/20 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 md:w-5 h-4 md:h-5 text-wa-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] md:text-xs font-bold text-wa-text truncate max-w-[120px] sm:max-w-[150px]">{message.attachment.name || 'document.pdf'}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-wa-muted uppercase">1.2 MB • PDF</p>
                  </div>
                </div>
                <Download className="w-4 md:w-5 h-4 md:h-5 text-wa-muted hover:text-wa-accent cursor-pointer shrink-0" />
              </div>
            )}
          </div>
        )}

        {isVoice ? (
          <div className="flex items-center gap-3 md:gap-4 py-2 min-w-[180px] md:min-w-[210px]">
            <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-wa-accent/15 border border-wa-accent/30 text-wa-accent shrink-0">
              <Mic className="w-5 h-5 md:w-5.5 md:h-5.5" />
            </div>
            <div className="flex-1 pr-1">
              <div className="flex gap-0.5 items-end h-5 md:h-6 mb-1 md:mb-1.5">
                {[4, 8, 5, 10, 7, 4, 9, 6, 8, 5, 7, 3, 6, 9, 5].map((h, i) => (
                  <div key={i} className={`w-[2px] md:w-[2.5px] rounded-full transition-all ${isBot ? 'bg-wa-muted/60' : 'bg-wa-text/70'}`} style={{ height: `${h * 10}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] md:text-[11px] text-wa-muted font-extrabold">0:04</span>
                <span className="text-[8px] md:text-[9px] text-wa-muted font-black uppercase tracking-tighter opacity-60">TRANSCRIPT READY</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[14px] md:text-[15px] leading-relaxed font-medium whitespace-pre-wrap selection:bg-white/20">{message.text}</p>
        )}
        
        <div className="flex justify-end items-center gap-1.5 mt-1.5 md:mt-2">
          <span className="text-[9px] md:text-[10px] text-wa-muted font-bold tracking-tight">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isBot && <CheckCheck className="w-3.5 md:w-4 h-3.5 md:h-4 text-[#53bdeb]" />}
        </div>

        <div className={`absolute top-0 w-0 h-0 border-[8px] md:border-[10px] border-transparent ${
          isBot 
            ? 'left-[-8px] md:left-[-10px] border-t-wa-received' 
            : 'right-[-8px] md:right-[-10px] border-t-wa-sent'
        }`}></div>
      </div>
    </div>
  );
};

export default React.memo(ChatBubble);
