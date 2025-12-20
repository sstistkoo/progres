
import React, { useState, useRef, useEffect } from 'react';
import { G_M_CODES, CONTROL_OPTIONS } from '../constants';
import { MachineConfig, ControlSystem } from '../types';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (prompt: string) => void;
  machineConfig: MachineConfig;
}

interface SnippetItem {
  label: string;
  code: string;
  systems?: ControlSystem[];
}

interface SnippetCategory {
  category: string;
  items: SnippetItem[];
}

const QuickActionsModal: React.FC<QuickActionsModalProps> = ({ isOpen, onClose, onAction, machineConfig }) => {
  const [prompt, setPrompt] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [isSnippetsOpen, setIsSnippetsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeControl = CONTROL_OPTIONS.find(c => c.id === machineConfig.control);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSnippetsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const templates = [
    { label: 'Zarovnání čela', prompt: 'Vygeneruj kód pro zarovnání čela kusu, průměr 80mm, přídavek 2mm, nůž T1.' },
    { label: 'Závit G76', prompt: 'Vytvoř závitovací cyklus G76 pro závit M20x1.5, délka 30mm.' },
    { label: 'Vrtání CYCLE81', prompt: 'Napiš program pro vyvrtání 4 děr na roztečné kružnici průměru 100mm, hloubka 20mm.' },
  ];

  const allSnippets: SnippetCategory[] = [
    { 
      category: 'Start Programu', 
      items: [
        { label: 'Hlavička (Univerzální)', code: 'G54 G90 G95 G97' },
        { label: 'Start Sinumerik', code: 'G54 T1 D1 G95 M41\nG97 S1000 M3', systems: [ControlSystem.SINUMERIK] },
        { label: 'Start Fanuc', code: 'G21 G40 G80 G90\nG54 T0101 M03 S1000', systems: [ControlSystem.FANUC] },
        { label: 'Start Heidenhain', code: 'BEGIN PGM TEST MM\nTOOL CALL 1 Z S2000', systems: [ControlSystem.HEIDENHAIN] }
      ]
    },
    { 
      category: 'Nástroj & Operace', 
      items: [
        { label: 'Výměna (Sinumerik)', code: 'M01\nT="NAZEV" D1\nM06', systems: [ControlSystem.SINUMERIK] },
        { label: 'Výměna (Fanuc)', code: 'M01\nT0202\nM06', systems: [ControlSystem.FANUC] },
        { label: 'Bezpečný odjezd', code: 'G00 Z100 M05\nG00 X500 Z200' },
        { label: 'Chlazení ZAP', code: 'M08' },
        { label: 'Chlazení VYP', code: 'M09' }
      ]
    },
    { 
      category: 'Konec Programu', 
      items: [
        { label: 'Standardní konec', code: 'G00 Z200 M05\nM09\nM30' },
        { label: 'Stop & Restart', code: 'M00\nM99', systems: [ControlSystem.FANUC, ControlSystem.SINUMERIK] },
        { label: 'Konec PGM (HH)', code: 'END PGM TEST MM', systems: [ControlSystem.HEIDENHAIN] }
      ]
    }
  ];

  // Filtrování kategorií a položek podle aktuálního systému
  const filteredSnippets = allSnippets.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      !item.systems || item.systems.includes(machineConfig.control)
    )
  })).filter(cat => cat.items.length > 0);

  const filteredCodes = G_M_CODES.filter(item => {
    const isSystemMatch = !item.systems || item.systems.includes(machineConfig.control);
    if (!isSystemMatch) return false;

    const matchesSearch = 
      item.code.toLowerCase().includes(search.toLowerCase()) || 
      item.title.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || item.category === filter;
    
    return matchesSearch && matchesFilter;
  });

  const handleGenerate = () => {
    if (prompt.trim()) {
      onAction(`Zadání pro generování kódu: ${prompt}`);
      setPrompt('');
      onClose();
    }
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) {
      setPrompt(prev => prev + text);
      return;
    }

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = prompt.substring(0, start) + text + prompt.substring(end);
    setPrompt(newText);
    
    // Vrácení focusu a posun kurzoru
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + text.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleBackspace = () => {
    if (!textareaRef.current || prompt.length === 0) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    let newText = '';
    let newPos = 0;

    if (start !== end) {
      newText = prompt.substring(0, start) + prompt.substring(end);
      newPos = start;
    } else if (start > 0) {
      newText = prompt.substring(0, start - 1) + prompt.substring(start);
      newPos = start - 1;
    } else {
      return;
    }

    setPrompt(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const insertCodeToPrompt = (code: string) => {
    insertAtCursor(code + ' ');
  };

  const handleSnippetClick = (code: string) => {
    insertAtCursor(code + '\n');
    setIsSnippetsOpen(false);
  };

  const cncKeys = [
    { label: 'G', type: 'cmd' }, { label: 'M', type: 'cmd' }, { label: 'X', type: 'axis' }, { label: 'Y', type: 'axis' }, { label: 'Z', type: 'axis' },
    { label: 'S', type: 'param' }, { label: 'F', type: 'param' }, { label: 'T', type: 'param' }, { label: 'D', type: 'param' }, { label: 'H', type: 'param' },
    { label: '7', type: 'num' }, { label: '8', type: 'num' }, { label: '9', type: 'num' }, { label: 'I', type: 'axis' }, { label: 'J', type: 'axis' },
    { label: '4', type: 'num' }, { label: '5', type: 'num' }, { label: '6', type: 'num' }, { label: 'K', type: 'axis' }, { label: 'R', type: 'axis' },
    { label: '1', type: 'num' }, { label: '2', type: 'num' }, { label: '3', type: 'num' }, { label: '#', type: 'sym' }, { label: '=', type: 'sym' },
    { label: '0', type: 'num' }, { label: '.', type: 'num' }, { label: ';', type: 'sym' }, { label: '(', type: 'sym' }, { label: ')', type: 'sym' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 max-h-[95dvh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
            <span className="text-2xl text-orange-500">⚡</span> AI Zápis
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              Systém: {activeControl?.name}
            </span>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Input Section & Keyboard */}
          <div className="w-full md:w-3/5 p-4 sm:p-6 space-y-4 border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto custom-scrollbar bg-slate-50/30 flex flex-col">
            <div className="space-y-2 relative">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Co má AI napsat?</label>
                
                {/* G-Code Snippets Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsSnippetsOpen(!isSnippetsOpen)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${isSnippetsOpen ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600'}`}
                  >
                    <span>📋</span> Bloky pro {activeControl?.name.split(' ')[0]} ▾
                  </button>
                  
                  {isSnippetsOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[110] animate-in zoom-in-95 origin-top-right">
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredSnippets.length > 0 ? filteredSnippets.map((cat, idx) => (
                          <div key={idx} className="border-b border-slate-50 last:border-0">
                            <div className="bg-slate-50 px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {cat.category}
                            </div>
                            <div className="p-1">
                              {cat.items.map((item, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSnippetClick(item.code)}
                                  className="w-full text-left px-3 py-2 hover:bg-orange-50 rounded-xl transition-colors group"
                                >
                                  <div className="text-[11px] font-bold text-slate-700 group-hover:text-orange-700">{item.label}</div>
                                  <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">{item.code.replace(/\n/g, ' ')}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )) : (
                          <div className="p-4 text-center text-slate-400 text-[10px] italic">Žádné bloky pro tento systém.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <textarea 
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Popište operaci vlastními slovy nebo použijte tlačítko 'Bloky'..."
                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all min-h-[120px] resize-none shadow-sm font-mono"
              />
            </div>

            {/* CNC Keyboard */}
            <div className="bg-slate-800 p-3 rounded-2xl shadow-inner space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">CNC Panel</span>
                <div className="flex gap-2">
                  <button onClick={() => insertAtCursor(' ')} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase transition-colors">Mezera</button>
                  <button onClick={handleBackspace} className="bg-red-900/40 hover:bg-red-800/60 text-red-400 px-3 py-1 rounded text-[10px] font-bold uppercase border border-red-900/50 transition-colors">⌫</button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {cncKeys.map((key) => (
                  <button
                    key={key.label}
                    onClick={() => insertAtCursor(key.label)}
                    className={`h-10 sm:h-12 rounded-lg flex items-center justify-center font-black text-sm transition-all active:scale-90 border-b-2 shadow-sm
                      ${key.type === 'cmd' ? 'bg-orange-600 text-white border-orange-800 hover:bg-orange-500' : 
                        key.type === 'axis' ? 'bg-cyan-600 text-white border-cyan-800 hover:bg-cyan-500' :
                        key.type === 'param' ? 'bg-purple-600 text-white border-purple-800 hover:bg-purple-500' :
                        key.type === 'num' ? 'bg-slate-700 text-white border-slate-900 hover:bg-slate-600' :
                        'bg-slate-600 text-slate-200 border-slate-800 hover:bg-slate-500'}`}
                  >
                    {key.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rychlé Šablony</h3>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setPrompt(t.prompt)}
                    className="bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-700 border border-slate-200 hover:border-orange-200 px-3 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-700 disabled:opacity-50 shadow-xl shadow-orange-600/20 transition-all active:scale-95"
            >
              Vytvořit G-Code 🚀
            </button>
          </div>

          {/* Right: G-Code Cheat Sheet */}
          <div className="hidden md:flex md:w-2/5 flex-col bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
               <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referenční Tahák kódů</h3>
                 <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">{filteredCodes.length} výsledků</span>
               </div>
               <input
                 type="text"
                 placeholder="Hledat kód nebo funkci..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
               />
               <div className="flex gap-1 overflow-x-auto no-scrollbar">
                 {['all', 'pohyb', 'cycle', 'm'].map(cat => (
                   <button
                     key={cat}
                     onClick={() => setFilter(cat)}
                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                       filter === cat 
                       ? 'bg-slate-900 border-slate-900 text-white' 
                       : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredCodes.map((item) => (
                <button 
                  key={item.code}
                  onClick={() => insertCodeToPrompt(item.code)}
                  className="w-full text-left bg-white p-3 rounded-xl border border-slate-100 hover:border-orange-300 hover:shadow-sm transition-all group flex items-start gap-3"
                >
                  <span className="bg-slate-100 text-slate-800 font-mono font-bold px-2 py-1 rounded text-xs group-hover:bg-orange-100 group-hover:text-orange-700 shrink-0">
                    {item.code}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-[11px] truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{item.description}</div>
                  </div>
                  <span className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                </button>
              ))}
              {filteredCodes.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs italic">Nebyly nalezeny žádné kódy.</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-900 text-slate-400 border-t border-slate-800 shrink-0">
          <p className="text-[9px] text-center leading-relaxed font-medium">
            💡 Tip: Bloky v menu odpovídají vašemu systému <span className="text-orange-500 font-black">{activeControl?.name.split(' ')[0]}</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsModal;
