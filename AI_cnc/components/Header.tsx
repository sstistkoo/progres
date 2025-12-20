
import React from 'react';
import { MachineConfig, ControlSystem } from '../types';
import { MACHINE_OPTIONS, CONTROL_OPTIONS } from '../constants';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  machineConfig: MachineConfig;
  detectedSystem: ControlSystem | null;
  setConfig: (config: MachineConfig) => void;
  onOpenQuickActions: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, machineConfig, detectedSystem, setConfig, onOpenQuickActions }) => {
  const tabs = [
    { id: 'editor', label: '🤖 AI CNC' },
    { id: 'chat', label: '🤖 AI Chat' },
    { id: 'machine', label: '🔧 Stroj' },
    { id: 'calc', label: '🧮 Kalkulačky' },
    { id: 'reference', label: '📚 Příručka' },
    { id: 'settings', label: '☰ Menu' },
  ];

  const activeMachine = MACHINE_OPTIONS.find(m => m.id === machineConfig.type);
  const activeControl = CONTROL_OPTIONS.find(c => c.id === machineConfig.control);
  const detectedControlInfo = detectedSystem ? CONTROL_OPTIONS.find(c => c.id === detectedSystem) : null;

  const handleApplyDetection = () => {
    if (detectedSystem) {
      setConfig({ ...machineConfig, control: detectedSystem });
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md shrink-0">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center shrink-0">
             <span className="text-2xl mr-2">🔧</span>
             
             <button 
               onClick={() => setActiveTab('machine')}
               className="flex items-center gap-2 text-left hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors group"
             >
               <h1 className="font-bold text-sm sm:text-lg leading-tight text-white group-hover:text-blue-300 transition-colors whitespace-nowrap">CNC AI</h1>
               
               {activeMachine && activeControl && (
                 <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300 border-l border-slate-600 pl-2 sm:hidden whitespace-nowrap">
                   <span>{activeMachine.icon} {activeMachine.name}</span>
                   <span className="font-bold text-orange-400 ml-1">{activeControl.name.split(' ')[0]}</span>
                 </div>
               )}
             </button>
          </div>
        </div>
        
        {/* Machine Info & Detection Badge */}
        {activeMachine && activeControl && (
          <div className="hidden sm:flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 mx-4">
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
               <span>{activeMachine.icon}</span>
               <span>{activeMachine.name}</span>
             </div>
             <div className="w-px h-3 bg-slate-600"></div>
             <div className="flex items-center gap-2">
               <span className={`text-xs font-bold ${detectedSystem && detectedSystem === machineConfig.control ? 'text-green-400' : 'text-blue-400'}`}>
                 {activeControl.icon} {activeControl.name}
               </span>
               {detectedSystem && detectedSystem !== machineConfig.control && (
                 <button 
                   onClick={handleApplyDetection}
                   className="bg-orange-600 hover:bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1"
                 >
                   <span>⚠️ ZMĚNIT NA {detectedControlInfo?.name.split(' ')[0].toUpperCase()}</span>
                 </button>
               )}
               {detectedSystem && detectedSystem === machineConfig.control && (
                 <span className="bg-green-600/20 text-green-400 text-[8px] px-1.5 py-0.5 rounded border border-green-500/30 font-black uppercase tracking-widest">Auto-Match ✓</span>
               )}
             </div>
          </div>
        )}
        
        <nav className="hidden md:flex gap-1 shrink-0 items-center">
          <button
            onClick={onOpenQuickActions}
            className="px-3 py-1.5 rounded-md text-sm font-bold bg-orange-600 text-white hover:bg-orange-500 transition-colors shadow-sm mr-2 flex items-center gap-1"
          >
            <span>⚡</span> AI Zápis
          </button>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">v3.9.1</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
