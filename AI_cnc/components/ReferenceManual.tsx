
import React from 'react';
import { CONTROL_OPTIONS } from '../constants';
import { MachineConfig } from '../types';

interface ReferenceManualProps {
  onClose: () => void;
  machineConfig: MachineConfig;
  onAction?: (prompt: string) => void;
}

const ReferenceManual: React.FC<ReferenceManualProps> = ({ onClose, machineConfig, onAction }) => {
  const activeControl = CONTROL_OPTIONS.find(c => c.id === machineConfig.control);

  const aiAnalyses = [
    { 
      label: 'Hloubková Analýza', 
      prompt: 'Proveď hloubkovou analýzu G-kódu, najdi chyby a potenciální kolize.', 
      icon: '🔍',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      label: 'Audit Logiky', 
      prompt: 'Analyzuj logické větvení v programu (IF, GOTO, cykly). Prověř skoky a ukončovací podmínky.', 
      icon: '🧠',
      color: 'bg-pink-50 text-pink-700 border-pink-200'
    },
    { 
      label: 'Přehled Parametrů', 
      prompt: 'Vypiš všechny definované parametry a proměnné. Vytvoř tabulku s jejich významem z komentářů.', 
      icon: '🔢',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    { 
      label: 'Optimalizace', 
      prompt: 'Navrhni optimalizaci drah pro zkrácení strojního času při zachování kvality.', 
      icon: '⚡',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    { 
      label: 'G-Code Komentáře', 
      prompt: 'Doplň do kódu srozumitelné české komentáře pro každou operaci.', 
      icon: '💬',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    { 
      label: 'Prověrka Bezpečnosti', 
      prompt: 'Prověř bezpečnostní limity, otáčky a posuvy vůči zvolenému materiálu a nástroji.', 
      icon: '🛡️',
      color: 'bg-rose-50 text-rose-700 border-rose-200'
    },
  ];

  return (
    <div className="h-full overflow-y-auto pb-20 pr-1 space-y-6 custom-scrollbar animate-in fade-in duration-300">
      <div className="flex justify-between items-center sticky top-0 bg-slate-50 py-2 z-10 border-b border-slate-200 mb-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>📚</span> AI Analýzy & Audity
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Analýza pro:</span>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              {activeControl?.icon} {activeControl?.name}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-sm">
        <p className="text-xs text-orange-800 font-medium leading-relaxed">
          Zde můžete spustit hloubkové audity aktuálního programu v editoru. AI prověří logiku, bezpečnost i efektivitu drah.
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Dostupné Analytické Moduly</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-20">
          {aiAnalyses.map((analysis) => (
            <button
              key={analysis.label}
              onClick={() => onAction && onAction(analysis.prompt)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-95 text-center ${analysis.color}`}
            >
              <span className="text-3xl mb-2">{analysis.icon}</span>
              <span className="font-bold text-[10px] leading-tight uppercase tracking-wider">{analysis.label}</span>
            </button>
          ))}
        </div>
      </section>
      
      <div className="text-center py-6 bg-slate-100 rounded-2xl border border-slate-200">
         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
           Referenční tabulka kódů byla přesunuta do okna <span className="text-orange-600 font-black">AI ZÁPIS KÓDU (⚡)</span>
         </p>
      </div>
    </div>
  );
};

export default ReferenceManual;
