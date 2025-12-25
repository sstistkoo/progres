# CNC AI Programátor Pro

Inteligentní asistent pro programování CNC strojů s podporou více ovládacích systémů (SINUMERIK, FANUC, HEIDENHAIN).

## Spuštění na Lokálním Disku

Aplikace je nyní plně funkční na lokálním disku bez potřeby internetu (kromě inicializace Gemini API).

### Předpoklady

- **Node.js** (verze 16+)
- **Gemini API Key** (zdarma na https://aistudio.google.com)

### Instalace a Spuštění

1. **Instalace závislostí:**

   ```bash
   npm install
   ```

2. **Konfigurace API klíče:**

   - Otevři soubor `.env`
   - Vložte váš Gemini API klíč:
     ```
     API_KEY=your-api-key-here
     ```

3. **Spuštění lokálně:**

   ```bash
   npm run dev
   ```

   Aplikace se otevře automaticky na `http://localhost:5173`

4. **Build pro produkci:**

   ```bash
   npm run build
   ```

5. **Preview buildu:**
   ```bash
   npm run preview
   ```

## Funkce

- ✅ 编集 a zlepšování G-kódu
- ✅ Kalkulačka nástrojů
- ✅ Automatická detekce CNC systému
- ✅ Chat s AI (Gemini)
- ✅ Ukládání programů
- ✅ Referenční manuál
- ✅ Nastavení stroje

## Technologické Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI
