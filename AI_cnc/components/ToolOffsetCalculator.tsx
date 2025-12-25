
import React, { useState, useEffect } from 'react';

// --- SUB-COMPONENT: SIMPLE CALCULATOR (RYCHLÁ KOREKCE) ---
const SimpleCalculator: React.FC<{ onSwitchMode: () => void }> = ({ onSwitchMode }) => {
  const [axis, setAxis] = useState<'X' | 'Z'>('X');
  
  // Inputs
  const [displayVal, setDisplayVal] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [currentL, setCurrentL] = useState('');
  
  const [result, setResult] = useState<string>('0.000');
  const [delta, setDelta] = useState<number>(0);

  useEffect(() => {
    const d = parseFloat(displayVal) || 0;
    const t = parseFloat(targetVal) || 0;
    const l = parseFloat(currentL) || 0;

    // Čistý rozdíl: Požadovaný - Aktuální
    // Příklad: Displej 206.54, Cíl 200 -> Rozdíl -6.54
    const diff = t - d;
    setDelta(diff);

    // Aplikace na L (Odečtení rozdílu)
    // Příklad: L byl 100. Nové L = 100 - (-6.54) = 106.54
    const correction = l - diff;

    setResult(correction.toFixed(3));
  }, [displayVal, targetVal, currentL]);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans animate-in slide-in-from-right">
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="text-xl">⚡</span> Rychlá Korekce
        </h3>
        <button 
          onClick={onSwitchMode} 
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
        >
          Přepnout na Komplexní ⚙️
        </button>
      </div>

      <div className="p-4 flex gap-2 shrink-0 bg-white border-b border-slate-100">
        <button onClick={() => setAxis('X')} className={`flex-1 py-3 rounded-xl font-black text-xl transition-all shadow-sm border-2 ${axis === 'X' ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-400 border-slate-100'}`}>OSA X</button>
        <button onClick={() => setAxis('Z')} className={`flex-1 py-3 rounded-xl font-black text-xl transition-all shadow-sm border-2 ${axis === 'Z' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-400 border-slate-100'}`}>OSA Z</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Displej (Aktuální)</label>
            <input type="number" inputMode="decimal" value={displayVal} onChange={e => setDisplayVal(e.target.value)} placeholder="0.000" className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-lg font-bold focus:border-blue-500 outline-none font-mono text-center" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-600">Displej (Požadovaný)</label>
            <input type="number" inputMode="decimal" value={targetVal} onChange={e => setTargetVal(e.target.value)} placeholder="0.000" className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-lg font-bold focus:border-blue-500 outline-none font-mono text-center" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hodnota v tabulce ({axis === 'X' ? 'L1' : 'L2'})</label>
          <input type="number" inputMode="decimal" value={currentL} onChange={e => setCurrentL(e.target.value)} placeholder="0.000" className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-lg font-bold focus:border-blue-500 outline-none font-mono text-center" />
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl mt-2 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
                <div className="text-[10px] font-black uppercase opacity-60 tracking-widest">Nová hodnota {axis === 'X' ? 'L1' : 'L2'}</div>
                {delta !== 0 && (
                  <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${delta > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    Rozdíl: {delta > 0 ? '+' : ''}{delta.toFixed(3)}
                  </div>
                )}
            </div>
            <div className="text-5xl font-black font-mono text-green-400">{result}</div>
            <div className="mt-4 pt-4 border-t border-slate-700 text-[10px] font-mono text-slate-400">
               Výpočet: {currentL || '0'} - ({delta.toFixed(3)}) = {result}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: COMPLEX CALCULATOR (KARUSEL) ---
const ComplexCalculator: React.FC<{ onSwitchMode: () => void }> = ({ onSwitchMode }) => {
  const [axis, setAxis] = useState<'X' | 'Z'>('X');
  
  const [inputs, setInputs] = useState({
    radius: '0', current: '0', target: '0', currentL: '0',
    g54: '100', g57: '800', workpieceZ: '0',
    workpieceX: '0', radiusAbs: '0'
  });

  const [settings, setSettings] = useState({
    holeMode: 'outer', diameterMode: 'radius', displayMode: 'radius',
    absDiameterMode: 'radius', absHoleMode: 'outer'
  });

  const [calc, setCalc] = useState({
    diffString: '0', fullString: '0', lCalcString: '0', finalL: '0', displayVal: '0',
    zFirstSum: '0', zSecondSum: '0', zTotal: '0', xSecondSum: '0', xTotal: '0'
  });

  const handleRadiusChange = (val: string) => setInputs(prev => ({ ...prev, radius: val, radiusAbs: val }));
  const handleInputChange = (field: keyof typeof inputs, val: string) => setInputs(prev => ({ ...prev, [field]: val.replace(',', '.') }));
  const parseNum = (val: string) => parseFloat(val) || 0;
  const formatNum = (num: number) => Number(num.toFixed(3)).toString();

  useEffect(() => {
    const current = parseNum(inputs.current);
    const targetInput = parseNum(inputs.target);
    const currentL = parseNum(inputs.currentL);
    const radius = parseNum(inputs.radius);
    
    if (axis === 'X') {
      const isDia = settings.diameterMode === 'diameter';
      const isHole = settings.holeMode === 'hole';
      const target = isDia ? targetInput / 2 : targetInput;
      const normalDifference = target - current;
      const radiusEffect = isHole ? -radius : radius;
      const sumWithRadius = normalDifference + radiusEffect;
      const invertedSum = -sumWithRadius;
      const totalWithInversion = currentL + invertedSum;
      
      const targetDisplay = isDia ? `(${inputs.target} ÷ 2)` : inputs.target;
      const adjustedRadius = isDia ? radius * 2 : radius;
      const displayTotalRaw = isHole ? (target - radius) : (target + radius);
      const displayTotalFormatted = settings.displayMode === 'diameter' ? displayTotalRaw * 2 : displayTotalRaw;

      const absIsDia = settings.absDiameterMode === 'diameter';
      const absIsHole = settings.absHoleMode === 'hole';
      const workpieceXVal = parseNum(inputs.workpieceX);
      const workpieceVal = absIsDia ? workpieceXVal / 2 : workpieceXVal;
      const radiusAbsVal = parseNum(inputs.radiusAbs);
      const absOperation = absIsHole ? '-' : '+';
      const xSecondSumVal = workpieceVal + (absIsHole ? -radiusAbsVal : radiusAbsVal);
      const workpieceDisplay = absIsDia ? `(${inputs.workpieceX} ÷ 2)` : inputs.workpieceX;

      setCalc({
        diffString: `${targetDisplay} - ${inputs.current} = ${formatNum(normalDifference)}`,
        fullString: `${radius} + ${formatNum(normalDifference)} = ${formatNum(sumWithRadius)}`,
        lCalcString: `${inputs.currentL} + ${formatNum(invertedSum)} = ${formatNum(totalWithInversion)}`,
        finalL: formatNum(totalWithInversion),
        displayVal: formatNum(displayTotalFormatted),
        zFirstSum: '', zSecondSum: '', zTotal: '',
        xSecondSum: `${workpieceDisplay} ${absOperation} ${inputs.radiusAbs} = ${formatNum(xSecondSumVal)}`,
        xTotal: formatNum(xSecondSumVal)
      });
    } else {
      const normalDifference = targetInput - current;
      const sumWithRadius = radius + normalDifference;
      const invertedSum = -sumWithRadius;
      const totalWithInversion = currentL + invertedSum;

      const g54 = parseNum(inputs.g54);
      const g57 = parseNum(inputs.g57);
      const workpieceZ = parseNum(inputs.workpieceZ);
      const zFirstSumVal = g54 + g57;
      const zHeightRadius = workpieceZ + radius;
      const zTotalVal = zFirstSumVal + zHeightRadius;

      setCalc({
        diffString: `${inputs.target} - ${inputs.current} = ${formatNum(normalDifference)}`,
        fullString: `${radius} + ${formatNum(normalDifference)} = ${formatNum(sumWithRadius)}`,
        lCalcString: `${inputs.currentL} + ${formatNum(invertedSum)} = ${formatNum(totalWithInversion)}`,
        finalL: formatNum(totalWithInversion),
        displayVal: formatNum(zHeightRadius),
        zFirstSum: `${inputs.g57} + ${inputs.g54} = ${formatNum(zFirstSumVal)}`,
        zSecondSum: `(${inputs.workpieceZ} + ${radius}) + ${formatNum(zFirstSumVal)} = ${formatNum(zTotalVal)}`,
        zTotal: formatNum(zTotalVal),
        xSecondSum: '', xTotal: ''
      });
    }
  }, [inputs, settings, axis]);

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans animate-in slide-in-from-right">
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
          <span className="text-xl">⚙️</span> Komplexní (Karusel)
        </h3>
        <button 
          onClick={onSwitchMode} 
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
        >
          Přepnout na Rychlou ⚡
        </button>
      </div>

      <div className="grid grid-cols-2 p-2 bg-white border-b border-slate-200 gap-2 shrink-0">
        <button onClick={() => setAxis('X')} className={`py-3 rounded-xl font-black text-xl transition-all shadow-sm border-2 ${axis === 'X' ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-400 border-slate-100'}`}>OSA X</button>
        <button onClick={() => setAxis('Z')} className={`py-3 rounded-xl font-black text-xl transition-all shadow-sm border-2 ${axis === 'Z' ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-400 border-slate-100'}`}>OSA Z</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {axis === 'X' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Režim Průměru</label>
              <select value={settings.holeMode} onChange={e => setSettings(p => ({...p, holeMode: e.target.value}))} className="w-full p-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none"><option value="outer">⭕ D2 - Vnější</option><option value="hole">🔵 D1 - Díra</option></select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jednotky</label>
              <select value={settings.diameterMode} onChange={e => setSettings(p => ({...p, diameterMode: e.target.value}))} className="w-full p-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none"><option value="radius">📏 Poloměr</option><option value="diameter">⌀ Průměr</option></select>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rádius nástroje (R)</label>
           <div className="flex items-center gap-2">
             <span className="text-xl">🔪</span>
             <input type="text" inputMode="decimal" value={inputs.radius} onChange={e => handleRadiusChange(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-xl font-black outline-none font-mono text-center" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{axis === 'X' ? 'X displej při naškrábnutí (Poloměr)' : 'Z displej při naškrábnutí'}</label>
            <input type="text" inputMode="decimal" value={inputs.current} onChange={e => handleInputChange('current', e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-lg font-bold outline-none font-mono text-center" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-orange-600">{axis === 'X' ? `Naměřený ${settings.diameterMode === 'diameter' ? 'Průměr' : 'Poloměr'} (X)` : 'Naškrábnutá výška kola (Z)'}</label>
            <input type="text" inputMode="decimal" value={inputs.target} onChange={e => handleInputChange('target', e.target.value)} className="w-full bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-lg font-bold outline-none font-mono text-center" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100 p-4 rounded-2xl">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{axis === 'X' ? 'L1 - Hodnota displeje' : 'L2 - Hodnota displeje'}</label>
            <input type="text" inputMode="decimal" value={inputs.currentL} onChange={e => handleInputChange('currentL', e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-lg font-mono text-center outline-none" />
          </div>
          <div className="bg-white rounded-xl border border-slate-300 p-3 font-mono text-xs flex flex-col justify-center gap-1 overflow-x-auto whitespace-nowrap">
             <div className="text-slate-500 border-b border-slate-100 pb-1 mb-1 font-bold">VÝPOČET:</div>
             <div className="text-slate-600">{calc.diffString}</div>
             <div className="text-slate-600">{calc.fullString}</div>
             <div className="text-slate-800 font-bold bg-slate-50 p-1 rounded">{calc.lCalcString}</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="text-center md:text-left">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{axis === 'X' ? 'L1 - Změnit na:' : 'L2 - Změnit na:'}</h3>
             <div className="text-4xl font-black font-mono text-orange-500">{calc.finalL}</div>
           </div>
           <div className="bg-slate-800 p-3 rounded-xl min-w-[150px] text-center">
             <div className="flex items-center justify-center gap-2 mb-1">
               <span className="text-[9px] font-bold text-slate-400 uppercase">Displej:</span>
               {axis === 'X' && <select value={settings.displayMode} onChange={e => setSettings(p => ({...p, displayMode: e.target.value}))} className="bg-slate-700 text-white text-[9px] font-bold uppercase p-1 rounded border-none outline-none cursor-pointer"><option value="radius">Poloměr</option><option value="diameter">Průměr</option></select>}
             </div>
             <div className="text-xl font-bold font-mono text-green-400">{calc.displayVal}</div>
           </div>
        </div>

        <div className="border-t-2 border-slate-200 my-4 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-slate-50 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Absolutní hodnoty / Korekce</span>
        </div>

        {axis === 'X' && (
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-4">
             <div className="flex gap-2">
                <select value={settings.absDiameterMode} onChange={e => setSettings(p => ({...p, absDiameterMode: e.target.value}))} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"><option value="radius">Poloměr</option><option value="diameter">Průměr</option></select>
                <select value={settings.absHoleMode} onChange={e => setSettings(p => ({...p, absHoleMode: e.target.value}))} className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"><option value="outer">D2 - Vnější</option><option value="hole">D1 - Díra</option></select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{settings.absDiameterMode === 'diameter' ? 'Naměřený Průměr (X)' : 'Naměřený Poloměr (X)'}</label>
                   <input type="text" inputMode="decimal" value={inputs.workpieceX} onChange={e => handleInputChange('workpieceX', e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-lg font-bold font-mono text-center outline-none" />
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Výpočet korekce</label>
                   <div className="bg-slate-100 p-2 rounded-lg text-xs font-mono text-slate-600 mb-1">{calc.xSecondSum}</div>
                   <div className="bg-slate-800 text-white p-2 rounded-lg text-center font-bold text-xl font-mono">{calc.xTotal}</div>
                </div>
             </div>
          </div>
        )}

        {axis === 'Z' && (
          <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 space-y-4">
             <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[9px] font-bold text-blue-700 uppercase">G57</label><input type="text" inputMode="decimal" value={inputs.g57} onChange={e => handleInputChange('g57', e.target.value)} className="w-full bg-white border border-blue-200 rounded p-1 text-center font-mono font-bold" /></div>
                <div><label className="text-[9px] font-bold text-blue-700 uppercase">G54 (Podložky)</label><input type="text" inputMode="decimal" value={inputs.g54} onChange={e => handleInputChange('g54', e.target.value)} className="w-full bg-white border border-blue-200 rounded p-1 text-center font-mono font-bold" /></div>
                <div className="flex flex-col justify-end"><div className="text-[8px] font-bold text-blue-400 uppercase mb-1">Součet OFFSET</div><div className="bg-blue-200 text-blue-900 rounded p-1 text-center font-mono text-sm font-bold">{calc.zFirstSum}</div></div>
             </div>
             <div className="grid grid-cols-3 gap-2 border-t border-blue-200 pt-3">
                <div><label className="text-[9px] font-bold text-blue-700 uppercase">Výška kola</label><input type="text" inputMode="decimal" value={inputs.workpieceZ} onChange={e => handleInputChange('workpieceZ', e.target.value)} className="w-full bg-white border border-blue-200 rounded p-1 text-center font-mono font-bold" /></div>
                <div><label className="text-[9px] font-bold text-blue-700 uppercase">Rádius</label><input type="text" inputMode="decimal" value={inputs.radius} onChange={e => handleRadiusChange(e.target.value)} className="w-full bg-slate-100 border border-slate-300 text-slate-500 rounded p-1 text-center font-mono font-bold" /></div>
                <div className="flex flex-col justify-end"><label className="text-[9px] font-bold text-blue-700 uppercase">Výpočet Z</label><div className="bg-white p-1 rounded border border-blue-200 text-[9px] font-mono whitespace-nowrap overflow-x-auto">{calc.zSecondSum}</div></div>
             </div>
             <div className="bg-blue-600 text-white p-3 rounded-xl text-center shadow-lg"><div className="text-[10px] font-black uppercase mb-1 opacity-80">Výsledek Z (Total Sum)</div><div className="text-3xl font-black font-mono">{calc.zTotal}</div></div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HLAVNÍ KOMPONENTA (ROZCESTNÍK) ---
const ToolOffsetCalculator: React.FC = () => {
  // Výchozí režim nastaven na 'simple' (Rychlá korekce)
  const [mode, setMode] = useState<'complex' | 'simple'>('simple');

  if (mode === 'simple') return <SimpleCalculator onSwitchMode={() => setMode('complex')} />;
  if (mode === 'complex') return <ComplexCalculator onSwitchMode={() => setMode('simple')} />;

  return null; // Fallback, nemělo by nastat
};

export default ToolOffsetCalculator;
