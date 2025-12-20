
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getGeminiStream, generateSpeech } from '../geminiService';
import { ChatMessage, MachineConfig, GeminiModel, SavedProgram, MachineType } from '../types';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: Date;
}

interface ChatPanelProps {
  gcode: string;
  machineConfig: MachineConfig;
  setGcode: (code: string) => void;
  onClose: () => void;
  initialSnippet?: string;
  pendingAction?: { prompt: string, snippet: string } | null;
  clearPendingAction?: () => void;
  onModelChange: (model: GeminiModel) => void;
  savedPrograms?: SavedProgram[];
}

const SESSIONS_STORAGE_KEY = 'cnc_ai_sessions_v3';

// --- G-CODE SIMULATOR COMPONENT ---
interface SimulatorProps {
  code: string;
  machineType: MachineType;
  onClose: () => void;
}

const GCodeSimulator: React.FC<SimulatorProps> = ({ code, machineType, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0, z: 0 });
  const [viewMode, setViewMode] = useState<'top' | 'side'>('top');
  
  const path = useMemo(() => {
    const points: { x: number; y: number; z: number; type: 'rapid' | 'feed' }[] = [{ x: 0, y: 0, z: 10, type: 'rapid' }];
    let curX = 0, curY = 0, curZ = 10;
    let lastType: 'rapid' | 'feed' = 'rapid';
    
    const lines = code.split('\n');
    lines.forEach(line => {
      const clean = line.toUpperCase().split(';')[0].split('(')[0].trim();
      if (!clean) return;
      if (clean.includes('G00') || clean.includes('G0 ')) lastType = 'rapid';
      else if (clean.match(/G0?1|G0?2|G0?3/)) lastType = 'feed';
      const matchX = clean.match(/X\s*([-]?\d*\.?\d+)/);
      const matchY = clean.match(/Y\s*([-]?\d*\.?\d+)/);
      const matchZ = clean.match(/Z\s*([-]?\d*\.?\d+)/);
      let moved = false;
      if (matchX) { curX = parseFloat(matchX[1]); moved = true; }
      if (matchY) { curY = parseFloat(matchY[1]); moved = true; }
      if (matchZ) { curZ = parseFloat(matchZ[1]); moved = true; }
      if (moved) points.push({ x: curX, y: curY, z: curZ, type: lastType });
    });
    return points;
  }, [code, machineType]);

  useEffect(() => {
    if (!canvasRef.current || path.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let localProgress = progress;
    const pointsToScale = path.map(p => ({ h: p.x, v: viewMode === 'top' ? (machineType === MachineType.MILL ? p.y : p.z) : p.z }));
    let minH = Math.min(...pointsToScale.map(p => p.h), 0);
    let maxH = Math.max(...pointsToScale.map(p => p.h), 10);
    let minV = Math.min(...pointsToScale.map(p => p.v), 0);
    let maxV = Math.max(...pointsToScale.map(p => p.v), 10);
    const padding = 60;
    const scale = Math.min((canvas.width - padding*2) / ((maxH - minH) || 1), (canvas.height - padding*2) / ((maxV - minV) || 1));
    const offsetH = (canvas.width - (maxH-minH)*scale)/2 - minH*scale;
    const offsetV = (canvas.height - (maxV-minV)*scale)/2 - minV*scale;
    const transform = (ph: number, pv: number) => ({ x: ph * scale + offsetH, y: canvas.height - (pv * scale + offsetV) });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.beginPath();
      for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
      for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
      ctx.stroke();
      const origin = transform(0, 0); ctx.strokeStyle = '#334155'; ctx.beginPath();
      ctx.moveTo(0, origin.y); ctx.lineTo(canvas.width, origin.y); ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, canvas.height); ctx.stroke();
      const targetIndex = Math.min(Math.floor(localProgress), path.length - 1);
      for (let i = 1; i <= targetIndex; i++) {
        const p1Raw = { h: path[i-1].x, v: viewMode === 'top' ? (machineType === MachineType.MILL ? path[i-1].y : path[i-1].z) : path[i-1].z };
        const p2Raw = { h: path[i].x, v: viewMode === 'top' ? (machineType === MachineType.MILL ? path[i].y : path[i].z) : path[i].z };
        const p1 = transform(p1Raw.h, p1Raw.v); const p2 = transform(p2Raw.h, p2Raw.v);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
        if (path[i].type === 'rapid') { ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); }
        else { ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3; ctx.setLineDash([]); }
        ctx.stroke();
      }
      const head = transform(path[targetIndex].x, viewMode === 'top' ? (machineType === MachineType.MILL ? path[targetIndex].y : path[targetIndex].z) : path[targetIndex].z);
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(head.x, head.y, 7, 0, Math.PI * 2); ctx.fill();
      setCurrentPos({ x: path[targetIndex].x, y: path[targetIndex].y, z: path[targetIndex].z });
      if (isPlaying && localProgress < path.length - 1) { localProgress += 0.01 * speed; setProgress(localProgress); animationFrame = requestAnimationFrame(draw); }
    };
    draw(); return () => cancelAnimationFrame(animationFrame);
  }, [path, isPlaying, speed, viewMode, machineType]);

  return (
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-lg">👁️</div>
          <div>
            <h3 className="text-white font-black text-xs uppercase tracking-widest">Simulátor {viewMode === 'side' ? '(Bokorys)' : '(Půdorys)'}</h3>
            <div className="text-[10px] text-slate-500 font-mono">X:{currentPos.x.toFixed(2)} Y:{currentPos.y.toFixed(2)} Z:{currentPos.z.toFixed(2)}</div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center">✕</button>
      </div>
      <div className="flex-1 relative overflow-hidden"><canvas ref={canvasRef} width={1000} height={800} className="w-full h-full" /></div>
    </div>
  );
};

const GCodePreviewCard: React.FC<{ code: string, onInsert: (code: string) => void, onSimulate: (code: string) => void }> = ({ code, onInsert, onSimulate }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="my-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      <div className="bg-slate-800 px-3 py-2 flex justify-between items-center border-b border-slate-700">
        <span className="text-[10px] font-bold text-slate-400">G-CODE BLOK</span>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="text-[9px] bg-slate-700 text-white px-2 py-0.5 rounded">{copied ? 'OK' : 'Copy'}</button>
          <button onClick={() => onSimulate(code)} className="text-[9px] bg-blue-700 text-white px-2 py-0.5 rounded font-bold">Simulovat</button>
          <button onClick={() => onInsert(code)} className="text-[9px] bg-orange-600 text-white px-2 py-0.5 rounded font-bold">Vložit</button>
        </div>
      </div>
      <div className="p-3 font-mono text-[10px] overflow-x-auto text-slate-300 whitespace-pre">{code}</div>
    </div>
  );
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ gcode, machineConfig, setGcode, onClose, initialSnippet, pendingAction, clearPendingAction, onModelChange, savedPrograms = [] }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).map((s: any) => ({ ...s, lastUpdate: new Date(s.lastUpdate), messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) }));
    } catch (e) {}
    return [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessions.length > 0 ? sessions[0].id : null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<'ready' | 'loading' | 'error'>('ready');
  const [activeSnippet, setActiveSnippet] = useState<string>(initialSnippet || '');
  const [useContext, setUseContext] = useState(true);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);

  const [showLeftSidebar, setShowLeftSidebar] = useState(false);

  const analyzedData = useMemo(() => {
    const vars: { name: string, value: string, line: number, comment: string, isStatic: boolean, type: 'R' | '#' }[] = [];
    const logic: { type: string, line: number, target?: string, condition?: string }[] = [];
    const labels: { name: string, line: number }[] = [];

    const lines = gcode.split('\n');
    lines.forEach((line, idx) => {
      const clean = line.split(';')[0].split('(')[0].trim().toUpperCase();
      if (!clean) return;

      const labelMatch = line.match(/^([A-Z_0-9]+):/i);
      if (labelMatch) labels.push({ name: labelMatch[1], line: idx + 1 });

      const gotoMatch = clean.match(/GOTO\s+([A-Z_0-9]+)/i);
      if (gotoMatch) logic.push({ type: 'GOTO', line: idx + 1, target: gotoMatch[1] });

      const ifMatch = clean.match(/IF\s+\[(.*?)\]\s+GOTO\s+([A-Z_0-9]+)/i);
      if (ifMatch) logic.push({ type: 'IF-GOTO', line: idx + 1, condition: ifMatch[1], target: ifMatch[2] });

      const rMatch = line.match(/R(\d+|\[.*?\])\s*=\s*([^\s;]+)/i);
      if (rMatch) {
        vars.push({
          name: `R${rMatch[1]}`, value: rMatch[2], line: idx + 1,
          comment: (line.match(/[;(](.*)/)?.[1] || '').replace(/[)]/g, '').trim(),
          isStatic: /^[0-9.-]+$/.test(rMatch[2]), type: 'R'
        });
      }
      const hashMatch = line.match(/(#\d+)\s*=\s*([^\s;]+)/i);
      if (hashMatch) {
        vars.push({
          name: hashMatch[1], value: hashMatch[2], line: idx + 1,
          comment: (line.match(/[;(](.*)/)?.[1] || '').replace(/[)]/g, '').trim(),
          isStatic: /^[0-9.-]+$/.test(hashMatch[2]), type: '#'
        });
      }
    });
    return { vars, logic, labels };
  }, [gcode]);

  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSessionId) {
      const sess = sessions.find(s => s.id === activeSessionId);
      if (sess) setMessages(sess.messages);
    } else { createNewSession(); }
  }, [activeSessionId]);

  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      const updated = sessions.map(s => s.id === activeSessionId ? { ...s, messages, lastUpdate: new Date(), title: messages.find(m => m.role === 'user')?.content.substring(0, 40) || s.title } : s);
      setSessions(updated);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    }
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const createNewSession = () => {
    const id = Date.now().toString();
    const sess: ChatSession = { id, title: 'Nová konverzace', messages: [{ role: 'assistant', content: 'Ahoj! Jsem tvůj AI CNC analytik. Nyní s podporou hloubkové analýzy úseků kódu v kontextu celého programu. Co dnes prověříme?', timestamp: new Date() }], lastUpdate: new Date() };
    setSessions([sess, ...sessions]); setActiveSessionId(id); setMessages(sess.messages); setActiveTab('chat');
  };

  const handleSpeak = async (text: string, index: number) => {
    if (playingMessageIndex === index) { stopAudio(); return; }
    stopAudio(); setPlayingMessageIndex(index);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error();
      const audioBuffer = await audioContextRef.current.decodeAudioData(decodeBase64(base64Audio).buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer; source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingMessageIndex(null); source.start();
      audioSourceRef.current = source;
    } catch (e) { setPlayingMessageIndex(null); }
  };

  const stopAudio = () => { if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch (e) {} audioSourceRef.current = null; } setPlayingMessageIndex(null); };

  const sendMessage = async (text?: string, snippetContext?: string) => {
    const msgText = text || input.trim();
    if ((!msgText && !selectedImage) || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: selectedImage ? `[Obrázek] ${msgText}` : msgText, timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory); setInput(''); setIsLoading(true); setModelStatus('loading');
    const imagePayload = selectedImage ? { ...selectedImage } : undefined;
    setSelectedImage(null);
    const aiPlaceholder: ChatMessage = { role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, aiPlaceholder]);
    try {
      const stream = await getGeminiStream(newHistory, machineConfig, useContext ? gcode : '', useContext ? (snippetContext || activeSnippet) : '', undefined, true, imagePayload);
      let full = '';
      for await (const chunk of stream) {
        full += chunk.text || "";
        setMessages(prev => { const n = [...prev]; n[n.length - 1] = { ...n[n.length - 1], content: full }; return n; });
      }
      setModelStatus('ready');
    } catch (e) { setModelStatus('error'); } finally { setIsLoading(false); }
  };

  const handleDeepSnippetAnalysis = () => {
    if (!activeSnippet) return;
    sendMessage(`Proveď hloubkovou kontextovou analýzu tohoto úseku kódu. Zaměř se na návaznost na předchozí bloky (nástroje, korekce), bezpečnost drah a optimalizaci řezných parametrů.`);
  };

  const analyzeParamWithAI = (varName: string, val: string, comment: string) => {
    sendMessage(`Vysvětli význam a bezpečnost parametru "${varName}" v mém programu. Aktuální hodnota je "${val}". ${comment ? `V kódu je u něj komentář: "${comment}".` : ''} Zaměř se na vliv na logiku obrábění.`);
    setShowLeftSidebar(false);
  };

  const analyzeLogicAudit = () => {
    const logicMap = analyzedData.logic.map(l => `L${l.line}: ${l.type} -> ${l.target || ''} [${l.condition || ''}]`).join('\n');
    sendMessage(`Proveď kompletní audit logiky (IF/GOTO) v tomto programu. Hledej nekonečné smyčky a nebezpečné skoky. Přehled logických operací:\n${logicMap}`);
    setShowLeftSidebar(false);
  };

  const renderContent = (c: string) => {
    if (!c) return null;
    return c.split(/(```[\s\S]*?```)/gi).map((part, i) => {
      const m = part.match(/```(?:gcode|cnc|iso)?\n?([\s\S]*?)```/i);
      if (m) return <GCodePreviewCard key={i} code={m[1].trim()} onInsert={c => { setGcode(c); onClose(); }} onSimulate={c => setSimulationCode(c)} />;
      return <div key={i} className="text-sm leading-relaxed mb-2 last:mb-0 whitespace-pre-wrap">{part}</div>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] md:h-[600px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      {simulationCode && <GCodeSimulator code={simulationCode} machineType={machineConfig.type} onClose={() => setSimulationCode(null)} />}
      
      <div className="bg-slate-100 px-4 pt-3 border-b border-slate-200 z-10 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <span className="text-blue-600 font-bold text-xs uppercase flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${modelStatus === 'ready' ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`}></span>
              AI CNC Logic Expert
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={createNewSession} className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded font-bold shadow-sm hover:bg-slate-50 transition-colors">➕ NOVÁ</button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors">✕</button>
          </div>
        </div>
        <div className="flex gap-4">
          {['chat', 'history'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-2 text-xs font-bold uppercase border-b-2 transition-all ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>{t === 'chat' ? 'Analýza' : 'Historie'}</button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative bg-slate-50/20">
        {showLeftSidebar && (
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-700 overflow-y-auto animate-in slide-in-from-left-10 z-20 shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center sticky top-0">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic & Variables</span>
               <button onClick={() => setShowLeftSidebar(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
               <button onClick={analyzeLogicAudit} className="w-full bg-pink-600 hover:bg-pink-500 text-white py-2.5 rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-pink-900/40 transition-all active:scale-95">Audit Logiky (IF/GOTO) 🧠</button>
               
               <div className="space-y-4">
                 {analyzedData.labels.length > 0 && (
                   <div className="space-y-2">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Detekovaná Návěští</h4>
                      <div className="flex flex-wrap gap-1">
                        {analyzedData.labels.map((l, i) => (
                          <span key={i} className="bg-yellow-900/40 text-yellow-400 border border-yellow-800 px-2 py-0.5 rounded font-mono text-[9px]">{l.name}</span>
                        ))}
                      </div>
                   </div>
                 )}

                 <div className="space-y-2">
                   <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Proměnné</h4>
                   {analyzedData.vars.length > 0 ? (
                     analyzedData.vars.map((v, i) => (
                       <div key={i} className="bg-slate-800 border border-slate-700 p-3 rounded-xl group transition-all hover:border-slate-500">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded ${v.type === 'R' ? 'bg-purple-900 text-purple-200' : 'bg-pink-900 text-pink-200'}`}>{v.name}</span>
                            <span className={`text-[8px] px-1.5 rounded-full ${v.isStatic ? 'bg-slate-700 text-slate-400' : 'bg-cyan-900 text-cyan-300'} font-bold uppercase`}>{v.isStatic ? 'Fixní' : 'Výpočet'}</span>
                          </div>
                          <div className="text-[11px] text-white font-mono mb-1 truncate">{v.value}</div>
                          {v.comment && <div className="text-[10px] text-slate-500 italic truncate mb-2 leading-tight">; {v.comment}</div>}
                          <button onClick={() => analyzeParamWithAI(v.name, v.value, v.comment)} className="w-full text-[9px] bg-slate-700 hover:bg-slate-600 text-slate-300 py-1.5 rounded-lg font-bold transition-colors">AI Význam 🔍</button>
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-6 text-slate-600 text-[10px] italic">Žádné parametry.</div>
                   )}
                 </div>
               </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {activeTab === 'chat' ? (
            <>
              {activeSnippet && (
                <div className="mx-4 mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm animate-in slide-in-from-top-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1">
                      <span className="animate-pulse">●</span> Vybraný fragment pro hloubkovou analýzu
                    </span>
                    <button onClick={() => setActiveSnippet('')} className="text-orange-400 hover:text-orange-600 transition-colors">✕</button>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2 font-mono text-[10px] text-orange-400 max-h-20 overflow-y-auto whitespace-pre border border-orange-200/50">{activeSnippet}</div>
                  <button 
                    onClick={handleDeepSnippetAnalysis}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    🚀 Kontextová Analýza Fragmentu
                  </button>
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                      <div className="text-[9px] font-bold mb-1 uppercase opacity-60 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                           {m.role === 'user' ? 'Operátor' : 'AI Analytik'}
                           {m.role === 'assistant' && (
                             <button onClick={() => handleSpeak(m.content, i)} className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors ${playingMessageIndex === i ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 hover:text-blue-500'}`}>🔊</button>
                           )}
                        </div>
                        <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="chat-render">{renderContent(m.content)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedImage && (
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-3">
                   <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="h-14 w-14 object-cover rounded-lg border border-slate-300 shadow-sm" />
                   <div className="text-[10px] text-slate-500 font-bold uppercase">Fotka k analýze</div>
                   <button onClick={() => setSelectedImage(null)} className="ml-auto text-red-500 font-bold text-xs">✕</button>
                </div>
              )}

              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="p-3 border-t border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2">
                   <button type="button" onClick={() => setShowLeftSidebar(!showLeftSidebar)} className={`h-10 px-3 flex items-center gap-2 rounded-xl text-[10px] font-black uppercase transition-all border ${showLeftSidebar ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                      ⚡ Logika & Parametry {analyzedData.vars.length + analyzedData.labels.length > 0 && <span className="bg-white/20 px-1.5 rounded-lg">{analyzedData.vars.length + analyzedData.labels.length}</span>}
                   </button>
                   <button type="button" onClick={() => setSimulationCode(gcode)} className="h-10 px-3 flex-1 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md">
                      <span>👁️</span> Simulovat Program
                   </button>
                </div>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setSelectedImage({ data: (r.result as string).split(',')[1], mimeType: f.type }); r.readAsDataURL(f); } }} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 border border-slate-200 hover:text-blue-600 transition-colors">📷</button>
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Zeptej se na logiku nebo parametr..." className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50" />
                  <button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all active:scale-95">✈️</button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {sessions.map(s => (
                <div key={s.id} onClick={() => setActiveSessionId(s.id)} className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${activeSessionId === s.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className="font-bold text-xs truncate mb-1 text-slate-800">{s.title}</div>
                  <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{s.lastUpdate.toLocaleDateString()} • {s.messages.length} zpráv</div>
                </div>
              ))}
              {sessions.length === 0 && <div className="text-center py-20 text-slate-400 italic text-sm">Žádná historie konverzací.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
