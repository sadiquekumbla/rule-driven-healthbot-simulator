
import React from 'react';
import { Client } from '../types';
import { Activity, Target, TrendingUp, ShieldCheck } from 'lucide-react';

const Analysis: React.FC<{ clients: Client[]; rules?: any }> = ({ clients }) => {
  const total = clients.length;
  
  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 h-full overflow-y-auto bg-wa-bg scrollbar-hide">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Health Insights</h2>
          <p className="text-sm text-wa-muted">Aggregate patterns from simulations</p>
        </div>
        <div className="px-3 py-1.5 bg-wa-accent/10 border border-wa-accent/20 rounded-lg flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-wa-accent" />
          <span className="text-[10px] font-bold text-wa-accent uppercase tracking-widest">Active Intelligence</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-wa-surface border border-wa-border p-5 md:p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-wa-muted uppercase mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Cluster Analysis
          </h3>
          <div className="space-y-6">
            {['Underweight', 'Normal', 'Overweight', 'Obese'].map(cat => {
              const count = clients.filter(c => c.context.bmiCategory?.includes(cat)).length;
              const perc = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="uppercase tracking-wide">{cat}</span>
                    <span className="text-wa-accent">{count} profiles</span>
                  </div>
                  <div className="h-1.5 bg-wa-bg rounded-full overflow-hidden">
                    <div className="h-full bg-wa-accent transition-all duration-700" style={{ width: `${perc}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-wa-surface border border-wa-border p-5 md:p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-wa-muted uppercase mb-6 flex items-center gap-2">
            <Target className="w-4 h-4" /> Funnel Distribution
          </h3>
          <div className="flex flex-col gap-2 md:gap-3">
             {['Initial Greeting', 'Data Extraction', 'BMI Analysis', 'Finalized Leads'].map((stage, i) => (
               <div key={stage} className="bg-wa-accent/10 border border-wa-accent/30 rounded-xl p-3 md:p-4 text-center transition-all hover:border-wa-accent/60" style={{ opacity: 1 - i * 0.15 }}>
                  <span className="text-[10px] font-black uppercase text-wa-accent tracking-[0.15em]">{stage}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-wa-surface border border-wa-border p-6 md:p-8 rounded-2xl flex flex-col sm:flex-row items-center gap-6 md:gap-10">
        <div className="shrink-0 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-wa-accent flex items-center justify-center text-xl md:text-2xl font-bold shadow-lg shadow-wa-accent/10">
            {clients.filter(c => c.context.bmiCategory?.toLowerCase().includes('normal')).length}
          </div>
          <span className="text-[9px] md:text-[10px] uppercase font-bold text-wa-muted mt-3 block tracking-widest">Normal Range</span>
        </div>
        <div className="text-center sm:text-left">
          <h4 className="font-bold flex items-center justify-center sm:justify-start gap-2">
            <TrendingUp className="w-4 h-4 text-wa-accent" /> Strategic Insight
          </h4>
          <p className="text-sm text-wa-muted mt-2 leading-relaxed max-w-xl">
            Pattern matching suggests high engagement during the "CALCULATING_BMI" stage. Automated reminders could improve conversion for leads stalled in the "COLLECTING_DATA" phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
