
import React from 'react';
import { MachineConfig, MachineType, ControlSystem } from '../types';
import { MACHINE_OPTIONS, CONTROL_OPTIONS } from '../constants';

interface MachineSelectionProps {
  config: MachineConfig;
  setConfig: (config: MachineConfig) => void;
  onDone: () => void;
  onClose: () => void;
}

const MachineSelection: React.FC<MachineSelectionProps> = ({ config, setConfig, onDone, onClose }) => {
  return (
    <div className="h-full overflow-y-auto pb-20 pr-1 animate-fade-in relative custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Konfigurace stroje</h1>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
            title="Zavřít a vrátit se do editoru"
          >
            ✕
          </button>
        </div>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🏭</span> Typ stroje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MACHINE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setConfig({ ...config, type: opt.id })}
                className={`p-4 md:p-6 rounded-xl border-2 transition-all text-left ${
                  config.type === opt.id 
                  ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-200' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-4xl mb-3">{opt.icon}</div>
                <div className="font-bold text-lg text-slate-900">{opt.name}</div>
                <div className="text-sm text-slate-500">{opt.desc}</div>
                {config.type === opt.id && (
                  <div className="mt-4 text-orange-600 text-xs font-bold uppercase">Vybráno ✓</div>
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>💾</span> Řídicí systém
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTROL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setConfig({ ...config, control: opt.id })}
                className={`p-4 md:p-6 rounded-xl border-2 transition-all text-left ${
                  config.control === opt.id 
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-3">{opt.icon}</div>
                <div className="font-bold text-lg text-slate-900">{opt.name}</div>
                <div className="text-sm text-slate-600 mt-2 leading-relaxed">{opt.info}</div>
                {config.control === opt.id && (
                  <div className="mt-4 text-blue-600 text-xs font-bold uppercase">Aktivní ✓</div>
                )}
              </button>
            ))}
          </div>
        </section>

        <div className="pt-4 pb-8">
          <button
            onClick={onDone}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            Potvrdit a přejít k práci
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachineSelection;
