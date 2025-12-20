
import React, { useState, useEffect } from 'react';
import { MachineConfig, GeminiModel, CustomCode } from '../types';
import ToolOffsetCalculator from './ToolOffsetCalculator';

interface SettingsProps {
  config: MachineConfig;
  setConfig: (config: MachineConfig) => void;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  customCodes?: CustomCode[];
  setCustomCodes?: (codes: CustomCode[]) => void;
}

// --- DATA PRO ISO ZNAČENÍ ---
const ISO_DATA: any = {
  1: {
    title: "Tvar destičky",
    options: [
      { value: "C", description: "Kosočtverec 80°", details: "Dokončovací soustružení" },
      { value: "D", description: "Kosočtverec 55°", details: "Kopírovací soustružení" },
      { value: "R", description: "Kruhový", details: "Kopírovací operace, odolné břity" },
      { value: "S", description: "Čtvercový", details: "Hrubování, srážení hran" },
      { value: "T", description: "Trojúhelníkový", details: "Dokončovací soustružení" },
      { value: "V", description: "Kosočtverec 35°", details: "Přesné kopírovací soustružení" },
      { value: "W", description: "Šestiúhelníkový", details: "Hrubování, speciální aplikace" },
    ]
  },
  2: {
    title: "Úhel hřbetu",
    options: [
      { value: "N", description: "0° (Negativní)", details: "Pro těžké hrubování, oboustranné" },
      { value: "B", description: "5° (Positivní)", details: "Univerzální" },
      { value: "C", description: "7° (Positivní)", details: "Standardní pozitivní" },
      { value: "P", description: "11° (Positivní)", details: "Pro menší řezné síly" },
    ]
  },
  3: {
    title: "Tolerance",
    options: [
      { value: "M", description: "Lisované (Běžné)", details: "Standardní ekonomická volba" },
      { value: "G", description: "Broušené (Přesné)", details: "Pro vyšší přesnost polohování" },
    ]
  },
  4: {
    title: "Typ destičky/Upnutí",
    options: [
      { value: "G", description: "S dírou + utvařeč", details: "Oboustranné s utvařečem" },
      { value: "M", description: "S dírou (jen jedna strana)", details: "Jednostranné s utvařečem" },
      { value: "T", description: "S dírou + sražené hrany", details: "Zápustná hlava šroubu" },
      { value: "A", description: "Bez díry", details: "Upínání upínkou" },
    ]
  },
  5: {
    title: "Velikost břitu",
    options: [
      { value: "06", description: "6 mm", details: "Malé destičky" },
      { value: "09", description: "9 mm", details: "Střední destičky" },
      { value: "11", description: "11 mm", details: "Střední destičky" },
      { value: "12", description: "12 mm", details: "Standardní velikost (CNMG 12...)" },
      { value: "16", description: "16 mm", details: "Velké destičky (TNMG 16...)" },
      { value: "19", description: "19 mm", details: "Velké destičky (SNMG 19...)" },
    ]
  },
  6: {
    title: "Tloušťka",
    options: [
      { value: "03", description: "3.18 mm", details: "Tenké" },
      { value: "04", description: "4.76 mm", details: "Standardní (pro vel. 12/16)" },
      { value: "06", description: "6.35 mm", details: "Silné (pro těžké řezy)" },
    ]
  },
  7: {
    title: "Rádius špičky",
    options: [
      { value: "02", description: "0.2 mm", details: "Velmi jemné dokončování" },
      { value: "04", description: "0.4 mm", details: "Jemné dokončování" },
      { value: "08", description: "0.8 mm", details: "Univerzální, střední hrubování" },
      { value: "12", description: "1.2 mm", details: "Hrubování, silný břit" },
      { value: "16", description: "1.6 mm", details: "Těžké hrubování" },
    ]
  },
  8: {
    title: "Utvařeč (Příklad)",
    options: [
      { value: "PM", description: "Pro střední obrábění (Ocel)", details: "Univerzální utvařeč" },
      { value: "PF", description: "Pro dokončování (Ocel)", details: "Nízké řezné síly" },
      { value: "PR", description: "Pro hrubování (Ocel)", details: "Odolná hrana" },
      { value: "HM", description: "Pro těžké materiály", details: "Nerez/Litina" },
    ]
  },
  9: {
    title: "Materiál/Grade",
    options: [
      { value: "4425", description: "P25 (Sandvik)", details: "Ocel - Univerzální" },
      { value: "4315", description: "P15 (Sandvik)", details: "Ocel - Vysoké rychlosti" },
      { value: "1125", description: "M25 (Sandvik)", details: "Nerez - Univerzální" },
    ]
  }
};

const HOLDER_ISO_DATA: any = {
  1: {
    title: "Upínací systém",
    options: [
      { value: "P", description: "Páčka (Lever lock)", details: "Pro negativní destičky s dírou" },
      { value: "M", description: "Upínka + Trn (Multi-lock)", details: "Velmi tuhé upnutí" },
      { value: "S", description: "Šroub (Screw lock)", details: "Pro pozitivní destičky (CCMT, DCMT...)" },
      { value: "C", description: "Upínka shora", details: "Pro destičky bez díry" },
    ]
  },
  2: {
    title: "Tvar destičky",
    options: ISO_DATA[1].options
  },
  3: {
    title: "Úhel nastavení hlavního břitu",
    options: [
      { value: "L", description: "95° (L)", details: "Podélné i čelní soustružení" },
      { value: "J", description: "93° (J)", details: "Kopírování, podélné" },
      { value: "K", description: "75° (K)", details: "Čelní soustružení" },
      { value: "R", description: "75° (R)", details: "Vnější hrubování" },
      { value: "V", description: "72.5° (V)", details: "Kopírování" },
    ]
  },
  4: {
    title: "Úhel hřbetu destičky",
    options: ISO_DATA[2].options
  },
  5: {
    title: "Směr řezu",
    options: [
      { value: "R", description: "Pravý (Right)", details: "Standardní pro většinu soustruhů" },
      { value: "L", description: "Levý (Left)", details: "Pro speciální operace / protivřeteno" },
      { value: "N", description: "Neutrální", details: "Pro zapichování / tvarové nože" },
    ]
  },
  6: {
    title: "Výška stopky",
    options: [
      { value: "12", description: "12 mm", details: "Malé soustruhy" },
      { value: "16", description: "16 mm", details: "Střední soustruhy" },
      { value: "20", description: "20 mm", details: "Standardní průmyslové" },
      { value: "25", description: "25 mm", details: "Velké tuhé stroje" },
      { value: "32", description: "32 mm", details: "Těžké obrábění" },
    ]
  }
};

const MATERIAL_INFO = {
  steel: { name: "Ocel (P)", color: "bg-blue-600", vc_rough: "180-280", vc_finish: "250-350", ap_rough: "2-5", f_rough: "0.25-0.45" },
  stainless: { name: "Nerez (M)", color: "bg-yellow-500", vc_rough: "120-180", vc_finish: "160-220", ap_rough: "1.5-3", f_rough: "0.2-0.35" },
  cast: { name: "Litina (K)", color: "bg-red-600", vc_rough: "150-250", vc_finish: "200-300", ap_rough: "2-6", f_rough: "0.25-0.5" },
  alu: { name: "Neželezné (N)", color: "bg-green-500", vc_rough: "400-1000", vc_finish: "800-2000", ap_rough: "3-8", f_rough: "0.3-0.6" },
  super: { name: "Slitiny (S)", color: "bg-amber-700", vc_rough: "30-60", vc_finish: "50-80", ap_rough: "0.5-1.5", f_rough: "0.1-0.2" },
  hard: { name: "Kalené (H)", color: "bg-slate-500", vc_rough: "80-120", vc_finish: "100-150", ap_rough: "0.1-0.5", f_rough: "0.05-0.15" },
};

// --- CIRCULAR FEED MODAL COMPONENT ---
const CircularFeedModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [radiusType, setRadiusType] = useState<'inner' | 'outer'>('inner');
  const [crRadius, setCrRadius] = useState<string>('');
  const [toolRadius, setToolRadius] = useState<string>('8');
  const [inputFeed, setInputFeed] = useState<string>('0.8');
  const [results, setResults] = useState<{toolCenterRadius: number, toolCenterFeed: number, ratio: number, originalArc: number, toolArc: number} | null>(null);

  useEffect(() => {
    calculate();
  }, [radiusType, crRadius, toolRadius, inputFeed]);

  const calculate = () => {
    const r = parseFloat(crRadius);
    const rt = parseFloat(toolRadius);
    const f = parseFloat(inputFeed);

    if (!r || !rt || !f || r <= 0 || rt <= 0) {
      setResults(null);
      return;
    }

    let toolCenterR = 0;
    if (radiusType === 'inner') {
      toolCenterR = r + rt;
    } else {
      toolCenterR = r - rt;
      // Pro vnější rádius nesmí být nástroj větší než rádius (technicky to nejde)
      if (toolCenterR <= 0) toolCenterR = 0.001; 
    }

    const pi = 3.14159;
    const originalArc = pi * r; // Zjednodušený výpočet pro porovnání poměrů (úhel se krátí)
    const toolArc = pi * toolCenterR;
    const ratio = toolArc / originalArc;
    const adjustedFeed = f * ratio;

    setResults({
      toolCenterRadius: toolCenterR,
      toolCenterFeed: adjustedFeed,
      ratio: ratio,
      originalArc: originalArc,
      toolArc: toolArc
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-300 max-h-[95dvh]">
        {/* HEADER */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 text-white flex justify-between items-center shrink-0 rounded-t-2xl sm:rounded-t-3xl">
          <h2 className="text-lg font-bold flex items-center gap-3">
            <span className="text-xl sm:text-2xl">🔄</span> 
            <span className="text-sm sm:text-lg">Posuv Kruhové Interpolace</span>
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white">✕</button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            {/* INPUTS SIDE */}
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Typ Rádiusu</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setRadiusType('inner')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${radiusType === 'inner' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Vnitřní (Díra)
                  </button>
                  <button 
                    onClick={() => setRadiusType('outer')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${radiusType === 'outer' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Vnější (Čep)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">CR Radius (Obrys)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={crRadius} 
                      onChange={e => setCrRadius(e.target.value)} 
                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 pl-4 text-lg font-bold font-mono focus:border-blue-500 focus:outline-none"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Rádius Nástroje (Plátek)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={toolRadius} 
                      onChange={e => setToolRadius(e.target.value)} 
                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 pl-4 text-lg font-bold font-mono focus:border-red-500 focus:outline-none"
                      placeholder="8.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Požadovaný Posuv (F)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={inputFeed} 
                      onChange={e => setInputFeed(e.target.value)} 
                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 pl-4 text-lg font-bold font-mono focus:border-green-500 focus:outline-none"
                      placeholder="0.8"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mm/ot</span>
                  </div>
                </div>
              </div>

              {results && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
                   <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Výsledný posuv (Střed nástroje)</span>
                   </div>
                   <div className="text-center">
                     <div className="text-4xl font-black font-mono text-green-400">{results.toolCenterFeed.toFixed(3)}</div>
                     <div className="text-xs text-slate-400 font-bold uppercase mt-1">mm/otáčku</div>
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-700">
                     <div className="text-slate-400">Ratio: <span className="text-white">{results.ratio.toFixed(3)}</span></div>
                     <div className="text-slate-400 text-right">R_center: <span className="text-white">{results.toolCenterRadius.toFixed(3)}</span></div>
                   </div>
                </div>
              )}
            </div>

            {/* VISUALIZATION SIDE */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-center relative overflow-hidden min-h-[250px]">
                <div className="absolute top-2 left-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">Vizualizace</div>
                {results ? (
                   <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Center Point */}
                      <circle cx="150" cy="150" r="3" fill="#1e293b" />
                      
                      {/* Scales calculation */}
                      {(() => {
                        const maxR = Math.max(parseFloat(crRadius), results.toolCenterRadius);
                        const scale = 120 / (maxR * 1.2);
                        const rScaled = parseFloat(crRadius) * scale;
                        const toolCenterScaled = results.toolCenterRadius * scale;
                        const toolRScaled = parseFloat(toolRadius) * scale;
                        
                        // Tool position (45 deg)
                        const angle = Math.PI / 4;
                        const tx = 150 + toolCenterScaled * Math.cos(angle);
                        const ty = 150 - toolCenterScaled * Math.sin(angle); // SVG Y is down

                        return (
                          <>
                            {/* CR Contour (Blue) */}
                            <circle cx="150" cy="150" r={rScaled} fill="none" stroke="#3b82f6" strokeWidth="2" />
                            <text x="155" y={150 - rScaled - 5} className="text-[10px] font-bold fill-blue-600">CR R{crRadius}</text>

                            {/* Tool Center Path (Red Dashed) */}
                            <circle cx="150" cy="150" r={toolCenterScaled} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
                            <text x="155" y={150 - toolCenterScaled + (radiusType === 'inner' ? 15 : -5)} className="text-[10px] font-bold fill-red-500">Center R{results.toolCenterRadius.toFixed(2)}</text>

                            {/* Tool (Circle at position) */}
                            <circle cx={tx} cy={ty} r={toolRScaled} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1" />
                            <circle cx={tx} cy={ty} r="2" fill="#ef4444" />
                            <line x1="150" y1="150" x2={tx} y2={ty} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                          </>
                        );
                      })()}
                   </svg>
                ) : (
                  <div className="text-center text-slate-400 text-xs italic">Zadejte parametry pro zobrazení</div>
                )}
              </div>

              {/* Vysvětlení */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
                 <h4 className="font-bold uppercase mb-2 text-blue-700">Princip výpočtu</h4>
                 {results ? (
                   <div className="space-y-1 font-mono text-[10px]">
                     <p>Původní obvod: <span className="font-bold">π × {parseFloat(crRadius)} ≈ {results.originalArc.toFixed(2)}</span></p>
                     <p>Obvod středu: <span className="font-bold">π × {results.toolCenterRadius.toFixed(2)} ≈ {results.toolArc.toFixed(2)}</span></p>
                     <p>Poměr: <span className="font-bold">{results.toolArc.toFixed(2)} / {results.originalArc.toFixed(2)} = {results.ratio.toFixed(3)}</span></p>
                     <p className="border-t border-blue-200 pt-1 mt-1 font-bold text-blue-700">
                       F_center = {inputFeed} × {results.ratio.toFixed(3)} = {results.toolCenterFeed.toFixed(3)}
                     </p>
                   </div>
                 ) : (
                   <p>Pro udržení konstantní řezné rychlosti na břitu nástroje při kruhové interpolaci je nutné korigovat posuv středu nástroje (F). U vnitřních rádiusů (děr) se dráha středu nástroje zkracuje, proto musí být posuv snížen.</p>
                 )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- INSERTS MODAL COMPONENT ---
const InsertsGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [insertSel, setInsertSel] = useState<Record<number, string>>({ 1:'-', 2:'-', 3:'-', 4:'-', 5:'-', 6:'-', 7:'-', 8:'-', 9:'-' });
  const [holderSel, setHolderSel] = useState<Record<number, string>>({ 1:'-', 2:'-', 3:'-', 4:'-', 5:'-', 6:'-' });
  const [activeSelector, setActiveSelector] = useState<{ type: 'insert' | 'holder', index: number } | null>(null);
  const [selectedMat, setSelectedMat] = useState<keyof typeof MATERIAL_INFO | null>(null);

  if (!isOpen) return null;

  const handleSelect = (val: string) => {
    if (!activeSelector) return;
    if (activeSelector.type === 'insert') {
      setInsertSel(prev => ({ ...prev, [activeSelector.index]: val }));
    } else {
      setHolderSel(prev => ({ ...prev, [activeSelector.index]: val }));
    }
    setActiveSelector(null);
  };

  const getInsertCode = () => Object.values(insertSel).slice(0, 4).join('') + ' ' + Object.values(insertSel).slice(4, 7).join('') + '-' + insertSel[8];
  const getHolderCode = () => Object.values(holderSel).join('') + Object.values(holderSel)[5]; // Simple mockup code construction

  const renderShapeSvg = (shape: string, color: string) => {
    switch (shape) {
      case 'C': return <polygon points="70,10 107,70 70,130 33,70" fill={color} stroke="#333" strokeWidth="2" />;
      case 'D': return <polygon points="70,15 110,70 70,125 30,70" fill={color} stroke="#333" strokeWidth="2" />;
      case 'S': return <rect x="35" y="35" width="70" height="70" fill={color} stroke="#333" strokeWidth="2" />;
      case 'T': return <polygon points="70,25 110,105 30,105" fill={color} stroke="#333" strokeWidth="2" />;
      case 'V': return <polygon points="70,30 105,70 70,110 35,70" fill={color} stroke="#333" strokeWidth="2" />;
      case 'W': return <polygon points="70,25 105,45 105,85 70,105 35,85 35,45" fill={color} stroke="#333" strokeWidth="2" />;
      case 'R': return <circle cx="70" cy="70" r="45" fill={color} stroke="#333" strokeWidth="2" />;
      default: return <circle cx="70" cy="70" r="40" fill="#ddd" />;
    }
  };

  const shapes = [
    { code: 'C', name: 'Kosočtverec 80°', desc: 'Dokončování, univerzální', color: '#3498db' },
    { code: 'D', name: 'Kosočtverec 55°', desc: 'Kopírování, podélné', color: '#e74c3c' },
    { code: 'V', name: 'Kosočtverec 35°', desc: 'Jemné kopírování', color: '#1abc9c' },
    { code: 'S', name: 'Čtverec', desc: 'Hrubování, těžké řezy', color: '#2ecc71' },
    { code: 'T', name: 'Trojúhelník', desc: 'Univerzální, srážení', color: '#f1c40f' },
    { code: 'W', name: 'Šestiúhelník', desc: 'Hrubování (Trigon)', color: '#e67e22' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-300 h-[95dvh]">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0 rounded-t-3xl">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <span className="text-2xl">🔶</span> Plátky & ISO Značení
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-50">
          
          {/* 1. SELECTION OVERLAY (IF ACTIVE) */}
          {activeSelector && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/20" onClick={() => setActiveSelector(null)}></div>
               <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-md relative z-10 animate-in zoom-in-95">
                 <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-slate-800 uppercase">
                      Pozice {activeSelector.index}: {activeSelector.type === 'insert' ? ISO_DATA[activeSelector.index]?.title : HOLDER_ISO_DATA[activeSelector.index]?.title}
                    </h3>
                    <button onClick={() => setActiveSelector(null)}>✕</button>
                 </div>
                 <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {(activeSelector.type === 'insert' ? ISO_DATA : HOLDER_ISO_DATA)[activeSelector.index]?.options.map((opt: any) => (
                      <button key={opt.value} onClick={() => handleSelect(opt.value)} className="w-full text-left p-3 rounded-xl hover:bg-orange-50 border border-slate-100 hover:border-orange-200 group transition-all">
                        <div className="flex items-center gap-2">
                           <span className="bg-slate-800 text-white font-mono font-bold px-2 py-1 rounded text-sm group-hover:bg-orange-600">{opt.value}</span>
                           <span className="font-bold text-slate-700">{opt.description}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 pl-10">{opt.details}</div>
                      </button>
                    ))}
                 </div>
               </div>
            </div>
          )}

          <div className="space-y-8">
            
            {/* VIZUÁLNÍ PŘEHLED TVARŮ */}
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span>🎨</span> Tvary břitových destiček</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                 {shapes.map(s => (
                   <div key={s.code} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center hover:border-orange-300 transition-colors">
                      <svg viewBox="0 0 140 140" className="w-16 h-16 mb-2 drop-shadow-sm">
                        {renderShapeSvg(s.code, s.color)}
                        <circle cx="70" cy="70" r="10" fill="white" stroke="#333" strokeWidth="2" />
                        <text x="70" y="75" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#333">{s.code}</text>
                      </svg>
                      <div className="font-bold text-slate-800">{s.name}</div>
                      <div className="text-[10px] text-center text-slate-500 leading-tight mt-1">{s.desc}</div>
                   </div>
                 ))}
              </div>
            </section>

            {/* INTERAKTIVNÍ ISO KONFIGURÁTOR */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span>🔡</span> Interaktivní ISO Generátor (Destička)</h3>
               
               {/* VÝSLEDEK */}
               <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 text-center shadow-lg">
                  <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Výsledný kód</div>
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-orange-400">{getInsertCode()}</div>
                  <div className="text-xs mt-2 text-slate-400">
                    {insertSel[1] !== '-' && insertSel[2] !== '-' ? `Tvar ${insertSel[1]} / Hřbet ${insertSel[2]}` : 'Vyberte parametry níže'}
                  </div>
               </div>

               {/* SELEKTORY */}
               <div className="flex flex-wrap justify-center gap-2">
                  {[1,2,3,4,5,6,7,8,9].map(idx => (
                    <button 
                      key={idx}
                      onClick={() => setActiveSelector({ type: 'insert', index: idx })}
                      className="flex flex-col items-center min-w-[50px]"
                    >
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${insertSel[idx] !== '-' ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-orange-300'}`}>
                        {insertSel[idx]}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-center leading-none max-w-[60px]">{ISO_DATA[idx]?.title.split(' ')[0]}</span>
                    </button>
                  ))}
               </div>
               
               <div className="mt-4 flex justify-center">
                 <button onClick={() => setInsertSel({ 1:'-', 2:'-', 3:'-', 4:'-', 5:'-', 6:'-', 7:'-', 8:'-', 9:'-' })} className="text-xs text-red-500 hover:underline">Resetovat výběr</button>
               </div>
            </section>

            {/* KONFIGURÁTOR DRŽÁKU */}
            <section className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><span>🔧</span> Výběr držáku (Holder)</h3>
               
               <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {[1,2,3,4,5,6].map(idx => (
                    <button 
                      key={idx}
                      onClick={() => setActiveSelector({ type: 'holder', index: idx })}
                      className="flex flex-col items-center min-w-[50px]"
                    >
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 text-lg font-bold transition-all ${holderSel[idx] !== '-' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-300 text-slate-400 hover:border-blue-300'}`}>
                        {holderSel[idx]}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase text-center leading-none max-w-[60px]">{HOLDER_ISO_DATA[idx]?.title.split(' ')[0]}</span>
                    </button>
                  ))}
               </div>

               {/* CHYTRÉ DOPORUČENÍ */}
               {holderSel[2] !== '-' && holderSel[3] !== '-' && (
                 <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg animate-in slide-in-from-left">
                    <h4 className="text-xs font-black text-blue-700 uppercase mb-1">Doporučení kompatibility</h4>
                    <p className="text-xs text-blue-900">
                      Pro držák s tvarem destičky <strong>{holderSel[2]}</strong> a úhlem nastavení <strong>{holderSel[3]}</strong>. 
                      Ujistěte se, že používáte destičku tvaru <strong>{holderSel[2]}</strong> (např. {holderSel[2]}NMG, {holderSel[2]}CMT).
                    </p>
                 </div>
               )}
            </section>

            {/* MATERIÁLY A ŘEZNÉ PODMÍNKY */}
            <section>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><span>📊</span> Řezné podmínky dle ISO</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(MATERIAL_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMat(key as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${selectedMat === key ? `${info.color} text-white border-transparent shadow-md scale-105` : `bg-white border-slate-200 text-slate-500 hover:border-slate-300`}`}
                  >
                    {info.name}
                  </button>
                ))}
              </div>

              {selectedMat && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                   <div className={`h-2 w-full ${MATERIAL_INFO[selectedMat].color}`}></div>
                   <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Hrubování (Roughing)</h4>
                        <ul className="space-y-2 text-sm">
                           <li className="flex justify-between"><span className="text-slate-500">Vc (m/min)</span><span className="font-mono font-bold">{MATERIAL_INFO[selectedMat].vc_rough}</span></li>
                           <li className="flex justify-between"><span className="text-slate-500">ap (mm)</span><span className="font-mono font-bold">{MATERIAL_INFO[selectedMat].ap_rough}</span></li>
                           <li className="flex justify-between"><span className="text-slate-500">fn (mm/ot)</span><span className="font-mono font-bold">{MATERIAL_INFO[selectedMat].f_rough}</span></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Dokončování (Finishing)</h4>
                        <ul className="space-y-2 text-sm">
                           <li className="flex justify-between"><span className="text-slate-500">Vc (m/min)</span><span className="font-mono font-bold text-green-600">{MATERIAL_INFO[selectedMat].vc_finish}</span></li>
                           <li className="flex justify-between"><span className="text-slate-500">ap (mm)</span><span className="font-mono font-bold text-green-600">0.2 - 1.5</span></li>
                           <li className="flex justify-between"><span className="text-slate-500">fn (mm/ot)</span><span className="font-mono font-bold text-green-600">0.05 - 0.2</span></li>
                        </ul>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-3 text-[10px] text-slate-500 italic text-center border-t border-slate-100">
                      Hodnoty jsou orientační pro slinutý karbid s PVD/CVD povlakem. Vždy zkontrolujte krabičku výrobce.
                   </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

// --- TRIGONOMETRY MODAL COMPONENT ---
const TrigonometryModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [alpha, setAlpha] = useState('');
  const [beta, setBeta] = useState('');

  const clearAll = () => {
    setA(''); setB(''); setC(''); setAlpha(''); setBeta('');
  };

  const calculate = () => {
    const va = parseFloat(a);
    const vb = parseFloat(b);
    const vc = parseFloat(c);
    
    // Normalizace úhlů - abychom vždy měli k dispozici Alpha pro výpočty
    let va_deg = parseFloat(alpha);
    let vb_deg = parseFloat(beta);

    const rad = (deg: number) => deg * (Math.PI / 180);
    const deg = (rad: number) => rad * (180 / Math.PI);

    // Pokud je zadána Beta ale ne Alpha, dopočítáme Alpha
    if (isNaN(va_deg) && !isNaN(vb_deg)) {
      va_deg = 90 - vb_deg;
      setAlpha(va_deg.toFixed(2));
    }
    // Pokud je zadána Alpha ale ne Beta, dopočítáme Beta (pro zobrazení)
    else if (!isNaN(va_deg) && isNaN(vb_deg)) {
      vb_deg = 90 - va_deg;
      setBeta(vb_deg.toFixed(2));
    }

    // Počet zadaných údajů (nyní už máme úhly sjednocené)
    const inputs = [!isNaN(va), !isNaN(vb), !isNaN(vc), !isNaN(va_deg)].filter(Boolean).length;

    if (inputs >= 2) {
      // 1. Dvě odvěsny (a, b)
      if (!isNaN(va) && !isNaN(vb)) {
        const hyp = Math.sqrt(va * va + vb * vb);
        const angA = deg(Math.atan(va / vb));
        setC(hyp.toFixed(3));
        setAlpha(angA.toFixed(2));
        setBeta((90 - angA).toFixed(2));
      }
      // 2. Odvěsna a přepona (a, c)
      else if (!isNaN(va) && !isNaN(vc) && vc > va) {
        const adj = Math.sqrt(vc * vc - va * va);
        const angA = deg(Math.asin(va / vc));
        setB(adj.toFixed(3));
        setAlpha(angA.toFixed(2));
        setBeta((90 - angA).toFixed(2));
      }
      // 3. Odvěsna a přepona (b, c)
      else if (!isNaN(vb) && !isNaN(vc) && vc > vb) {
        const opp = Math.sqrt(vc * vc - vb * vb);
        const angB = deg(Math.asin(vb / vc));
        setA(opp.toFixed(3));
        setBeta(angB.toFixed(2));
        setAlpha((90 - angB).toFixed(2));
      }
      // 4. Odvěsna a (jakýkoliv) úhel (a, alpha)
      // Protože jsme nahoře zkonvertovali Betu na Alphu, stačí řešit va & va_deg
      else if (!isNaN(va) && !isNaN(va_deg) && va_deg < 90 && va_deg > 0) {
        const hyp = va / Math.sin(rad(va_deg));
        const adj = va / Math.tan(rad(va_deg));
        setC(hyp.toFixed(3));
        setB(adj.toFixed(3));
        // Beta už je nastavena nahoře
      }
      // 5. Druhá odvěsna a úhel (b, alpha)
      else if (!isNaN(vb) && !isNaN(va_deg) && va_deg < 90 && va_deg > 0) {
        const hyp = vb / Math.cos(rad(va_deg));
        const opp = vb * Math.tan(rad(va_deg));
        setC(hyp.toFixed(3));
        setA(opp.toFixed(3));
      }
      // 6. Přepona a úhel (c, alpha)
      else if (!isNaN(vc) && !isNaN(va_deg) && va_deg < 90 && va_deg > 0) {
        const opp = vc * Math.sin(rad(va_deg));
        const adj = vc * Math.cos(rad(va_deg));
        setA(opp.toFixed(3));
        setB(adj.toFixed(3));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col relative z-10 animate-in zoom-in-95 duration-300 max-h-[95dvh]">
        {/* Fixní hlavička */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-3">
            <span className="text-xl sm:text-2xl">📐</span> <span className="text-sm sm:text-lg">Trigonometrie</span>
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Skrolovatelný obsah */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* Levá strana: Nákres (5/12 šířky) */}
            <div className="md:col-span-5 bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 min-h-[150px] md:min-h-[300px]">
              <svg viewBox="0 0 200 150" className="w-full max-w-[180px] sm:max-w-[250px] drop-shadow-md">
                <path d="M 40,120 L 160,120 L 40,20 Z" fill="none" stroke="#334155" strokeWidth="3" strokeLinejoin="round" />
                <path d="M 40,105 L 55,105 L 55,120" fill="none" stroke="#f97316" strokeWidth="2" />
                
                {/* Alpha arc (u vrcholu vpravo dole - 160,120) */}
                <path d="M 140,120 A 20,20 0 0 0 145,108" fill="none" stroke="#ea580c" strokeWidth="1.5" />
                <text x="135" y="115" className="text-[12px] font-bold fill-orange-600">α</text>

                {/* Beta arc (u vrcholu nahoře - 40,20) */}
                <path d="M 40,40 A 20,20 0 0 0 52,35" fill="none" stroke="#ea580c" strokeWidth="1.5" />
                <text x="48" y="55" className="text-[12px] font-bold fill-orange-600">β</text>

                {/* Labels - a, b, c */}
                <text x="100" y="140" className="text-sm font-black fill-slate-600" textAnchor="middle">b</text>
                <text x="20" y="70" className="text-sm font-black fill-slate-600" textAnchor="middle">a</text>
                <text x="110" y="60" className="text-sm font-black fill-slate-600" textAnchor="middle" transform="rotate(-40, 110, 60)">c</text>
              </svg>
            </div>

            {/* Pravá strana: Vstupy (7/12 šířky) */}
            <div className="md:col-span-7 flex flex-col">
              {/* Grid 2 sloupce i na mobilu */}
              <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                
                {/* Sloupec Délky */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1 truncate">Délky (mm)</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-4 sm:w-6 text-xs font-bold text-slate-400 text-center">a</span>
                      <input type="number" value={a} onChange={e => setA(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-lg p-2 text-sm font-bold focus:border-orange-500 focus:outline-none min-w-0" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-4 sm:w-6 text-xs font-bold text-slate-400 text-center">b</span>
                      <input type="number" value={b} onChange={e => setB(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-lg p-2 text-sm font-bold focus:border-orange-500 focus:outline-none min-w-0" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-4 sm:w-6 text-xs font-bold text-slate-400 text-center">c</span>
                      <input type="number" value={c} onChange={e => setC(e.target.value)} className="flex-1 bg-orange-50 border-2 border-orange-100 rounded-lg p-2 text-sm font-bold focus:border-orange-600 focus:outline-none min-w-0" />
                    </div>
                  </div>
                </div>

                {/* Sloupec Úhly */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1 truncate">Úhly (°)</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-4 sm:w-6 text-xs font-bold text-orange-600 text-center">α</span>
                      <input type="number" value={alpha} onChange={e => setAlpha(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-lg p-2 text-sm font-bold focus:border-orange-500 focus:outline-none min-w-0" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-4 sm:w-6 text-xs font-bold text-orange-600 text-center">β</span>
                      <input type="number" value={beta} onChange={e => setBeta(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-lg p-2 text-sm font-bold focus:border-orange-500 focus:outline-none min-w-0" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 opacity-50">
                      <span className="w-4 sm:w-6 text-xs font-bold text-slate-400 text-center">γ</span>
                      <input type="number" value="90" disabled className="flex-1 bg-slate-200 border-2 border-slate-200 rounded-lg p-2 text-sm font-bold cursor-not-allowed min-w-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* TLAČÍTKA AKCE */}
              <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
                 <button onClick={calculate} className="flex-[2] bg-slate-900 text-white py-3 sm:py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95">
                   Vypočítat
                 </button>
                 <button onClick={clearAll} className="flex-1 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 border-2 border-slate-200 py-3 sm:py-4 rounded-xl font-bold uppercase text-xs sm:text-sm tracking-widest transition-all active:scale-95">
                   Vymazat
                 </button>
              </div>

              {/* Instrukce */}
              <div className="mt-3 p-2 bg-orange-50 border border-orange-100 rounded-lg text-center">
                 <p className="text-[10px] text-orange-800 font-bold uppercase tracking-widest leading-tight">
                   Zadejte libovolné 2 údaje a stiskněte Vypočítat.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SETTINGS MODAL COMPONENT (Knife) ---
const KnifeSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 h-[90dvh] flex flex-col">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🔪</span> Nastavení nože / Korekce
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-500 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <ToolOffsetCalculator />
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ 
  config, 
  setConfig, 
  onClose, 
  onNavigate, 
  customCodes = [], 
  setCustomCodes
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'ai'>('main');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isKnifeModalOpen, setIsKnifeModalOpen] = useState(false);
  const [isTrigModalOpen, setIsTrigModalOpen] = useState(false);
  const [isInsertsModalOpen, setIsInsertsModalOpen] = useState(false);
  const [isCircularModalOpen, setIsCircularModalOpen] = useState(false);

  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeContent, setNewCodeContent] = useState('');
  const [newCodeDesc, setNewCodeDesc] = useState('');

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleSaveCode = () => {
    if (newCodeName && newCodeContent && setCustomCodes) {
      const newCode: CustomCode = {
        id: Date.now().toString(),
        name: newCodeName,
        code: newCodeContent,
        description: newCodeDesc,
        isActive: true
      };
      setCustomCodes([...customCodes, newCode]);
      setNewCodeName('');
      setNewCodeContent('');
      setNewCodeDesc('');
    }
  };

  const toggleRuleActive = (id: string) => {
    if (setCustomCodes) {
      setCustomCodes(customCodes.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    }
  };

  const handleDeleteCode = (id: string) => {
    if (setCustomCodes) {
      setCustomCodes(customCodes.filter(c => c.id !== id));
    }
  };

  const models: { id: GeminiModel; name: string; desc: string; badge: string }[] = [
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Expert na složitý kód a optimalizace.', badge: 'Expert' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Nejnovější standard, blesková rychlost.', badge: 'Balanced' },
    { id: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash', desc: 'Pokročilá analytika a přesnost.', badge: 'Latest' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash-Lite', desc: 'Extrémně rychlý pro jednoduché dotazy.', badge: 'Lite' },
  ];

  if (currentView === 'ai') {
    return (
      <div className="h-full overflow-y-auto pb-20 pr-1 custom-scrollbar animate-in slide-in-from-right-10 duration-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 px-2 mb-4">
            <button onClick={() => setCurrentView('main')} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-bold text-xl">←</button>
            <h2 className="text-2xl font-bold text-slate-800">AI Konfigurace & Paměť</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Technické nastavení</h3>
            
            <div className="flex justify-between items-start mb-4">
               <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2"><span>🔑</span> API klíče</h4>
               <button onClick={handleSelectKey} className="text-xs font-bold text-blue-600 hover:underline uppercase">Spravovat ⚙️</button>
            </div>
            <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/50 flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center">🔐</div>
                <div className="font-bold text-sm text-slate-800">Google AI Studio</div>
              </div>
              <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-1 rounded uppercase">{hasApiKey ? 'Připojeno' : 'Demo'}</span>
            </div>

            <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span>🧠</span> Výběr modelu</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model) => (
                <button key={model.id} onClick={() => setConfig({ ...config, selectedModel: model.id })} className={`p-4 rounded-xl border-2 text-left transition-all ${config.selectedModel === model.id ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 hover:border-slate-300'}`}>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-sm">{model.name}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100">{model.badge}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{model.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <div className="mb-6">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Znalostní báze (Learning)</h3>
               <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2"><span>🎓</span> Co se má AI naučit?</h4>
               <p className="text-xs text-slate-500">Zadejte Firemní standardy, makra nebo specifická pravidla pro vaše stroje. AI je bude zohledňovat při každé analýze.</p>
             </div>
             
             <div className="space-y-4 mb-8">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Název pravidla / útržku</label>
                 <input type="text" value={newCodeName} onChange={e => setNewCodeName(e.target.value)} placeholder="Např. Standardní náběh stroje..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
               </div>
               
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Obsah (Kód nebo Popis pravidla)</label>
                 <textarea value={newCodeContent} onChange={e => setNewCodeContent(e.target.value)} placeholder="G54 T1 D1...\nNebo: 'Vždy používej G95 u podélného soustružení.'" rows={4} className="w-full bg-slate-900 text-cyan-400 font-mono text-sm border border-slate-700 rounded-lg px-4 py-2" />
               </div>

               <button onClick={handleSaveCode} disabled={!newCodeName || !newCodeContent} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-md">Naučit AI / Uložit do báze</button>
             </div>

             <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-800 px-2 flex items-center gap-2">
                  Moje znalosti 
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{customCodes.length}</span>
                </h3>
                {customCodes.map(code => (
                  <div key={code.id} className={`bg-white p-4 rounded-xl border transition-all flex justify-between items-start group ${code.isActive ? 'border-indigo-300 shadow-md' : 'border-slate-200 opacity-70'}`}>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800">{code.name}</h4>
                        {code.isActive && <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Aktivní v AI</span>}
                      </div>
                      <div className="bg-slate-900 text-cyan-400 font-mono text-[10px] p-2 rounded overflow-x-auto whitespace-pre truncate">{code.code}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => toggleRuleActive(code.id)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${code.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`} title={code.isActive ? 'Deaktivovat pro AI' : 'Aktivovat pro AI'}>
                        {code.isActive ? '🧠' : '💤'}
                      </button>
                      <button onClick={() => handleDeleteCode(code.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">🗑️</button>
                    </div>
                  </div>
                ))}
                {customCodes.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                    Zatím jste AI nic nenaučili. Přidejte první firemní standard!
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-20 pr-1 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 px-2">Menu & Nastavení</h2>
        
        <div className="md:hidden grid grid-cols-2 gap-3 mb-2">
           <button onClick={() => onNavigate('machine')} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex flex-col items-center"><span className="text-3xl mb-2">🔧</span><span className="font-bold text-orange-800 text-xs">Stroj</span></button>
           <button onClick={() => onNavigate('calc')} className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col items-center"><span className="text-3xl mb-2">🧮</span><span className="font-bold text-blue-800 text-xs">Kalkulátor</span></button>
        </div>

        {/* --- GRID MENU --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

          {/* 1. TRIGONOMETRIE */}
          <button onClick={() => setIsTrigModalOpen(true)} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-start gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">📐</div>
            <div className="flex flex-col items-start">
              <h3 className="font-bold text-slate-800 text-sm">Trigonometrie</h3>
              <p className="text-[10px] text-slate-500 leading-tight text-left">Výpočet trojúhelníků, náběhů a úhlů.</p>
            </div>
          </button>

          {/* 2. PLÁTKY & ISO */}
          <button onClick={() => setIsInsertsModalOpen(true)} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all group flex flex-col items-start gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">🔶</div>
            <div className="flex flex-col items-start">
              <h3 className="font-bold text-slate-800 text-sm">Plátky & ISO</h3>
              <p className="text-[10px] text-slate-500 leading-tight text-left">Průvodce tvary a značením destiček.</p>
            </div>
          </button>

          {/* 3. NASTAVENÍ NOŽE */}
          <button onClick={() => setIsKnifeModalOpen(true)} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-start gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">🔪</div>
            <div className="flex flex-col items-start">
              <h3 className="font-bold text-slate-800 text-sm">Nastavení nože</h3>
              <p className="text-[10px] text-slate-500 leading-tight text-left">Geometrie a korekce nástrojů.</p>
            </div>
          </button>

          {/* 4. POSUV KRUHOVÉ INTERPOLACE */}
          <button onClick={() => setIsCircularModalOpen(true)} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-green-400 hover:shadow-md transition-all group flex flex-col items-start gap-3 h-full">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">🔄</div>
            <div className="flex flex-col items-start">
              <h3 className="font-bold text-slate-800 text-sm">Posuv v rádiusu</h3>
              <p className="text-[10px] text-slate-500 leading-tight text-left">Korekce posuvu pro vnitřní/vnější oblouky.</p>
            </div>
          </button>

          {/* 5. AI KONFIGURACE (NOVĚ OBSAHUJE I UČENÍ) */}
          <button onClick={() => setCurrentView('ai')} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col items-start gap-3 h-full relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">🧠</div>
            <div className="flex flex-col items-start">
              <h3 className="font-bold text-slate-800 text-sm">AI Nastavení & Učení</h3>
              <p className="text-[10px] text-slate-500 leading-tight text-left">Konfigurace modelů a výuka pravidel.</p>
            </div>
            {customCodes.filter(c => c.isActive).length > 0 && <span className="absolute top-4 right-4 bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>}
          </button>

        </div>

        <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 mt-4">
           <p className="text-xs text-slate-500 italic text-center">Správa souborů byla přesunuta přímo do Editoru pod ikonu 📂 pro rychlejší přístup.</p>
        </div>

        {/* MODALS */}
        <KnifeSettingsModal isOpen={isKnifeModalOpen} onClose={() => setIsKnifeModalOpen(false)} />
        <TrigonometryModal isOpen={isTrigModalOpen} onClose={() => setIsTrigModalOpen(false)} />
        <InsertsGuideModal isOpen={isInsertsModalOpen} onClose={() => setIsInsertsModalOpen(false)} />
        <CircularFeedModal isOpen={isCircularModalOpen} onClose={() => setIsCircularModalOpen(false)} />
      </div>
    </div>
  );
};

export default Settings;
