
export enum MachineType {
  LATHE = 'lathe',
  CAROUSEL = 'carousel',
  MILL = 'mill'
}

export enum ControlSystem {
  SINUMERIK = 'sinumerik',
  FANUC = 'fanuc',
  HEIDENHAIN = 'heidenhain'
}

export type GeminiModel = 
  | 'gemini-3-pro-preview' 
  | 'gemini-3-flash-preview' 
  | 'gemini-2.5-flash-preview-09-2025' 
  | 'gemini-flash-lite-latest'
  | 'gemini-2.5-flash-preview-tts';

export interface MachineConfig {
  type: MachineType;
  control: ControlSystem;
  selectedModel: GeminiModel;
}

export interface ToolDefinition {
  id: string;
  name: string;
  tNumber: string;
  dNumber: string;
  radius: string;
}

export interface CustomCode {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface SavedProgram {
  id: string;
  name: string;
  content: string;
  date: string;
}

export interface GMCodeItem {
  code: string;
  category: string;
  title: string;
  description: string;
  example: string;
  systems?: ControlSystem[]; // Pokud chybí, platí pro všechny
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext?: typeof AudioContext;
  }
}
