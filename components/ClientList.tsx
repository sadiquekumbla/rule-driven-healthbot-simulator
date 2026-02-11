
import React from 'react';
import { Client } from '../types';
// Add Sparkles to the imported icons from lucide-react
import { MessageSquare, Plus, Search, Sparkles } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  activeClientId: string | null;
  onSelectClient: (id: string) => void;
  onNewChat: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, activeClientId, onSelectClient, onNewChat }) => {
  return (
    <div className="flex flex-col h-full bg-wa-bg overflow-hidden">
      <header className="p-4 h-[60px] bg-wa-surface flex items-center justify-between border-b border-wa-border shrink-0">
        <h2 className="text-[17px] font-extrabold text-wa-text tracking-tight">Active Chats</h2>
        <div className="flex gap-4 items-center">
          <button onClick={onNewChat} className="bg-wa-accent w-9 h-9 flex items-center justify-center rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-wa-accent/10">
            <Plus className="w-5.5 h-5.5 text-wa-bg" />
          </button>
        </div>
      </header>

      <div className="p-4 border-b border-wa-border shrink-0 bg-wa-bg">
        <div className="relative bg-wa-surface/50 rounded-xl px-4 py-2 border border-wa-border flex items-center gap-4 transition-all focus-within:bg-wa-surface focus-within:border-wa-accent/40">
          <Search className="w-4.5 h-4.5 text-wa-muted" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="flex-1 bg-transparent outline-none text-[13px] text-wa-text font-medium placeholder-wa-muted/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 opacity-30 h-full">
            <div className="w-16 h-16 bg-wa-surface rounded-3xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <span className="text-[11px] uppercase font-black tracking-[0.2em] text-center">Empty Inbox</span>
          </div>
        ) : (
          clients.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()).map(client => (
            <div 
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className={`flex items-center gap-4 p-4 mx-2 my-1 cursor-pointer rounded-2xl transition-all duration-300 ${activeClientId === client.id ? 'bg-wa-surface shadow-md' : 'hover:bg-wa-surface/40'}`}
            >
              <div className="relative shrink-0">
                <div className="w-[52px] h-[52px] rounded-2xl overflow-hidden border border-wa-border/50 p-0.5">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${client.id}`} className="w-full h-full object-cover" alt="Av" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-wa-bg rounded-full flex items-center justify-center border border-wa-border">
                   <div className="w-2 h-2 bg-wa-accent rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[15px] font-bold text-wa-text truncate tracking-tight">{client.name}</h3>
                  <span className="text-[11px] text-wa-muted font-bold opacity-80">
                    {client.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-wa-muted truncate font-medium">
                  {client.messages.length > 0 && client.messages[client.messages.length - 1].role === 'model' && <Sparkles className="w-3 h-3 shrink-0 text-wa-accent opacity-60" />}
                  <p className="truncate">
                    {client.messages.length > 0 ? client.messages[client.messages.length - 1].text : 'Initiating conversation...'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientList;
