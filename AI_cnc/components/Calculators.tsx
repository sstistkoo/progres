
import React, { useState, useEffect } from 'react';
import { MATERIALS } from '../constants';

interface CalculatorsProps {
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
}

const STORAGE_KEY_CALC = 'cnc_calc_ui_v1';

const Calculators: React.FC<CalculatorsProps> = ({ onClose, onAskAI }) => {
  const [selectedMaterial, setSelectedMaterial] = useState('');
  
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CALC);
    return saved ? JSON.parse(saved).expandedStates : {
      'dist': true, // Výchozí rozbalení pro novou funkci
      'offsets': true,
      'vc': false,
      'n': false,
      'time': false,
      'vf': false,
      'ra': false
    };
  });

  // Ukládání stavu rozbalení
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CALC, JSON.stringify({ expandedStates }));
  }, [expandedStates]);

  const toggleAll = (expand: boolean) => {
    const newState = Object.keys(expandedStates).reduce((acc, key) => {
      acc[key] = expand;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedStates(newState);
  };

  const toggleCard = (id: string) => {
    setExpandedStates(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const getMaterialName = () => {
    const mat = MATERIALS.find(m => m.id === selectedMaterial);
    return mat ? mat.name : 'obecný materiál';
  };

  // 1. Řezná rychlost (Vc)
  const [d1, setD1] = useState('');
  const [n1, setN1] = useState('');
  const [vc, setVc] = useState<number | null>(null);

  // 2. Otáčky (n)
  const [vc2, setVc2] = useState('');
  const [d2, setD2] = useState('');
  const [rpm, setRpm] = useState<number | null>(null);

  // 3. Strojní čas
  const [len, setLen] = useState('');
  const [feed, setFeed] = useState('');
  const [rpm3, setRpm3] = useState('');
  const [time, setTime] = useState<{ min: number, sec: number, feedRate: number } | null>(null);

  // 4. Frézování: Vf
  const [fz, setFz] = useState('');
  const [teeth, setTeeth] = useState('');
  const [rpm4, setRpm4] = useState('');
  const [vf, setVf] = useState<number | null>(null);

  // 5. Drsnost (Ra)
  const [feedR, setFeedR] = useState('');
  const [radius, setRadius] = useState('');
  const [ra, setRa] = useState<number | null>(null);

  // 6. Vzdálenost bodů (3D)
  const [x1, setX1] = useState('');
  const [y1, setY1] = useState('');
  const [z1, setZ1] = useState('');
  const [x2, setX2] = useState('');
  const [y2, setY2] = useState('');
  const [z2, setZ2] = useState('');
  const [distResults, setDistResults] = useState<{ total: number, dx: number, dy: number, dz: number } | null>(null);

  // --- Korekce nástroje ---
  const [measX, setMeasX] = useState('');
  const [targetX, setTargetX] = useState('');
  const [currentXOffset, setCurrentXOffset] = useState('');
  const [toolXResult, setToolXResult] = useState<{ diff: number, newOffset: number | null } | null>(null);

  const calculateToolX = () => {
    const meas = parseFloat(measX);
    const target = parseFloat(targetX);
    const curr = parseFloat(currentXOffset) || 0;
    
    if (meas > 0 && target > 0) {
      const diff = (target - meas);
      setToolXResult({
        diff: diff,
        newOffset: currentXOffset !== '' ? curr + diff : null
      });
    } else {
      setToolXResult(null);
    }
  };

  const calculateDistance = () => {
    const p1x = parseFloat(x1) || 0;
    const p1y = parseFloat(y1) || 0;
    const p1z = parseFloat(z1) || 0;
    const p2x = parseFloat(x2) || 0;
    const p2y = parseFloat(y2) || 0;
    const p2z = parseFloat(z2) || 0;
    
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const dz = p2z - p1z;
    
    const total = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
    setDistResults({ total, dx, dy, dz });
  };

  const Card: React.FC<{ 
    id: string;
    title: string; 
    icon: string; 
    children: React.ReactNode; 
    onClear: () => void; 
    aiPrompt?: string;
  }> = ({ id, title, icon, children, onClear, aiPrompt }) => {
    const isExpanded = expandedStates[id];
    
    return (
      <div className={`bg-white rounded-xl overflow-hidden transition-all duration-300 border ${isExpanded ? 'border-orange-500 shadow-xl ring-2 ring-orange-500/5' : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'}`}>
        <div 
          onClick={() => toggleCard(id)}
          className={`flex justify-between items-center p-4 cursor-pointer select-none transition-colors ${isExpanded ? 'bg-orange-50/50' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${isExpanded ? 'bg-orange-600 text-white scale-110' : 'bg-slate-100 text-slate-500'}`}>
              {icon}
            </span>
            <h3 className={`font-black uppercase tracking-tight text-sm ${isExpanded ? 'text-orange-900' : 'text-slate-700'}`}>
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {isExpanded && (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {onAskAI && aiPrompt && (
                  <button 
                    onClick={() => onAskAI(aiPrompt)} 
                    className="flex text-[8px] bg-blue-600 text-white px-2 py-1 rounded-md font-black uppercase tracking-widest items-center gap-1 hover:bg-blue-700 transition-all shadow-sm"
                  >
                    <span>🤖</span> AI
                  </button>
                )}
                <button 
                  onClick={() => onClear()} 
                  className="p-1.5 hover:bg-red-100 rounded-md text-slate-400 hover:text-red-600 transition-colors"
                  title="Vyčistit pole"
                >
                  <span className="text-xs">🧹</span>
                </button>
              </div>
            )}
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <span className={`text-xl ${isExpanded ? 'text-orange-500' : 'text-slate-300'}`}>▾</span>
            </div>
          </div>
        </div>
        {isExpanded && (
          <div className="p-5 space-y-4 bg-white animate-slide-in">
            <div className="grid grid-cols-1 gap-4">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; unit: string }> = ({ label, value, onChange, unit }) => (
    <div className="group">
      <label className="text-[10px] text-slate-400 font-black uppercase mb-1.5 block tracking-widest group-focus-within:text-orange-500 transition-colors">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          step="any" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-black focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all font-mono" 
          placeholder="0.00" 
        />
        {unit && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase pointer-events-none tracking-tighter">
            {unit}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pb-24 pr-1 space-y-6 animate-slide-in custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-4 bg-slate-900 p-5 rounded-2xl shadow-xl border-b-4 border-orange-600 sticky top-0 z-20">
        <div className="flex-1">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-orange-600/20">🧮</div>
             <div>
                <h2 className="text-xl font-black text-white tracking-tighter flex items-center gap-2 uppercase">Technické výpočty</h2>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => toggleAll(true)} className="text-[8px] font-black uppercase tracking-widest text-orange-400 hover:text-white transition-colors">Rozbalit vše</button>
                  <span className="text-slate-700">|</span>
                  <button onClick={() => toggleAll(false)} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Sbalit vše</button>
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
           <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Knihovna materiálů</label>
           <div className="flex flex-wrap gap-1.5">
             {MATERIALS.map(m => (
               <button 
                 key={m.id} 
                 onClick={() => { setSelectedMaterial(m.id); setVc2(m.vc.toString()); setFz(m.fz.toString()); }} 
                 className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${selectedMaterial === m.id ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
               >
                 {m.name.split(' ')[0]}
               </button>
             ))}
           </div>
        </div>
        
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all border border-slate-700 shrink-0 self-center">✕</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NOVÁ SEKCE: 3D Vzdálenost */}
        <Card 
          id="dist"
          title="Vzdálenost a Diference (3D)" 
          icon="📐" 
          onClear={() => { setX1(''); setY1(''); setZ1(''); setX2(''); setY2(''); setZ2(''); setDistResults(null); }}
          aiPrompt="Vysvětli výpočet prostorové vzdálenosti mezi dvěma body v G-kódu."
        >
          <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded-r-xl mb-2">
             <p className="text-[10px] text-orange-800 font-bold leading-relaxed">Ruční zadání souřadnic pro výpočet lineární vzdálenosti a rozdílů.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Startovní bod (A)</div>
              <InputField label="Souřadnice X" value={x1} onChange={setX1} unit="mm" />
              <InputField label="Souřadnice Y" value={y1} onChange={setY1} unit="mm" />
              <InputField label="Souřadnice Z" value={z1} onChange={setZ1} unit="mm" />
            </div>
            <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="text-[9px] font-black text-slate-400 uppercase text-center tracking-widest">Cílový bod (B)</div>
              <InputField label="Souřadnice X" value={x2} onChange={setX2} unit="mm" />
              <InputField label="Souřadnice Y" value={y2} onChange={setY2} unit="mm" />
              <InputField label="Souřadnice Z" value={z2} onChange={setZ2} unit="mm" />
            </div>
          </div>
          <button onClick={calculateDistance} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md active:scale-95">Vypočítat vzdálenost</button>
          
          {distResults && (
            <div className="mt-2 space-y-3 animate-slide-in">
              <div className="p-4 bg-orange-600 text-white rounded-2xl text-center shadow-xl shadow-orange-600/20">
                <div className="text-[10px] font-black uppercase mb-1 opacity-80 tracking-widest">Lineární vzdálenost (L)</div>
                <div className="text-3xl font-black font-mono">{distResults.total.toFixed(3)} <span className="text-sm">mm</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-slate-200 p-2 rounded-xl text-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Δ X</div>
                  <div className="text-xs font-bold font-mono">{distResults.dx >= 0 ? '+' : ''}{distResults.dx.toFixed(3)}</div>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded-xl text-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Δ Y</div>
                  <div className="text-xs font-bold font-mono">{distResults.dy >= 0 ? '+' : ''}{distResults.dy.toFixed(3)}</div>
                </div>
                <div className="bg-white border border-slate-200 p-2 rounded-xl text-center">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Δ Z</div>
                  <div className="text-xs font-bold font-mono">{distResults.dz >= 0 ? '+' : ''}{distResults.dz.toFixed(3)}</div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card 
          id="offsets"
          title="Korekce X (Offset)" 
          icon="🔩" 
          onClear={() => { setMeasX(''); setTargetX(''); setCurrentXOffset(''); setToolXResult(null); }} 
          aiPrompt="Můžeš mi vysvětlit, jak funguje korekce nástroje v ose X na CNC soustruhu?"
        >
          <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl mb-2">
             <p className="text-[10px] text-blue-800 font-bold leading-relaxed">Výpočet přírůstku korekce na průměr pro tabulku nástrojů.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Naměřený Ø" value={measX} onChange={setMeasX} unit="mm" />
            <InputField label="Požadovaný Ø" value={targetX} onChange={setTargetX} unit="mm" />
          </div>
          <InputField label="Aktuální korekce v tabulce" value={currentXOffset} onChange={setCurrentXOffset} unit="mm" />
          <button onClick={calculateToolX} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md active:scale-95">Vypočítat přírůstek</button>
          {toolXResult && (
            <div className="mt-2 grid grid-cols-2 gap-2 animate-slide-in">
              <div className="p-3 bg-white border-2 border-slate-100 rounded-xl">
                <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Diference (Add)</div>
                <div className={`text-lg font-black font-mono ${toolXResult.diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {toolXResult.diff > 0 ? '+' : ''}{toolXResult.diff.toFixed(3)}
                </div>
              </div>
              {toolXResult.newOffset !== null && (
                <div className="p-3 bg-slate-900 text-white rounded-xl">
                  <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Nová hodnota</div>
                  <div className="text-lg font-black font-mono text-orange-400">
                    {toolXResult.newOffset.toFixed(3)}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card 
          id="vc"
          title="Řezná rychlost (Vc)" 
          icon="⚡" 
          onClear={() => { setD1(''); setN1(''); setVc(null); }}
          aiPrompt={`Jaká je ideální Vc pro ${getMaterialName()}?`}
        >
          <InputField label="Průměr Ø" value={d1} onChange={setD1} unit="mm" />
          <InputField label="Otáčky vřetena n" value={n1} onChange={setN1} unit="ot/min" />
          <button onClick={() => { const d = parseFloat(d1); const n = parseFloat(n1); if (d > 0 && n > 0) setVc((Math.PI * d * n) / 1000); else setVc(null); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Vypočítat Vc</button>
          {vc !== null && <div className="mt-2 p-4 bg-orange-600 text-white rounded-xl text-center shadow-lg shadow-orange-600/20"><div className="text-[9px] font-black uppercase mb-1 opacity-80">Výsledek Vc</div><div className="text-2xl font-black font-mono">{vc.toFixed(1)} <span className="text-xs">m/min</span></div></div>}
        </Card>

        <Card 
          id="n"
          title="Otáčky (RPM)" 
          icon="🔄" 
          onClear={() => { setVc2(''); setD2(''); setRpm(null); }}
          aiPrompt={`Vypočítej otáčky pro ${getMaterialName()}.`}
        >
          <InputField label="Řezná rychlost Vc" value={vc2} onChange={setVc2} unit="m/min" />
          <InputField label="Průměr Ø" value={d2} onChange={setD2} unit="mm" />
          <button onClick={() => { const v = parseFloat(vc2); const d = parseFloat(d2); if (v > 0 && d > 0) setRpm((1000 * v) / (Math.PI * d)); else setRpm(null); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Vypočítat n</button>
          {rpm !== null && <div className="mt-2 p-4 bg-blue-600 text-white rounded-xl text-center shadow-lg shadow-blue-600/20"><div className="text-[9px] font-black uppercase mb-1 opacity-80">Otáčky n</div><div className="text-2xl font-black font-mono">{Math.round(rpm)} <span className="text-xs">ot/min</span></div></div>}
        </Card>

        <Card 
          id="time"
          title="Strojní čas" 
          icon="⏱️" 
          onClear={() => { setLen(''); setFeed(''); setRpm3(''); setTime(null); }}
          aiPrompt="Jak zkrátit strojní čas?"
        >
          <InputField label="Délka dráhy L" value={len} onChange={setLen} unit="mm" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Posuv f" value={feed} onChange={setFeed} unit="mm/ot" />
            <InputField label="Otáčky n" value={rpm3} onChange={setRpm3} unit="ot/min" />
          </div>
          <button onClick={() => { const l = parseFloat(len); const f = parseFloat(feed); const n = parseFloat(rpm3); if (l > 0 && f > 0 && n > 0) { const fr = f * n; const t = l / fr; setTime({ min: Math.floor(t), sec: Math.round((t % 1) * 60), feedRate: fr }); } else setTime(null); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Vypočítat čas</button>
          {time !== null && <div className="mt-2 p-4 bg-green-600 text-white rounded-xl text-center"><div className="text-2xl font-black font-mono">{time.min}m {time.sec}s</div><div className="text-[9px] font-black uppercase mt-1 opacity-80">Vf: {time.feedRate.toFixed(1)} mm/min</div></div>}
        </Card>

        <Card 
          id="vf"
          title="Frézování (Vf)" 
          icon="🔨" 
          onClear={() => { setFz(''); setTeeth(''); setRpm4(''); setVf(null); }}
          aiPrompt="Doporuč posuv na zub fz pro hliník."
        >
          <InputField label="Posuv na zub fz" value={fz} onChange={setFz} unit="mm/z" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Zuby z" value={teeth} onChange={setTeeth} unit="ks" />
            <InputField label="Otáčky n" value={rpm4} onChange={setRpm4} unit="ot/min" />
          </div>
          <button onClick={() => { const f = parseFloat(fz); const z = parseFloat(teeth); const n = parseFloat(rpm4); if (f > 0 && z > 0 && n > 0) setVf(f * z * n); else setVf(null); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Vypočítat Vf</button>
          {vf !== null && <div className="mt-2 p-4 bg-indigo-600 text-white rounded-xl text-center shadow-lg shadow-indigo-600/20"><div className="text-2xl font-black font-mono">{vf.toFixed(1)} <span className="text-xs">mm/min</span></div></div>}
        </Card>

        <Card 
          id="ra"
          title="Drsnost povrchu (Ra)" 
          icon="✨" 
          onClear={() => { setFeedR(''); setRadius(''); setRa(null); }}
          aiPrompt="Jak dosáhnout povrchu Ra 0.8?"
        >
          <InputField label="Posuv f" value={feedR} onChange={setFeedR} unit="mm/ot" />
          <InputField label="Rádius rε" value={radius} onChange={setRadius} unit="mm" />
          <button onClick={() => { const f = parseFloat(feedR); const r = parseFloat(radius); if (f > 0 && r > 0) { const rz = (Math.pow(f, 2) / (8 * r)) * 1000; setRa(rz / 4); } else setRa(null); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all">Odhadnout Ra</button>
          {ra !== null && <div className="mt-2 p-4 bg-teal-600 text-white rounded-xl text-center"><div className="text-[9px] font-black uppercase mb-1 opacity-80">Drsnost Ra</div><div className="text-2xl font-black font-mono">{ra.toFixed(2)} <span className="text-xs">μm</span></div></div>}
        </Card>
      </div>
    </div>
  );
};

export default Calculators;
