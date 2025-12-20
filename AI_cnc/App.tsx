
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import GCodeEditor from './components/GCodeEditor';
import ChatPanel from './components/ChatPanel';
import MachineSelection from './components/MachineSelection';
import ReferenceManual from './components/ReferenceManual';
import Calculators from './components/Calculators';
import Settings from './components/Settings';
import QuickActionsModal from './components/QuickActionsModal';
import { MachineConfig, MachineType, ControlSystem, ToolDefinition, GeminiModel, CustomCode, SavedProgram } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('cnc_active_tab') || 'editor');
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  const [pendingAiAction, setPendingAiAction] = useState<{prompt: string, snippet: string} | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const [machineConfig, setMachineConfig] = useState<MachineConfig>(() => {
    const saved = localStorage.getItem('cnc_config');
    return saved ? JSON.parse(saved) : { 
      type: MachineType.CAROUSEL, 
      control: ControlSystem.SINUMERIK,
      selectedModel: 'gemini-flash-lite-latest'
    };
  });

  const [definedTools, setDefinedTools] = useState<ToolDefinition[]>(() => JSON.parse(localStorage.getItem('cnc_tools_library') || '[]'));
  const [customCodes, setCustomCodes] = useState<CustomCode[]>(() => JSON.parse(localStorage.getItem('cnc_custom_codes') || '[]'));
  const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>(() => JSON.parse(localStorage.getItem('cnc_saved_programs') || '[]'));
  const [gcode, setGcode] = useState<string>(() => localStorage.getItem('cnc_gcode_content') || `; Karusel Podložky\nG54 T1 D1 G95 M41\nG97 S60 M4\nG91 G1 X-300 F1\nM30`);
  const [selectedGcode, setSelectedGcode] = useState<string>('');

  // --- LOGIKA AUTOMATICKÉ DETEKCE SYSTÉMU ---
  const detectedSystem = useMemo(() => {
    if (!gcode || gcode.length < 10) return null;
    
    const siemensPatterns = [/R\d+\s*=/, /CYCLE\d+/, /MCALL/i, /G291/i, /TRANS\b/i, /ROT\b/i, /MSG\s*\(/i];
    const fanucPatterns = [/#\d+\s*=/, /G65\b/i, /G66\b/i, /M98\b/i, /M99\b/i, /G71\b.*P\d+\s*Q\d+/i];
    const heidenhainPatterns = [/CYCL\s+DEF/i, /CALL\s+LBL/i, /L\s+[XYZ]/i, /TOOL\s+CALL/i, /BEGIN\s+PGM/i];

    let score = { [ControlSystem.SINUMERIK]: 0, [ControlSystem.FANUC]: 0, [ControlSystem.HEIDENHAIN]: 0 };

    siemensPatterns.forEach(p => { if (p.test(gcode)) score[ControlSystem.SINUMERIK] += 2; });
    fanucPatterns.forEach(p => { if (p.test(gcode)) score[ControlSystem.FANUC] += 2; });
    heidenhainPatterns.forEach(p => { if (p.test(gcode)) score[ControlSystem.HEIDENHAIN] += 2; });

    // Bonus za styl komentářů
    if (/;/.test(gcode)) score[ControlSystem.SINUMERIK] += 1;
    if (/\(.*\)/.test(gcode)) score[ControlSystem.FANUC] += 1;

    const winner = Object.entries(score).reduce((a, b) => a[1] > b[1] ? a : b);
    return winner[1] > 0 ? winner[0] as ControlSystem : null;
  }, [gcode]);

  useEffect(() => {
    let mounted = true;
    const checkKey = async () => {
      const timeoutId = setTimeout(() => { if (mounted) setIsCheckingKey(false); }, 800);
      try {
        const envKey = process.env.API_KEY;
        if (envKey && envKey !== 'undefined' && envKey.length > 5) { setIsKeySelected(true); clearTimeout(timeoutId); if (mounted) setIsCheckingKey(false); return; }
        if (window.aistudio) { const hasKey = await window.aistudio.hasSelectedApiKey(); if (mounted) setIsKeySelected(hasKey); }
      } catch (err) { console.warn("Key check failed", err); } finally { clearTimeout(timeoutId); if (mounted) setIsCheckingKey(false); }
    };
    checkKey();
    return () => { mounted = false; };
  }, []);

  const handleActivateAI = async () => {
    if (window.aistudio) { await window.aistudio.openSelectKey(); setIsKeySelected(true); } 
    else alert("AI Studio rozhraní není dostupné.");
  };

  useEffect(() => {
    localStorage.setItem('cnc_gcode_content', gcode);
    localStorage.setItem('cnc_config', JSON.stringify(machineConfig));
    localStorage.setItem('cnc_active_tab', activeTab);
    localStorage.setItem('cnc_tools_library', JSON.stringify(definedTools));
    localStorage.setItem('cnc_custom_codes', JSON.stringify(customCodes));
    localStorage.setItem('cnc_saved_programs', JSON.stringify(savedPrograms));
  }, [gcode, machineConfig, activeTab, definedTools, customCodes, savedPrograms]);

  const handleQuickAction = (prompt: string, isSnippetAction: boolean = false) => {
    setPendingAiAction({ prompt, snippet: isSnippetAction ? selectedGcode : '' });
    setActiveTab('chat');
  };

  const toggleTab = (tab: string) => {
    if (activeTab === tab) setActiveTab('editor');
    else setActiveTab(tab);
  };

  if (isCheckingKey) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-orange-500 font-mono text-[10px] tracking-widest animate-pulse">CNC SYSTEM LOADING...</div>
        </div>
      </div>
    );
  }

  if (!isKeySelected && (!process.env.API_KEY || process.env.API_KEY === 'undefined')) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-2xl">🔧</div>
        <h1 className="text-3xl font-black text-white mb-2">CNC AI PROGRAMÁTOR</h1>
        <p className="text-slate-400 max-w-sm mb-8 text-sm">Aktivujte AI modul pro přístup k analýzám a optimalizacím.</p>
        <button onClick={handleActivateAI} className="bg-orange-600 hover:bg-orange-50 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl">AKTIVOVAT AI</button>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'editor': return <GCodeEditor gcode={gcode} setGcode={setGcode} onAction={handleQuickAction} selectedGcode={selectedGcode} setSelectedGcode={setSelectedGcode} machineConfig={machineConfig} definedTools={definedTools} setDefinedTools={setDefinedTools} customCodes={customCodes} onModelChange={m => setMachineConfig(p => ({...p, selectedModel: m}))} savedPrograms={savedPrograms} setSavedPrograms={setSavedPrograms} detectedSystem={detectedSystem} />;
      case 'machine': return <MachineSelection config={machineConfig} setConfig={setMachineConfig} onDone={() => setActiveTab('editor')} onClose={() => setActiveTab('editor')} />;
      case 'reference': return <ReferenceManual onClose={() => setActiveTab('editor')} machineConfig={machineConfig} onAction={handleQuickAction} />;
      case 'chat': return <ChatPanel gcode={gcode} machineConfig={machineConfig} setGcode={setGcode} onClose={() => setActiveTab('editor')} initialSnippet={selectedGcode} pendingAction={pendingAiAction} clearPendingAction={() => setPendingAiAction(null)} onModelChange={m => setMachineConfig(p => ({...p, selectedModel: m}))} savedPrograms={savedPrograms} />;
      case 'calc': return <Calculators onClose={() => setActiveTab('editor')} onAskAI={(prompt) => handleQuickAction(prompt, false)} />;
      case 'settings': return <Settings config={machineConfig} setConfig={setMachineConfig} onClose={() => setActiveTab('editor')} onNavigate={setActiveTab} customCodes={customCodes} setCustomCodes={setCustomCodes} />;
      default: return null;
    }
  };

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col overflow-hidden font-sans">
      <Header activeTab={activeTab} setActiveTab={toggleTab} machineConfig={machineConfig} detectedSystem={detectedSystem} setConfig={setMachineConfig} onOpenQuickActions={() => setShowQuickActions(true)} />
      <main className="flex-1 max-w-6xl mx-auto w-full p-2 pb-20 md:p-6 md:pb-6 overflow-hidden flex flex-col relative">
        {renderTab()}
      </main>
      <QuickActionsModal 
        isOpen={showQuickActions} 
        onClose={() => setShowQuickActions(false)} 
        onAction={(prompt) => handleQuickAction(prompt, false)}
        machineConfig={machineConfig}
      />
      <nav className="md:hidden bg-white border-t border-slate-200 grid grid-cols-5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[60] pb-safe shrink-0">
        <button onClick={() => setActiveTab('editor')} className={`flex flex-col items-center justify-center py-2 ${activeTab === 'editor' ? 'text-blue-600' : 'text-slate-500'}`}><span className="text-xl mb-0.5">🤖</span><span className="text-[9px] font-bold">AI CNC</span></button>
        <button onClick={() => toggleTab('chat')} className={`flex flex-col items-center justify-center py-2 ${activeTab === 'chat' ? 'text-blue-600' : 'text-slate-500'}`}><span className="text-xl mb-0.5">💬</span><span className="text-[9px] font-bold">AI Chat</span></button>
        <div className="relative -top-4 flex justify-center"><button onClick={() => setShowQuickActions(true)} className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center text-2xl shadow-lg text-white border-4 border-slate-50" title="AI Zápis">⚡</button></div>
        <button onClick={() => toggleTab('reference')} className={`flex flex-col items-center justify-center py-2 ${activeTab === 'reference' ? 'text-blue-600' : 'text-slate-500'}`}><span className="text-xl mb-0.5">📚</span><span className="text-[9px] font-bold">Příručka</span></button>
        <button onClick={() => toggleTab('settings')} className={`flex flex-col items-center justify-center py-2 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500'}`}><span className="text-2xl mb-0.5 leading-none">☰</span><span className="text-[9px] font-bold">Menu</span></button>
      </nav>
    </div>
  );
};

export default App;
