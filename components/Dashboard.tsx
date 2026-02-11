
import React, { useMemo } from 'react';
import { Client, AdminRules } from '../types';
import { Users, Activity, BarChart3, TrendingUp, Globe, Zap, Target, ArrowUpRight, Sparkles, Settings, FileText } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  activeClient: Client | null;
  rules: AdminRules;
}

const Dashboard: React.FC<DashboardProps> = ({ clients, activeClient, rules }) => {
  const stats = useMemo(() => {
    const totalLeads = clients.length;
    const bmiClients = clients.filter(c => c.context.bmi);
    const avgBmi = bmiClients.length > 0 
      ? bmiClients.reduce((acc, c) => acc + (c.context.bmi || 0), 0) / bmiClients.length 
      : 0;
    const convertedLeads = clients.filter(c => c.context.stage === 'FINALIZING').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      totalLeads,
      avgBmi: avgBmi.toFixed(1),
      conversionRate: conversionRate.toFixed(0),
      engine: rules.engineMode.toUpperCase()
    };
  }, [clients, rules.engineMode]);

  const cards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-blue-400', trend: '+12%' },
    { label: 'Avg BMI', value: stats.avgBmi, icon: Activity, color: 'text-wa-accent', trend: 'Stable' },
    { label: 'Conversion', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-purple-400', trend: '+4%' },
    { label: 'Engine', value: stats.engine, icon: Zap, color: 'text-yellow-400', trend: 'Active' }
  ];

  const funnelSteps = [
    { label: 'Greet', stage: 'GREETING' },
    { label: 'Data', stage: 'COLLECTING_DATA' },
    { label: 'BMI', stage: 'CALCULATING_BMI' },
    { label: 'Quote', stage: 'FINALIZING' }
  ];

  const funnelCounts = funnelSteps.map(step => ({
    ...step,
    count: clients.filter(c => c.context.stage === step.stage).length
  }));

  const maxCount = Math.max(...funnelCounts.map(d => d.count), 1);

  return (
    <div className="h-full overflow-y-auto bg-[#0b141a] p-4 md:p-8 space-y-8 md:space-y-10 scrollbar-hide">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-wa-text tracking-tight mb-1">Executive Insights</h2>
          <p className="text-sm md:text-base text-wa-muted font-medium">Monitoring real-time health assessment throughput</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 md:px-5 py-2 bg-wa-surface/50 glass-card rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-wa-accent flex items-center gap-2 shadow-xl border border-wa-accent/20">
            <div className="w-2 h-2 rounded-full bg-wa-accent animate-ping"></div>
            OPERATIONAL
          </div>
          <div className="hidden xs:flex px-3 md:px-5 py-2 bg-wa-surface/50 glass-card rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-wa-muted items-center gap-2 shadow-xl border border-wa-border/50 uppercase tracking-widest">
            {rules.apiProvider}
          </div>
        </div>
      </div>

      {/* Grid Stat Display */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((s, idx) => (
          <div 
            key={s.label} 
            className="bg-wa-surface border border-wa-border/60 p-4 md:p-6 rounded-[20px] md:rounded-[24px] flex flex-col justify-between group hover:border-wa-accent/40 transition-all duration-500 shadow-xl animate-fade-in relative overflow-hidden"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl bg-wa-bg border border-wa-border/50 ${s.color} group-hover:scale-110 transition-transform duration-500`}>
                <s.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className={`hidden sm:flex text-[9px] md:text-[10px] font-extrabold px-2 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-wa-bg/60 border border-wa-border/40 items-center gap-1 ${s.trend.startsWith('+') ? 'text-wa-accent' : 'text-wa-muted'}`}>
                <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5" /> {s.trend}
              </div>
            </div>
            <div>
              <p className="text-[10px] md:text-[12px] font-extrabold text-wa-muted uppercase tracking-[0.1em] mb-0.5 md:mb-1 truncate">{s.label}</p>
              <p className="text-xl md:text-3xl font-extrabold text-wa-text tracking-tighter truncate">{s.value}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
              <s.icon className="w-16 h-16 md:w-24 md:h-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Funnel Viz */}
        <div className="lg:col-span-2 bg-wa-surface border border-wa-border/60 p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
            <h3 className="text-[10px] md:text-[12px] font-black text-wa-muted uppercase tracking-[0.25em] flex items-center gap-2 md:gap-3">
              <div className="w-1 h-5 md:w-1.5 md:h-6 bg-wa-accent rounded-full shadow-[0_0_8px_rgba(0,168,132,0.8)]"></div>
              Conversion Pipeline
            </h3>
            <span className="text-[9px] md:text-[11px] font-bold text-wa-accent bg-wa-accent/10 px-2 py-1 rounded-full border border-wa-accent/20">LIVE FEED</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between px-2 md:px-8 gap-4 md:gap-10 min-h-[180px] md:min-h-[250px] relative z-10">
            {funnelCounts.map((step, i) => (
              <div key={step.label} className="flex-1 flex flex-col items-center gap-3 md:gap-5 group">
                <div className="w-full relative flex flex-col justify-end h-full">
                   <div 
                    className="w-full bg-gradient-to-t from-wa-accent to-emerald-400 rounded-lg md:rounded-2xl transition-all duration-1000 ease-out relative group-hover:brightness-110 shadow-[0_10px_30px_rgba(0,168,132,0.2)] will-change-transform"
                    style={{ 
                      height: `${(step.count / maxCount) * 120 + 20}px`,
                      opacity: 1 - (i * 0.12)
                    }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-wa-surface border border-wa-border/80 px-2 py-1 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 whitespace-nowrap">
                      <span className="text-[11px] font-extrabold text-wa-accent">{step.count} L</span>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] md:text-[11px] font-extrabold text-wa-muted uppercase tracking-widest text-center truncate w-full">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Details Card */}
        <div className="bg-wa-surface border border-wa-border/60 p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl flex flex-col">
          <h3 className="text-[10px] md:text-[12px] font-black text-wa-muted uppercase tracking-[0.25em] mb-6 md:mb-8 flex items-center gap-2 md:gap-3">
             <div className="w-1 h-5 md:w-1.5 md:h-6 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
             Session Intel
          </h3>
          <div className="flex-1 space-y-2 md:space-y-3.5">
            {activeClient ? (
              Object.entries(activeClient.context).filter(([_,v]) => v !== null).slice(0, 8).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-3 md:p-4 bg-wa-bg/30 border border-wa-border/40 rounded-xl md:rounded-2xl hover:bg-wa-bg/60 transition-all duration-300 group">
                  <span className="text-[10px] md:text-[11px] font-extrabold text-wa-muted uppercase tracking-tighter group-hover:text-wa-accent transition-colors truncate pr-2">{k}</span>
                  <span className="text-[11px] md:text-[13px] font-mono font-bold text-wa-text truncate max-w-[120px] bg-wa-bg/80 px-2 py-1 rounded-lg border border-wa-border/50">{String(v)}</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 md:py-16 px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-wa-bg/50 border border-wa-border/40 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-wa-muted opacity-20" />
                </div>
                <p className="text-[12px] md:text-[14px] text-wa-muted italic font-semibold leading-relaxed">Select a lead from the simulator for state preview.</p>
              </div>
            )}
          </div>
          {activeClient && (
            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-wa-border/50">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl overflow-hidden border-2 border-wa-accent/30 p-0.5 shadow-lg shadow-wa-accent/10 shrink-0">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeClient.id}`} className="w-full h-full object-cover" alt="Av" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] md:text-[15px] font-extrabold text-wa-text tracking-tight truncate">{activeClient.name}</p>
                  <p className="text-[9px] md:text-[10px] text-wa-accent font-black uppercase tracking-widest mt-0.5 truncate">Active Flow</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Insight Board */}
      <div className="p-6 md:p-10 bg-gradient-to-br from-[#1b2730] to-[#0b141a] border border-wa-border/60 rounded-[24px] md:rounded-[40px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="relative z-10">
          <h4 className="text-lg md:text-xl font-extrabold text-wa-text flex items-center gap-3">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-wa-accent" /> Intelligence Summary
          </h4>
          <p className="text-sm md:text-lg text-wa-muted mt-2 md:mt-3 max-w-2xl leading-relaxed font-medium">
            Assessment efficiency is currently at <span className="text-wa-accent font-extrabold">{stats.conversionRate}%</span>. Analyzing <span className="text-wa-text font-bold">{stats.totalLeads}</span> leads using <span className="text-wa-accent font-bold tracking-tight">{rules.engineMode.toUpperCase()}</span>.
          </p>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto shrink-0">
          <button className="flex-1 md:flex-none bg-wa-accent text-wa-bg px-6 md:px-8 py-3 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[12px] tracking-widest shadow-2xl shadow-wa-accent/30 hover:brightness-110 active:scale-95 transition-all">
            Export Logs
          </button>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-wa-accent/5 blur-[120px] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
