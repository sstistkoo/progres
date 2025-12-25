
import { GoogleGenAI, Modality } from "@google/genai";
import { MachineConfig, ChatMessage, CustomCode } from "./types";

const getApiKey = () => process.env.API_KEY || "";

export const getGeminiStream = async (
  history: ChatMessage[], 
  machineConfig: MachineConfig, 
  currentGCode: string,
  selectedSnippet?: string,
  customCodes: CustomCode[] = [],
  isGeneralChat: boolean = false,
  imageData?: { data: string, mimeType: string }
) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const modelToUse = imageData ? 'gemini-3-pro-image-preview' : (machineConfig.selectedModel || 'gemini-flash-lite-latest');
  
  const activeRules = customCodes
    .filter(c => c.isActive)
    .map(c => `- [${c.name}]: ${c.code} ${c.description ? `(${c.description})` : ''}`)
    .join('\n');

  const commonContext = `
${activeRules ? `UŽIVATELSKÁ PRAVIDLA A NAUČENÉ POSTUPY:
${activeRules}` : ''}

KONTEXT STROJE:
- Typ: ${machineConfig.type}
- Systém: ${machineConfig.control}
`;

  let systemInstruction = '';

  if (isGeneralChat) {
    systemInstruction = `Jsi inteligentní AI asistent pro CNC operátory. Mluv česky a buď technicky přesný.
${commonContext}
Pokud analyzuješ kód, dívej se na celou logiku programu.

KONTEXT EDITU:
${currentGCode ? `Aktuální program:\n"""\n${currentGCode}\n"""` : 'Editor je prázdný.'}
`;
  } else {
    systemInstruction = `Jsi expert na CNC programování pro ${machineConfig.type} (${machineConfig.control}).
${commonContext}

HLAVNÍ ÚKOL: 
Provést hloubkovou analýzu kódu se zaměřením na bezpečnost, řezné podmínky a optimalizaci.

${selectedSnippet ? `
SPECIFICKÝ ÚKOL (ANALÝZA FRAGMENTU):
Uživatel vybral tento konkrétní úsek:
"""
${selectedSnippet}
"""

Tento úsek je součástí následujícího kompletního programu:
"""
${currentGCode}
"""

Při analýze fragmentu zohledni:
1. PŘEDCHOZÍ STAV: Jaké nástroje (T), korekce (D) a pracovní roviny (G17/18/19) byly aktivovány před tímto úsekem?
2. KONZISTENCE: Odpovídají posuvy (F) a otáčky (S) předchozím definicím nebo materiálu?
3. BEZPEČNOST: Jsou nájezdy a výjezdy v tomto úseku bezpečné vzhledem k celkové dráze?
4. DOPORUČENÍ: Navrhni konkrétní vylepšení pouze pro tento úsek, ale s vědomím celého kontextu.
` : `
ANALÝZA CELÉHO PROGRAMU:
"""
${currentGCode}
"""
`}

Pravidla výstupu:
1. Mluv česky.
2. G-code bloky piš v markdownu.
3. Buď kritický k bezpečnosti (kolize, chybějící stop vřetena, nesmyslné posuvy).
`;
  }

  const contents = history.map((msg, index) => {
    if (index === history.length - 1 && imageData && msg.role === 'user') {
      return {
        role: 'user',
        parts: [{ text: msg.content }, { inlineData: imageData }]
      };
    }
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    };
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: isGeneralChat ? 0.7 : 0.2,
      },
    });
    return responseStream;
  } catch (error: any) {
    if (error?.message?.includes("Requested entity was not found.")) {
      if (typeof window !== 'undefined' && window.aistudio) {
        window.aistudio.openSelectKey();
      }
    }
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const apiKey = getApiKey();
  if (!apiKey) return undefined;
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error: any) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const extractCodeFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const ocrPrompt = `Extrahuje G-kód z obrázku. POUZE kód.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: ocrPrompt }
        ]
      }
    });
    return (response.text || "").replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  } catch (error) {
    throw error;
  }
};
