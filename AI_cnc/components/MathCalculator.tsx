
import React, { useState, useEffect, useRef } from 'react';

interface MathCalculatorProps {
  onClose: () => void;
  onInsert: (value: string) => void;
}

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
}

const MathCalculator: React.FC<MathCalculatorProps> = ({ onClose, onInsert }) => {
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('cnc_math_history');
    return saved ? JSON.parse(saved) : [];
  });
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('cnc_math_history', JSON.stringify(history));
    // Scroll to bottom of history when updated
    if (historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
  }, [history]);

  const handlePress = (val: string) => {
    setExpression(prev => prev + val);
  };

  const handleClear = () => {
    setExpression('');
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const calculate = () => {
    try {
      if (!expression) return;
      // Bezpečnější náhrada symbolů pro eval
      let evalString = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI');
      
      // eslint-disable-next-line no-eval
      const res = eval(evalString);
      
      if (!isFinite(res) || isNaN(res)) {
        throw new Error("Invalid result");
      }

      const formattedResult = Number(res.toFixed(3)).toString();
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        expression: expression,
        result: formattedResult
      };

      setHistory(prev => [newItem, ...prev]);
      setExpression(formattedResult);
    } catch (e) {
      const original = expression;
      setExpression('Chyba');
      setTimeout(() => setExpression(original), 1000);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key;
    e.stopPropagation();

    if (/[0-9+\-*/().]/.test(key)) {
      e.preventDefault();
      handlePress(key);
    } else if (key === 'Enter') {
      e.preventDefault();
      calculate();
    } else if (key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (key === 'p') {
      e.preventDefault();
      handlePress('π');
    }
  };

  return (
    <div 
      className="absolute right-2 top-12 z-[90] w-72 bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="bg-slate-900 p-2 flex justify-between items-center shrink-0 cursor-move handle">
        <h3 className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <span>🧮</span> Kalkulačka
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-lg leading-none px-2">×</button>
      </div>

      {/* Display */}
      <div className="p-2 bg-slate-50 border-b border-slate-200">
        <input 
          type="text" 
          value={expression} 
          readOnly 
          className="w-full h-10 text-right text-2xl font-mono font-bold bg-white border border-slate-300 rounded-lg px-2 focus:outline-none text-slate-800 shadow-inner"
          placeholder="0"
        />
      </div>

      {/* History */}
      <div className="flex-1 min-h-[60px] max-h-[100px] overflow-y-auto bg-slate-50 border-b border-slate-200 p-2 custom-scrollbar" ref={historyRef}>
        <div className="flex justify-between items-center mb-1 px-1 sticky top-0 bg-slate-50 z-10 pb-1 border-b border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Historie</span>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-[9px] text-red-500 hover:text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">Smazat</button>
          )}
        </div>
        <div className="space-y-1 pb-1">
          {history.map(item => (
            <div key={item.id} className="bg-white p-1.5 rounded border border-slate-200 shadow-sm flex flex-col gap-0.5 group hover:border-blue-300 transition-colors">
              <div className="text-[9px] text-slate-500 text-right font-mono border-b border-slate-50 pb-0.5">{item.expression} =</div>
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800 text-xs font-mono tracking-tight">{item.result}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setExpression(prev => prev + item.result); }}
                    className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-1.5 py-0.5 rounded text-[8px] font-bold"
                  >
                    Použít
                  </button>
                  <button 
                    onClick={() => onInsert(item.result)}
                    className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-1.5 py-0.5 rounded text-[8px] font-bold"
                  >
                    Vložit
                  </button>
                  <button 
                    onClick={() => deleteHistoryItem(item.id)}
                    className="text-slate-300 hover:text-red-500 px-1 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center text-[9px] text-slate-400 py-4 italic">Žádné výpočty</div>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="p-2 bg-white grid grid-cols-4 gap-1 border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {/* Row 1 */}
        <button onClick={handleClear} className="col-span-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg h-10 font-bold text-sm transition-all active:scale-95 shadow-sm">C</button>
        <button onClick={() => handlePress('(')} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg h-10 font-bold text-slate-600 transition-all active:scale-95 shadow-sm">(</button>
        <button onClick={() => handlePress(')')} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg h-10 font-bold text-slate-600 transition-all active:scale-95 shadow-sm">)</button>
        <button onClick={() => handlePress('/')} className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg h-10 font-bold text-lg transition-all active:scale-95 shadow-sm">÷</button>

        {/* Row 2 */}
        <button onClick={() => handlePress('7')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">7</button>
        <button onClick={() => handlePress('8')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">8</button>
        <button onClick={() => handlePress('9')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">9</button>
        <button onClick={() => handlePress('*')} className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg h-10 font-bold text-lg transition-all active:scale-95 shadow-sm">×</button>

        {/* Row 3 */}
        <button onClick={() => handlePress('4')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">4</button>
        <button onClick={() => handlePress('5')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">5</button>
        <button onClick={() => handlePress('6')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">6</button>
        <button onClick={() => handlePress('-')} className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg h-10 font-bold text-lg transition-all active:scale-95 shadow-sm">-</button>

        {/* Row 4 */}
        <button onClick={() => handlePress('1')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">1</button>
        <button onClick={() => handlePress('2')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">2</button>
        <button onClick={() => handlePress('3')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">3</button>
        <button onClick={() => handlePress('+')} className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg h-10 font-bold text-lg transition-all active:scale-95 shadow-sm">+</button>

        {/* Row 5 */}
        <button onClick={() => handlePress('0')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">0</button>
        <button onClick={() => handlePress('.')} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg h-10 font-bold text-lg text-slate-700 transition-all active:scale-95 shadow-sm">.</button>
        <button onClick={() => handlePress('π')} className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 rounded-lg h-10 font-bold text-base transition-all active:scale-95 shadow-sm font-serif">π</button>
        <button onClick={calculate} className="bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 rounded-lg h-10 font-black text-lg shadow-md shadow-blue-600/20 transition-all active:scale-95">=</button>
      </div>
    </div>
  );
};

export default MathCalculator;
