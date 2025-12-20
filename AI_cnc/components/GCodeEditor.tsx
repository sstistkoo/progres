
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { G_M_CODES } from '../constants';
import { GMCodeItem, MachineConfig, ChatMessage, ToolDefinition, MachineType, CustomCode, GeminiModel, SavedProgram, ControlSystem } from '../types';
import { getGeminiStream, extractCodeFromImage } from '../geminiService';
import MathCalculator from './MathCalculator';

interface GCodeEditorProps {
  gcode: string;
  setGcode: (code: string) => void;
  onAction: (prompt: string, isSnippet?: boolean) => void;
  selectedGcode: string;
  setSelectedGcode: (code: string) => void;
  machineConfig: MachineConfig;
  definedTools: ToolDefinition[];
  setDefinedTools: (tools: ToolDefinition[]) => void;
  customCodes?: CustomCode[];
  onModelChange: (model: GeminiModel) => void;
  savedPrograms: SavedProgram[];
  setSavedPrograms: (programs: SavedProgram[]) => void;
  detectedSystem: ControlSystem | null;
}

interface ValidationError {
  line: number;
  token: string;
  message: string;
  severity: 'error' | 'warning';
}

interface SuggestionState {
  list: GMCodeItem[];
  index: number;
  x: number;
  y: number;
  wordStart: number;
  query: string;
}

interface HoverTooltip {
  code: string;
  title: string;
  description: string;
  example: string;
  x: number;
  y: number;
  system?: string;
}

type SidebarMode = 'none' | 'validation' | 'tools' | 'automation' | 'files';

const MODEL_OPTIONS: { id: GeminiModel; label: string }[] = [
  { id: 'gemini-flash-lite-latest', label: 'Flash-Lite' },
  { id: 'gemini-2.5-flash-preview-09-2025', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
];

const STORAGE_KEY_UI = 'cnc_editor_ui_v1';
const LINE_HEIGHT = 20;
const CHAR_WIDTH = 8.4;

const GCodeEditor: React.FC<GCodeEditorProps> = ({ 
  gcode, 
  setGcode, 
  onAction, 
  selectedGcode, 
  setSelectedGcode,
  machineConfig,
  definedTools,
  setDefinedTools,
  customCodes = [],
  onModelChange,
  savedPrograms,
  setSavedPrograms,
  detectedSystem
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);
  
  const [showVisualizer, setShowVisualizer] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UI);
    return saved ? JSON.parse(saved).showVisualizer : false;
  });
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UI);
    return saved ? JSON.parse(saved).sidebarMode : 'none';
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UI);
    return saved ? JSON.parse(saved).isCollapsed : false;
  });
  const [isChatCollapsed, setIsChatCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_UI);
    return saved ? JSON.parse(saved).isChatCollapsed : false;
  });

  const [suggestions, setSuggestions] = useState<SuggestionState | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltip | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [useContext, setUseContext] = useState(true);
  
  // NEW: State for Math Calculator visibility
  const [showMathCalc, setShowMathCalc] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const [newToolName, setNewToolName] = useState('');
  const [newToolT, setNewToolT] = useState('');
  const [newToolD, setNewToolD] = useState('');
  const [newToolR, setNewToolR] = useState('');
  const [toolTab, setToolTab] = useState<'scanned' | 'library'>('scanned');

  const [extractedParams, setExtractedParams] = useState<{name: string, value: string, line: number, comment: string}[]>([]);
  const [programNameInput, setProgramNameInput] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_UI, JSON.stringify({
      showVisualizer,
      sidebarMode,
      isCollapsed,
      isChatCollapsed
    }));
  }, [showVisualizer, sidebarMode, isCollapsed, isChatCollapsed]);

  const handleRenumber = () => {
    const lines = gcode.split('\n');
    let counter = 10;
    const step = 10;
    const newLines = lines.map(line => {
      const trim = line.trim();
      if (!trim || trim.startsWith(';') || trim.startsWith('(')) return line;
      let clean = line.replace(/^N\d+\s*/i, '');
      const newLine = `N${counter} ${clean}`;
      counter += step;
      return newLine;
    });
    setGcode(newLines.join('\n'));
  };

  const handleRemoveNumbers = () => {
    const lines = gcode.split('\n');
    const newLines = lines.map(line => line.replace(/^N\d+\s*/i, ''));
    setGcode(newLines.join('\n'));
  };

  const scanParameters = () => {
    const lines = gcode.split('\n');
    const results: {name: string, value: string, line: number, comment: string}[] = [];
    lines.forEach((line, idx) => {
      const rMatch = line.match(/R(\d+|\[.*?\])\s*=\s*([^\s;]+)/i);
      const hashMatch = line.match(/(#\d+)\s*=\s*([^\s;]+)/i);
      const commentMatch = line.match(/[;(](.*)/);
      const comment = commentMatch ? commentMatch[1].replace(/[)]/g, '').trim() : '';
      if (rMatch) results.push({ name: `R${rMatch[1]}`, value: rMatch[2], line: idx + 1, comment: comment });
      if (hashMatch) results.push({ name: hashMatch[1], value: hashMatch[2], line: idx + 1, comment: comment });
    });
    setExtractedParams(results);
  };

  useEffect(() => {
    if (sidebarMode === 'automation') scanParameters();
  }, [sidebarMode, gcode]);

  useEffect(() => {
    if (!showVisualizer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<rect.width; i+=50) { ctx.moveTo(i,0); ctx.lineTo(i, rect.height); }
    for(let i=0; i<rect.height; i+=50) { ctx.moveTo(0,i); ctx.lineTo(rect.width, i); }
    ctx.stroke();

    let curX = 0, curY = 0; 
    const points: { x: number; y: number; type: 'rapid' | 'feed' }[] = [{ x: 0, y: 0, type: 'rapid' }];
    const lines = gcode.split('\n');
    let lastType: 'rapid' | 'feed' = 'rapid';

    lines.forEach(line => {
      const upper = line.toUpperCase().split(';')[0];
      if (!upper || upper.startsWith('(')) return;
      if (upper.includes('G0') || upper.includes('G00')) lastType = 'rapid';
      else if (upper.match(/G0?1|G0?2|G0?3/)) lastType = 'feed';
      const matchX = upper.match(/X\s*([-]?\d*\.?\d+)/);
      const matchY = upper.match(/Y\s*([-]?\d*\.?\d+)/);
      const matchZ = upper.match(/Z\s*([-]?\d*\.?\d+)/);
      let moved = false;
      if (matchX) { curX = parseFloat(matchX[1]); moved = true; }
      if (machineConfig.type === MachineType.MILL) {
        if (matchY) { curY = parseFloat(matchY[1]); moved = true; }
      } else {
        if (matchZ) { curY = parseFloat(matchZ[1]); moved = true; }
      }
      if (moved) points.push({ x: curX, y: curY, type: lastType });
    });

    if (points.length < 2) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    });

    const padding = 40;
    const rangeX = (maxX - minX) || 100;
    const rangeY = (maxY - minY) || 100;
    const scale = Math.min((rect.width - padding * 2) / rangeX, (rect.height - padding * 2) / rangeY);
    const offsetX = (rect.width - rangeX * scale) / 2 - minX * scale;
    const offsetY = (rect.height - rangeY * scale) / 2 - minY * scale;
    const transform = (px: number, py: number) => ({ x: px * scale + offsetX, y: rect.height - (py * scale + offsetY + padding) });
    const origin = transform(0, 0);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.strokeStyle = '#ef4444'; ctx.moveTo(origin.x, origin.y); ctx.lineTo(origin.x + 30, origin.y); ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = '#22c55e'; ctx.moveTo(origin.x, origin.y); ctx.lineTo(origin.x, origin.y - 30); ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const p1 = transform(points[i-1].x, points[i-1].y);
      const p2 = transform(points[i].x, points[i].y);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      if (points[i].type === 'rapid') { ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); } 
      else { ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.setLineDash([]); }
      ctx.stroke();
    }
  }, [gcode, showVisualizer, machineConfig.type]);

  const validation = useMemo(() => {
    const lines = gcode.split('\n');
    const errors: ValidationError[] = [];
    const knownCodes = new Set<string>();
    G_M_CODES.forEach(c => {
      const match = c.code.match(/([A-Z])0*(\d+)/i);
      if (match) knownCodes.add(`${match[1]}${match[2]}`.toUpperCase());
      else knownCodes.add(c.code.toUpperCase());
    });

    lines.forEach((line, index) => {
      let cleanLine = line.split(';')[0].split('(')[0].trim().toUpperCase();
      if (!cleanLine) return;
      const tokens = cleanLine.match(/([A-Z](?:\[.*?\]|#[0-9]+|[=]?[+-]?[0-9.eE+\-*\/]+)?|\bL\b|\bC\b|\bRND\b|\bCYCL\b|\bTOOL\b)/gi) || [];
      tokens.forEach(token => {
        const upper = token.toUpperCase();
        if (upper.startsWith('G') || upper.startsWith('M')) {
           const numVal = parseInt(upper.slice(1), 10);
           if (!isNaN(numVal)) {
             const normalizedToken = `${upper.charAt(0)}${numVal}`;
             if (!knownCodes.has(normalizedToken)) errors.push({ line: index + 1, token: token, message: `Neznámý kód ${token}`, severity: 'warning' });
           }
        } 
      });
    });
    return errors;
  }, [gcode]);

  const scannedTools = useMemo(() => {
    const lines = gcode.split('\n');
    const items: { type: 'T' | 'D' | 'H' | 'TC', code: string, line: number, comment: string }[] = [];
    lines.forEach((line, index) => {
      const commentMatch = line.match(/\(([^)]+)\)/);
      const comment = commentMatch ? commentMatch[1] : '';
      const matches = line.match(/([TDH]\d+|TOOL CALL \d+)/gi);
      if (matches) matches.forEach(m => items.push({ type: m.includes('TOOL') ? 'TC' : m[0].toUpperCase() as any, code: m.toUpperCase(), line: index + 1, comment }));
    });
    return items;
  }, [gcode]);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    setHoverTooltip(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current || isCollapsed || showVisualizer) return;
    
    const rect = textareaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + textareaRef.current.scrollLeft - 16; // 16px padding
    const y = e.clientY - rect.top + textareaRef.current.scrollTop - 16; // 16px padding
    
    const lineIdx = Math.floor(y / LINE_HEIGHT);
    const colIdx = Math.floor(x / CHAR_WIDTH);
    
    const lines = gcode.split('\n');
    if (lineIdx < 0 || lineIdx >= lines.length) { setHoverTooltip(null); return; }
    
    const line = lines[lineIdx];
    // Find word under coordinate
    let word = "";
    let startIdx = -1;
    
    // Check if within line bounds
    if (colIdx >= 0 && colIdx < line.length) {
      // Find start of word
      let s = colIdx;
      while (s >= 0 && /[\w#\[\]]/.test(line[s])) { s--; }
      startIdx = s + 1;
      
      // Find end of word
      let e_idx = colIdx;
      while (e_idx < line.length && /[\w#\[\]]/.test(line[e_idx])) { e_idx++; }
      
      word = line.substring(startIdx, e_idx).toUpperCase();
    }

    if (word && (word.startsWith('G') || word.startsWith('M') || word === 'L' || word === 'C' || word === 'CYCL' || word === 'TOOL')) {
      // Check for exact code or normalized (G01 vs G1)
      let matchedCode: GMCodeItem | undefined;
      
      if (word.startsWith('G') || word.startsWith('M')) {
         const numVal = parseInt(word.slice(1), 10);
         const normalized = !isNaN(numVal) ? `${word[0]}${numVal}` : word;
         matchedCode = G_M_CODES.find(c => {
           const cNum = parseInt(c.code.slice(1), 10);
           const cNorm = !isNaN(cNum) ? `${c.code[0]}${cNum}` : c.code.toUpperCase();
           return cNorm === normalized && (!c.systems || c.systems.includes(machineConfig.control));
         });
      } else {
         matchedCode = G_M_CODES.find(c => c.code.toUpperCase().startsWith(word) && (!c.systems || c.systems.includes(machineConfig.control)));
      }

      if (matchedCode) {
        setHoverTooltip({
          code: matchedCode.code,
          title: matchedCode.title,
          description: matchedCode.description,
          example: matchedCode.example,
          x: e.clientX,
          y: e.clientY,
          system: matchedCode.systems ? matchedCode.systems[0] : 'Univerzální'
        });
      } else {
        setHoverTooltip(null);
      }
    } else {
      setHoverTooltip(null);
    }
  };

  const renderHighlightedGCode = () => {
    return gcode.split('\n').map((line, lineIdx) => {
      const lineNum = lineIdx + 1;
      const lineErrors = validation.filter(e => e.line === lineNum);
      const parts = line.split(/([;(].*)/);
      return (
        <div key={lineIdx} className="whitespace-pre min-h-[1.25rem]">
          {parts.map((part, partIdx) => {
            if (!part) return null;
            if (part.startsWith(';') || part.startsWith('(')) return <span key={partIdx} className="text-emerald-500 italic">{part}</span>;
            const logicKeywords = /\b(IF|THEN|ELSE|ENDIF|GOTO|WHILE|ENDWHILE|REPEAT|UNTIL|OR|AND|NOT|CYCL|DEF|CALL|TOOL|BEGIN|END|PGM)\b/gi;
            const tokens = part.split(/(\bL\b|\bC\b|\bRND\b|\bCC\b|\bLBL\b|[A-Z](?:\[.*?\]|#[0-9]+|[=]?[+-]?[0-9.eE+\-*\/]+)?|\s+|[=><!]+|[:])/gi);
            return tokens.map((token, tokenIdx) => {
              if (!token) return null;
              if (/^\s+$/.test(token)) return token;
              const upper = token.toUpperCase();
              let colorClass = "text-slate-300";
              const error = lineErrors.find(e => token.toUpperCase().includes(e.token.toUpperCase()));
              
              if (logicKeywords.test(upper)) colorClass = "text-pink-500 font-black";
              else if (upper.includes(':')) colorClass = "text-yellow-400 font-black underline";
              else if (upper === 'L' || upper === 'C' || upper === 'RND' || upper === 'CC') colorClass = "text-cyan-400 font-bold";
              else if (upper.startsWith('G') || upper.startsWith('M')) colorClass = "text-cyan-400 font-bold";
              else if (/[XYZIJKABC]/.test(upper)) colorClass = "text-orange-400";
              else if (/[FS]/.test(upper)) colorClass = "text-yellow-300";
              else if (/[TDH]/.test(upper)) colorClass = "text-purple-400 font-bold";
              else if (upper.startsWith('N')) colorClass = "text-slate-500";
              else if (upper.startsWith('#') || upper.includes('=')) colorClass = "text-pink-400 font-bold";
              else if (upper.includes('[') || upper.includes(']') || /[+\-*\/]/.test(upper)) colorClass = "text-pink-300";
              
              return <span key={tokenIdx} className={`${colorClass} ${error ? (error.severity === 'error' ? 'border-b-2 border-red-500/80 bg-red-500/10' : 'border-b-2 border-yellow-500/80 bg-yellow-500/10') : ''}`} title={error?.message}>{token}</span>;
            });
          })}
        </div>
      );
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestions({ ...suggestions, index: (suggestions.index + 1) % suggestions.list.length }); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestions({ ...suggestions, index: (suggestions.index - 1 + suggestions.list.length) % suggestions.list.length }); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertSuggestion(suggestions.list[suggestions.index].code); return; }
      if (e.key === 'Escape') { setSuggestions(null); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
  };

  const insertSuggestion = (code: string) => {
    if (!suggestions || !textareaRef.current) return;
    const before = gcode.substring(0, suggestions.wordStart);
    const after = gcode.substring(textareaRef.current.selectionStart);
    setGcode(before + code + ' ' + after);
    setSuggestions(null);
    const newCursorPos = before.length + code.length + 1;
    setTimeout(() => { if (textareaRef.current) { textareaRef.current.focus(); textareaRef.current.setSelectionRange(newCursorPos, newCursorPos); } }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value; setGcode(newVal);
    const cursor = e.target.selectionStart;
    const textBefore = newVal.substring(0, cursor);
    const lines = textBefore.split('\n');
    const currentLineText = lines[lines.length - 1];
    const words = currentLineText.split(/[\s,]/);
    const lastWord = words[words.length - 1].toUpperCase();
    
    if (lastWord.length > 0) {
      const filtered = G_M_CODES.filter(c => {
        const isSystemMatch = !c.systems || c.systems.includes(machineConfig.control);
        if (!isSystemMatch) return false;
        const code = c.code.toUpperCase();
        return code.startsWith(lastWord) || code.includes(lastWord);
      });
      
      if (filtered.length > 0) {
        const lineIdx = lines.length - 1;
        const colIdx = currentLineText.length - lastWord.length;
        const scrollOffset = textareaRef.current ? textareaRef.current.scrollTop : 0;
        setSuggestions({ list: filtered, index: 0, x: 16 + (colIdx * CHAR_WIDTH), y: 20 + (lineIdx * LINE_HEIGHT) - scrollOffset, wordStart: cursor - lastWord.length, query: lastWord });
      } else setSuggestions(null);
    } else setSuggestions(null);
  };

  const handleSave = () => { localStorage.setItem('cnc_gcode_content', gcode); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); };

  // New function to insert math result into editor
  const handleInsertMathResult = (value: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = gcode.substring(0, start);
    const after = gcode.substring(end);
    setGcode(before + value + after);
    setTimeout(() => {
      if(textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + value.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleSendToAi = async (e?: React.FormEvent, customText?: string, specificSnippet?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || isAiLoading) return;
    const effectiveGCode = useContext ? gcode : '';
    const contextSnippet = useContext ? (specificSnippet || selectedGcode) : '';
    const userMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]); setChatInput(''); setIsAiLoading(true);
    const aiMsgPlaceholder: ChatMessage = { role: 'assistant', content: '', timestamp: new Date() };
    // Fix: Reference correctly to aiMsgPlaceholder instead of aiPlaceholder
    setChatMessages(prev => [...prev, aiMsgPlaceholder]);
    try {
      const stream = await getGeminiStream([...chatMessages, userMsg], machineConfig, effectiveGCode, contextSnippet, customCodes, false);
      let fullResponse = '';
      for await (const chunk of stream) { fullResponse += chunk.text || ""; setChatMessages(prev => { const newMsgs = [...prev]; newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: fullResponse }; return newMsgs; }); }
    } catch (error) { setChatMessages(prev => { const newMsgs = [...prev]; newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: 'Chyba AI spojení.' }; return newMsgs; }); } finally { setIsAiLoading(false); }
  };

  const insertCodeFromChat = (code: string) => { setGcode(code); setIsCollapsed(false); };
  const handleAddTool = () => { if (newToolT && newToolD) { setDefinedTools([...definedTools, { id: Date.now().toString(), name: newToolName || `Nástroj T${newToolT}`, tNumber: newToolT, dNumber: newToolD, radius: newToolR }]); setNewToolName(''); setNewToolT(''); setNewToolD(''); setNewToolR(''); } };
  const handleDeleteTool = (id: string) => { setDefinedTools(definedTools.filter(t => t.id !== id)); };
  const handleInternalSave = () => { if (!programNameInput || !gcode) return; const newProg: SavedProgram = { id: Date.now().toString(), name: programNameInput, content: gcode, date: new Date().toLocaleDateString() }; setSavedPrograms([newProg, ...savedPrograms]); setProgramNameInput(''); };
  const handleDeleteProgram = (id: string) => setSavedPrograms(savedPrograms.filter(p => p.id !== id));
  const handleImportFiles = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files || files.length === 0) return; let merged = ""; let readCount = 0; Array.from(files).forEach((file: File) => { const reader = new FileReader(); reader.onload = (ev) => { merged += `; --- SOUBOR: ${file.name} ---\n` + (ev.target?.result as string) + "\n\n"; readCount++; if (readCount === files.length) { setGcode(merged); setIsCollapsed(false); } }; reader.readAsText(file); }); };
  const toggleSidebar = (mode: SidebarMode) => { if (sidebarMode === mode) setSidebarMode('none'); else { setSidebarMode(mode); setIsCollapsed(false); setShowVisualizer(false); } };

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0 relative">
      {suggestions && !isCollapsed && (
        <div className="absolute z-[80] bg-slate-800 border border-slate-700 shadow-2xl rounded-lg overflow-hidden w-72 animate-in fade-in ring-4 ring-slate-900/30" style={{ top: Math.min(suggestions.y, 400), left: Math.min(suggestions.x, 300) }} onClick={e => e.stopPropagation()}>
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-700 flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Návrhy: {suggestions.query}</span></div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {suggestions.list.map((item, idx) => (
              <div key={item.code} onClick={() => insertSuggestion(item.code)} onMouseEnter={() => setSuggestions({ ...suggestions, index: idx })} className={`flex flex-col p-2.5 cursor-pointer border-b border-slate-700/50 transition-all relative ${idx === suggestions.index ? 'bg-blue-600/20 ring-1 ring-inset ring-blue-500/50' : 'hover:bg-slate-700/30'}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.category === 'pohyb' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : item.category === 'cycle' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-emerald-500'}`} />
                <div className="flex justify-between items-center mb-0.5"><span className={`text-sm font-black font-mono ${idx === suggestions.index ? 'text-blue-400' : 'text-white'}`}>{item.code}</span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 uppercase">{item.category}</span></div>
                <div className="text-[11px] text-slate-300 font-medium truncate">{item.title}</div>
                {idx === suggestions.index && <div className="text-[9px] text-slate-400 italic leading-tight animate-in fade-in duration-300 border-t border-slate-700 pt-1.5 mt-1">{item.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {hoverTooltip && !isCollapsed && (
        <div className="fixed z-[100] bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-4 w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-200" style={{ left: hoverTooltip.x + 20, top: hoverTooltip.y - 40 }}>
          <div className="flex justify-between items-start mb-2">
            <span className="bg-cyan-900 text-cyan-400 font-mono font-black px-2 py-0.5 rounded text-sm">{hoverTooltip.code}</span>
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">{hoverTooltip.system}</span>
          </div>
          <div className="font-bold text-slate-200 text-xs mb-1 uppercase tracking-tight">{hoverTooltip.title}</div>
          <div className="text-[10px] text-slate-400 leading-relaxed mb-3">{hoverTooltip.description}</div>
          <div className="bg-slate-800 p-2 rounded border border-slate-700 font-mono text-[9px] text-orange-400">
            <div className="text-slate-600 mb-1 font-bold">Příklad:</div>
            {hoverTooltip.example}
          </div>
        </div>
      )}

      {/* Floating Math Calculator */}
      {showMathCalc && (
        <MathCalculator onClose={() => setShowMathCalc(false)} onInsert={handleInsertMathResult} />
      )}

      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${isCollapsed ? 'h-12 shrink-0' : 'flex-1'}`}>
        <div onClick={() => setIsCollapsed(!isCollapsed)} className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center h-12 shrink-0 cursor-pointer hover:bg-slate-200 transition-colors select-none">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="p-1 text-slate-500 transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { if (showVisualizer) setShowVisualizer(false); else { setShowVisualizer(true); setIsCollapsed(false); setSidebarMode('none'); } }} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1 ${showVisualizer ? 'bg-white shadow-sm text-slate-900 border border-slate-300' : 'text-slate-500 hover:text-slate-700'}`}><span>👁️</span> VIZUALIZACE</button>
              <div className="w-px h-4 bg-slate-300 mx-1"></div>
              {customCodes.filter(c => c.isActive).length > 0 && <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-200 animate-in fade-in">🧠 Memory ON</span>}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button 
              className={`w-8 h-8 flex items-center justify-center rounded transition-all border ${showMathCalc ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}
              onClick={() => setShowMathCalc(!showMathCalc)}
              title="Kalkulačka"
            >
              🧮
            </button>
            <button 
              className={`w-8 h-8 flex items-center justify-center rounded transition-all border ${saveStatus === 'saved' ? 'bg-green-600 text-white border-green-700' : 'bg-white text-slate-500 border-slate-300 hover:bg-blue-50 hover:text-blue-600'}`} 
              onClick={handleSave}
              title="Uložit (Ctrl+S)"
            >
              {saveStatus === 'saved' ? '✓' : '💾'}
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="flex-1 relative bg-slate-900 overflow-hidden flex flex-row">
            <div className="flex-1 relative overflow-hidden">
              {!showVisualizer && <div ref={highlightRef} className="absolute inset-0 p-4 font-mono text-sm pointer-events-none overflow-auto scrollbar-hide whitespace-pre" style={{ lineHeight: '1.25rem' }}>{renderHighlightedGCode()}</div>}
              <textarea ref={textareaRef} value={gcode} onChange={handleTextChange} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverTooltip(null)} onKeyDown={handleKeyDown} onScroll={handleScroll} className={`absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent caret-white focus:outline-none resize-none overflow-auto whitespace-pre z-10 ${showVisualizer ? 'opacity-0 pointer-events-none' : 'text-transparent'}`} spellCheck={false} style={{ lineHeight: '1.25rem' }} />
              {showVisualizer && <div className="absolute inset-0 flex items-center justify-center"><canvas ref={canvasRef} className="w-full h-full bg-slate-800 block" /></div>}
            </div>

            {sidebarMode !== 'none' && (
              <div className="absolute inset-0 w-full z-20 bg-slate-800 p-0 overflow-y-auto border-l border-slate-700 md:static md:w-72 md:block flex flex-col">
                <div className="flex justify-between items-center p-3 border-b border-slate-700 sticky top-0 bg-slate-800 z-10 shrink-0">
                  <span className="text-slate-300 font-bold uppercase tracking-widest text-xs">{sidebarMode === 'validation' ? 'Analýza chyb' : sidebarMode === 'tools' ? 'Správa nástrojů' : sidebarMode === 'automation' ? 'Rychlé nástroje' : 'Knihovna a Soubory'}</span>
                  <button onClick={() => setSidebarMode('none')} className="w-7 h-7 flex items-center justify-center rounded bg-slate-700 text-slate-300 border border-slate-600 text-sm">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
                  {sidebarMode === 'files' && (
                    <div className="space-y-6">
                      <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Uložit aktuální kód</h4>
                        <div className="flex gap-2"><input type="text" value={programNameInput} onChange={e => setProgramNameInput(e.target.value)} placeholder="Název programu..." className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" /><button onClick={handleInternalSave} disabled={!programNameInput} className="bg-green-600 hover:bg-green-500 text-white text-[10px] px-3 py-1 rounded font-bold disabled:opacity-50">ULOŽIT</button></div>
                      </div>
                      <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Import z počítače</h4>
                        <input type="file" multiple ref={fileImportRef} className="hidden" accept=".nc,.spf,.mpf,.txt" onChange={handleImportFiles} />
                        <button onClick={() => fileImportRef.current?.click()} className="w-full border-2 border-dashed border-slate-600 p-3 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-all text-[10px] font-bold flex flex-col items-center gap-1"><span>📥</span> NAHRÁT NC SOUBORY</button>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase px-1">Uložené programy</h4>
                        {savedPrograms.length === 0 ? <div className="text-[10px] text-slate-600 italic py-4 text-center">Prázdná knihovna</div> : (savedPrograms.map(prog => (<div key={prog.id} className="bg-slate-700/50 p-2.5 rounded border border-slate-600 group hover:border-blue-500 transition-colors"><div className="font-bold text-xs text-slate-200 truncate mb-1">{prog.name}</div><div className="text-[9px] text-slate-500 font-mono mb-2">{prog.date} • {prog.content.length} znaků</div><div className="flex gap-1.5"><button onClick={() => { setGcode(prog.content); setIsCollapsed(false); setSidebarMode('none'); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[9px] py-1 rounded font-bold">NAČÍST</button><button onClick={() => handleDeleteProgram(prog.id)} className="bg-slate-600 hover:bg-red-600 text-white text-[9px] px-2 rounded">🗑️</button></div></div>)))}
                      </div>
                    </div>
                  )}
                  {sidebarMode === 'validation' && (
                    <div className="space-y-1.5">{validation.length > 0 ? (validation.map((err, i) => (<div key={i} className={`p-2 rounded text-[10px] border ${err.severity === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'}`}><div className="flex justify-between font-bold mb-0.5"><span>L{err.line}: {err.token}</span></div><div className="opacity-80 leading-tight">{err.message}</div></div>))) : <div className="text-center py-10 opacity-60 text-xs text-slate-500">✅ Žádné chyby</div>}</div>
                  )}
                  {sidebarMode === 'automation' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl mb-4">
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Systémová diagnostika</h4>
                           <div className="flex items-center justify-between"><span className="text-[11px] text-slate-300">Identifikovaný dialekt:</span><span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase">{detectedSystem ? detectedSystem.toUpperCase() : 'NEZNÁMÝ'}</span></div>
                        </div>
                        <button onClick={handleRenumber} className="w-full bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded text-[11px] font-bold text-left flex justify-between items-center"><span>Přečíslovat (N10, N20...)</span><span>🔢</span></button>
                        <button onClick={handleRemoveNumbers} className="w-full bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded text-[11px] font-bold text-left flex justify-between items-center"><span>Odstranit číslování</span><span>🗑️</span></button>
                        <div className="bg-slate-900 border border-slate-600 rounded overflow-hidden mt-4"><table className="w-full text-left text-[10px]"><thead className="bg-slate-700 text-slate-300 font-bold"><tr><th className="p-1.5">Proměnná</th><th className="p-1.5">Aktuální hodnota</th></tr></thead><tbody className="divide-y divide-slate-700">{extractedParams.map((p, i) => (<tr key={i} className="hover:bg-slate-800"><td className="p-1.5 font-mono text-purple-300">{p.name}</td><td className="p-1.5 font-mono text-white">{p.value}</td></tr>))}</tbody></table></div>
                    </div>
                  )}
                  {sidebarMode === 'tools' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-slate-900 rounded-lg"><button onClick={() => setToolTab('scanned')} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md ${toolTab === 'scanned' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Použité</button><button onClick={() => setToolTab('library')} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md ${toolTab === 'library' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>Knihovna</button></div>
                      {toolTab === 'scanned' ? (
                        <div className="space-y-2">{scannedTools.map((item, idx) => (<div key={idx} className="bg-slate-700/50 p-2 rounded border border-slate-600"><div className="flex justify-between items-center"><span className="text-[11px] font-black font-mono px-1.5 bg-blue-900 text-blue-200 rounded">{item.code}</span><span className="text-[9px] text-slate-500">N{item.line}</span></div>{item.comment && <div className="text-[10px] text-slate-300 italic truncate">({item.comment})</div>}</div>))}</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-slate-700/30 p-2 rounded border border-slate-600 space-y-2"><input type="text" placeholder="Název" value={newToolName} onChange={e => setNewToolName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" /><div className="flex gap-1"><input type="number" placeholder="T" value={newToolT} onChange={e => setNewToolT(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" /><input type="number" placeholder="D" value={newToolD} onChange={e => setNewToolD(e.target.value)} className="w-1/2 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white" /></div><button onClick={handleAddTool} className="w-full bg-blue-600 text-white text-[10px] py-1 rounded">+ PŘIDAT</button></div>
                          <div className="space-y-2">{definedTools.map(tool => (<div key={tool.id} className="bg-slate-700 p-2 rounded border border-slate-600 relative group"><button onClick={() => handleDeleteTool(tool.id)} className="absolute top-1 right-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">✕</button><div className="font-bold text-xs text-white">{tool.name}</div><div className="text-[10px] text-blue-300 font-mono">T{tool.tNumber} D{tool.dNumber}</div><button onClick={() => { const b = gcode.substring(0, textareaRef.current?.selectionStart || 0); setGcode(b + `T${tool.tNumber} D${tool.dNumber}` + gcode.substring(textareaRef.current?.selectionStart || 0)); }} className="mt-2 w-full text-[9px] bg-slate-600 py-1 rounded">VLOŽIT ↵</button></div>))}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`bg-white rounded-xl shadow-md border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 shrink-0 ${isChatCollapsed ? 'h-12' : 'h-fit max-h-[350px] md:max-h-[500px]'}`}>
        <div onClick={() => setIsChatCollapsed(!isChatCollapsed)} className="bg-blue-600 px-4 py-2 border-b border-blue-700 flex justify-between items-center h-12 shrink-0 cursor-pointer hover:bg-blue-700 transition-colors select-none text-white">
          <div className="flex items-center gap-4"><h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"><span className="p-1 transition-transform duration-300" style={{ transform: isChatCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>🤖 AI CNC</h3>{!isChatCollapsed && <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}><select value={machineConfig.selectedModel} onChange={(e) => onModelChange(e.target.value as GeminiModel)} className="bg-blue-700/50 text-white text-[10px] font-bold uppercase rounded px-2 py-0.5 border border-blue-500">{MODEL_OPTIONS.map(opt => <option key={opt.id} value={opt.id} className="bg-slate-800">{opt.label}</option>)}</select><label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={useContext} onChange={() => setUseContext(!useContext)} className="w-3 h-3 rounded" /><span className="text-[9px] font-bold uppercase tracking-tight text-green-200">Editor: {useContext ? 'ZAP' : 'VYP'}</span></label></div>}</div>
        </div>
        {!isChatCollapsed && (
          <div className="flex flex-col overflow-hidden">
            {(chatMessages.length > 0 || isAiLoading || isExtracting) && (
              <div ref={chatScrollRef} className="overflow-y-auto p-4 bg-slate-50/50 space-y-4 max-h-[200px] md:max-h-[300px]">
                {chatMessages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}><div className="text-[9px] font-bold mb-1 uppercase opacity-60">{msg.role === 'user' ? 'OPERÁTOR' : 'INTELIGENCE'}</div><div className="leading-relaxed whitespace-pre-wrap">{msg.content.includes('```') ? (msg.content.split(/(```[\s\S]*?```)/).map((part, i) => { if (part.startsWith('```')) { const code = part.replace(/```[a-z]*\n?|```/g, '').trim(); return (<div key={i} className="my-2 bg-slate-900 p-3 rounded-lg border border-slate-700"><pre className="text-[11px] font-mono text-cyan-400 overflow-x-auto">{code}</pre><button onClick={() => insertCodeFromChat(code)} className="mt-2 w-full bg-orange-600 text-white text-[10px] py-1 rounded font-bold">VLOŽIT DO EDITORU 📥</button></div>); } return part; })) : msg.content}</div></div></div>))}
                {(isAiLoading || isExtracting) && <div className="text-[10px] font-bold text-blue-600 animate-pulse uppercase px-2">{isExtracting ? 'PROBÍHÁ OCR ANALÝZA...' : 'AI ANALYZUJE...'}</div>}
              </div>
            )}
            <form onSubmit={handleSendToAi} className="px-4 pt-2 pb-2 border-t border-slate-100 bg-white flex flex-col gap-1.5 shrink-0">
              <textarea rows={2} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ptejte se na kód..." className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner bg-slate-50" disabled={isAiLoading || isExtracting} />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toggleSidebar('automation')} className={`p-2 rounded-xl h-10 w-12 flex items-center justify-center border ${sidebarMode === 'automation' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-indigo-600 border-slate-200'}`}>⚡</button>
                <input type="file" ref={ocrInputRef} onChange={e => { const file = e.target.files?.[0]; if (file) { setIsExtracting(true); const reader = new FileReader(); reader.onloadend = async () => { const base64Data = (reader.result as string).split(',')[1]; try { const code = await extractCodeFromImage(base64Data, file.type); if (code) { setGcode(gcode + "\n" + code); setIsCollapsed(false); setChatInput("Kód extrahován a vložen. ✅"); } } catch (err) { setChatInput("Chyba při OCR."); } finally { setIsExtracting(false); } }; reader.readAsDataURL(file); } }} accept="image/*" className="hidden" />
                <button type="button" onClick={() => ocrInputRef.current?.click()} className="p-2 rounded-xl h-10 w-12 flex items-center justify-center border bg-slate-100 text-slate-600 border-slate-200">📷</button>
                <button type="submit" disabled={isAiLoading || !chatInput.trim() || isExtracting} className="flex-1 bg-blue-600 text-white h-10 rounded-xl font-bold text-[11px] hover:bg-blue-700 shadow-md disabled:opacity-50">ANALYZOVAT</button>
                <button type="button" onClick={() => toggleSidebar('files')} className={`p-2 rounded-xl h-10 w-12 flex items-center justify-center border ${sidebarMode === 'files' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-100 text-orange-600 border-slate-200'}`}>📂</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GCodeEditor;
