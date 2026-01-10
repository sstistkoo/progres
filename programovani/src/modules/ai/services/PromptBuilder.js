import { state } from '../../../core/state.js';
import { CodeEditorService } from './CodeEditorService.js';

/**
 * PromptBuilder - Vytváří a spravuje AI prompty
 *
 * Funkce:
 * - Generuje system prompty podle kontextu
 * - Připravuje context (kód, soubory, historie)
 * - Detekuje typ úkolu (nový projekt, úprava, analýza)
 * - Formátuje kód s čísly řádků
 */
export class PromptBuilder {
  constructor(aiPanel) {
    this.aiPanel = aiPanel;
  }

  /**
   * Zkrátí kód inteligentně pro kontext - deleguje na CodeEditorService
   */
  truncateCodeIntelligently(code, maxChars = 3000) {
    return this.aiPanel.codeEditorService.truncateCodeIntelligently(code, maxChars);
  }

  /**
   * Přidá čísla řádků k kódu - deleguje na CodeEditorService
   */
  addLineNumbers(code, metadata = null) {
    return this.aiPanel.codeEditorService.addLineNumbers(code, metadata);
  }

  /**
   * Vytvoří system prompt pro chat režim (obecná konverzace)
   */
  buildChatModePrompt(message, hasHistory) {
    // For pokec chat, we don't need complex history context
    const historyContext = '';

    return `Jsi přátelský AI asistent s hlubokými znalostmi programování, webového vývoje a technologií.

💬 REŽIM: OBECNÁ KONVERZACE

Můžeš komunikovat o čemkoliv:
- Programování, algoritmy, architektury
- Webové technologie (HTML, CSS, JavaScript, frameworky)
- Návrhy, best practices, design patterns
- Debugging, optimalizace, code review
- Obecné otázky, vysvětlování konceptů
- Diskuze o technologiích a trendech

📋 PRAVIDLA:
✅ Odpovídej v češtině, přátelsky a srozumitelně
✅ Když diskutuješ o kódu, použij \`\`\`javascript nebo \`\`\`html bloky
✅ Buď konkrétní a praktický
✅ Nabídni příklady když jsou relevantní
✅ Navazuj na předchozí konverzaci
❌ Nepokládej zbytečné otázky - odpověz přímo
❌ Nebuď příliš formální

${historyContext ? `\n📜 HISTORIE KONVERZACE:\n${historyContext}\n` : ''}

Odpověz na zprávu uživatele stručně a užitečně.`;
  }

  /**
   * Vytvoří files context z otevřených souborů
   */
  buildFilesContext(openFiles, activeFileId) {
    if (!openFiles || openFiles.length === 0) {
      return '';
    }

    let filesContext = '';

    // Pokud je více souborů, přidej jejich obsah
    if (openFiles.length > 1) {
      const MAX_TOTAL_SIZE = 30000; // Max 30k znaků pro všechny soubory
      let totalSize = 0;
      const filesWithContent = [];

      for (const f of openFiles) {
        const content = f.content || '';
        if (totalSize + content.length < MAX_TOTAL_SIZE) {
          filesWithContent.push({
            name: f.name,
            language: f.language || 'html',
            lines: content.split('\n').length,
            content,
            isActive: f.id === activeFileId,
          });
          totalSize += content.length;
        } else {
          filesWithContent.push({
            name: f.name,
            truncated: true,
            isActive: f.id === activeFileId,
          });
        }
      }

      filesContext += `\n\nOtevřené soubory (${openFiles.length}):\n\n`;
      filesWithContent.forEach(f => {
        if (f.truncated) {
          filesContext += `📄 **${f.name}**${f.isActive ? ' (aktivní)' : ''} - [obsah vynechán kvůli velikosti]\n\n`;
        } else {
          filesContext += `📄 **${f.name}**${f.isActive ? ' (aktivní)' : ''} (${f.lines} řádků, ${f.language}):\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
        }
      });
    } else {
      // Jen jeden soubor - základní info
      const file = openFiles[0];
      filesContext = `\n📄 Pracuješ se souborem: **${file.name}** (${file.language})\n`;
    }

    return filesContext;
  }

  /**
   * Formátuje kód pro context podle typu úpravy
   */
  formatCodeContext(currentCode, message, hasCode) {
    if (!currentCode) {
      return '(prázdný editor)';
    }

    const msg = message ? message.toLowerCase() : '';

    // Detect if AI will likely use EDIT:LINES mode
    // Expanded keywords for better detection of edit requests
    const willEdit = hasCode && (
      msg.match(/změň|change|uprav|edit|oprav|fix|přidej|add|odstraň|odstran|remove|smaž|smaz|delete|vymaž|vymaz|nahraď|nahrad|replace|vyhod|vyhoď|zruš|zrus|skryj|vyřaď|vyrad|zbav\s+se|pryč|pryc|hide|clear|erase|get\s+rid|throw\s+out|ať/) ||
      msg.includes('celý soubor') ||
      msg.includes('celý kód') ||
      msg.includes('cely soubor') ||
      msg.includes('cely kod') ||
      msg.includes('zobraz vše') ||
      msg.includes('zobraz vse')
    );

    // Detect READ-ONLY requests (description, analysis) - need full code!
    const isReadOnly = hasCode && msg.match(/popiš|popis|vysvětli|vysvětlení|analyzuj|analýza|co je|co dělá|jak funguje|jaký je|ukáž|zobraz|přečti/);

    // For EDIT mode, READ-ONLY mode, or small files, send full code with line numbers
    // 🔴 DŮLEŽITÉ: Pro editační požadavky VŽDY posíláme celý kód, aby AI mohl přesně identifikovat co změnit!
    if (willEdit || isReadOnly || currentCode.length < 8000) {
      console.log('[PromptBuilder] Sending full code for editing (willEdit:', willEdit, ')');
      return this.addLineNumbers(currentCode);
    }

    // Otherwise truncate for context
    const truncated = this.truncateCodeIntelligently(currentCode, 3000);
    return this.addLineNumbers(
      typeof truncated === 'string' ? truncated : truncated.code,
      typeof truncated === 'object' ? truncated : null
    );
  }

  /**
   * Vybere prompt podle kontextu
   */
  selectPromptByContext(userMessage, hasCode, hasHistory, currentCode) {
    const msg = userMessage.toLowerCase();

    // New project
    if (!hasCode || currentCode.trim().length < 100) {
      return 'Vytvoř KOMPLETNÍ funkční projekt (HTML + CSS + JavaScript) podle požadavku uživatele.';
    }

    // Modifications
    if (msg.includes('přidej') || msg.includes('rozšiř')) {
      return 'Rozšiř existující kód o novou funkcionalitu - pošli POUZE změny v SEARCH/REPLACE formátu.';
    }

    if (msg.includes('oprav') || msg.includes('fix')) {
      return 'Oprav chyby v kódu - pošli POUZE opravy v SEARCH/REPLACE formátu.';
    }

    if (msg.includes('změň') || msg.includes('uprav')) {
      return 'Uprav kód podle požadavku - pošli POUZE změny v SEARCH/REPLACE formátu.';
    }

    if (msg.includes('vysvětli') || msg.includes('co dělá')) {
      return 'Vysvětli co kód dělá - stručně a jasně v češtině.';
    }

    // Default
    return 'Pomoz uživateli s jeho požadavkem - buď vytvoř nový kód, nebo uprav existující pomocí SEARCH/REPLACE.';
  }

  /**
   * Vytvoří kompletní system prompt
   */
  buildSystemPrompt(message, currentCode, openFiles, activeFileId, conversationMode = 'code') {
    const hasCode = currentCode && currentCode.trim().length > 0;
    const hasHistory = this.aiPanel.chatHistory.length > 1;

    // Pokud je režim "chat" (Pokeč), použij obecný system prompt
    if (conversationMode === 'chat') {
      return this.buildChatModePrompt(message, hasHistory);
    }

    // Získat režim práce z AIPanel
    const workMode = this.aiPanel.workMode || 'continue';

    // Je nový projekt pokud:
    // 1. Je explicitně zapnutý režim "new-project" NEBO
    // 2. Editor je prázdný a není historie
    const isNewOrchestratorProject = workMode === 'new-project' || (currentCode.trim() === '' && this.aiPanel.chatHistory.length <= 1);

    // Build history context
    const historyContext = this.aiPanel.chatService.buildHistoryContext(10, 200);

    // Build files context
    const filesContext = this.buildFilesContext(openFiles, activeFileId);

    // Format current code
    const formattedCode = this.formatCodeContext(currentCode, message, hasCode);

    // Detekce požadavku na popis (musí být před použitím)
    const isDescriptionRequest = message.toLowerCase().match(/popi[šs]|popis|vysv[ěe]tli|co d[ěe]l[áa]|jak funguje/);

    // Build system prompt
    let systemPrompt;

    if (isNewOrchestratorProject) {
      // Extra instrukce pro explicitní režim "Nový projekt"
      const newProjectNote = workMode === 'new-project'
        ? `
⚠️ ⚠️ ⚠️ REŽIM: NOVÝ PROJEKT ⚠️ ⚠️ ⚠️

OKAMŽITĚ vytvoř KOMPLETNÍ fungující kód podle požadavku!
- NEPIŠ analýzy, neplánuj, neptej se na detaily
- ROVNOU vytvoř celý HTML soubor od <!DOCTYPE> do </html>
- Kód MUSÍ být kompletní a funkční
- Na konci rovnou \`\`\`html blok s celým kódem!

`
        : '';

      systemPrompt = `🎯 Jsi AI vývojář. Vytvoř KOMPLETNÍ fungující webovou aplikaci.

${newProjectNote}
📋 PRAVIDLA:
✅ Každá proměnná UNIKÁTNÍ název (result1, result2, input1, input2...)
✅ TESTUJ kód mentálně - žádné chyby, žádné duplicity
✅ Modern JavaScript (addEventListener, querySelector, arrow functions)
✅ Responzivní CSS (flexbox/grid, mobile-first)
❌ NIKDY jen HTML/CSS bez JavaScriptu
❌ NIKDY duplicitní let/const/var deklarace
❌ NIKDY nedokončený nebo nefunkční kód

📐 BEST PRACTICES:
- Sémantický HTML5 (section, article, nav...)
- CSS custom properties (--primary-color: #...)
- Input validace a error handling
- Přístupnost (labels, ARIA, keyboard navigation)
- Clean code - komentáře u složitějších částí

🛠️ MULTI-FILE NÁSTROJE:
- **create_file(fileName, content, language)** - Vytvoř nový soubor (styles.css, app.js...)
- **read_file(fileName)** - Přečti obsah souboru
- **list_files()** - Seznam všech souborů
- Pro komplexnější projekty VYTVOŘ VÍCE SOUBORŮ místo inline kódu!

💻🔄 PŘED ODESLÁNÍM:
1. Zkontroluj duplicitní proměnné
2. Ověř že všechny eventy jsou navázané
3. Ujisti se že kód funguje samostatně

${filesContext}

📝 **Aktuální kód:**
\`\`\`html
${formattedCode}
\`\`\`

💬 ${historyContext}

${isDescriptionRequest ? '📋 **DŮLEŽITÉ PRO POPIS:** Na konci odpovědi VŽDY přidej sekci "📊 SHRNUTÍ" s krátkým přehledem hlavních bodů, aby uživatel viděl, že se zobrazila celá odpověď.' : ''}`;
    } else {
      // SPECIÁLNÍ KRÁTKÝ PROMPT PRO POPIS - bez zbytečných pravidel
      if (isDescriptionRequest) {
        // Pro popis zkrátit velké soubory, aby se vešly do API limitů
        let codeForDescription = formattedCode;
        if (currentCode.length > 30000) {
          // Zkrátit na začátek + konec (max ~8000 znaků = ~2000 tokenů)
          const truncated = this.aiPanel.codeEditorService.truncateCodeIntelligently(currentCode, 8000);
          codeForDescription = truncated.code; // Extract string from object
        }

        systemPrompt = `🎯 Jsi AI asistent specializovaný na analýzu a popis webových aplikací.

📝 **Kód k analýze:**
\`\`\`html
${codeForDescription}
\`\`\`

💬 ${historyContext}

📋 **INSTRUKCE PRO POPIS:**
- Popiš co aplikace dělá a jaké má funkce
- Uveď hlavní sekce a jejich účel
- Zmíň použité technologie
- Vysvětli uživatelské rozhraní
- Na konci VŽDY přidej sekci "📊 SHRNUTÍ" s 3-5 hlavními body, aby uživatel viděl že se zobrazila celá odpověď`;
      } else {
        // Standardní prompt pro úpravy kódu
        systemPrompt = `🎯 Jsi AI vývojář specializovaný na úpravy kódu.

${filesContext}

📝 **Aktuální kód v editoru:**
\`\`\`html
${formattedCode}
\`\`\`

💬 ${historyContext}

🎯 TVŮJ ÚKOL:
${this.selectPromptByContext(message, hasCode, hasHistory, currentCode)}

📋 PRAVIDLA VÝSTUPU:
✅ Kód MUSÍ obsahovat JavaScript pro interaktivitu
✅ Všechny proměnné UNIKÁTNÍ názvy (no duplicates!)
✅ Event listenery připojené správně
✅ Moderní ES6+ syntax (const/let, arrow functions)
✅ Validace vstupů, error handling
✅ Responzivní design (mobile-first)
❌ NIKDY jen HTML/CSS bez funkčnosti
❌ NIKDY duplicitní deklarace proměnných
❌ NIKDY neúplný nebo nefunkční kód

🗂️ MULTI-FILE PROJEKTY:
- Pokud příslušný soubor NEEXISTUJE, doporuč vytvořit: "Vytvoř nový soubor **styles.css** s tímto obsahem:"
- Pro úpravy více souborů najednou uveď každý zvlášť se správným code blokem (\\\`\\\`\\\`html, \\\`\\\`\\\`css, \\\`\\\`\\\`javascript)
- Relativní cesty v HTML fungují automaticky díky injection systému

🛠️ K DISPOZICI NÁSTROJE PRO PRÁCI S VÍCE SOUBORY:
- **read_file(fileName)** - Přečte obsah konkrétního souboru
- **list_files(includeContent)** - Seznam všech otevřených souborů s metadaty
- **edit_file(fileName, content, switchBack)** - Upraví konkrétní soubor
- **create_file(fileName, content, language, switchTo)** - Vytvoří nový soubor
- **switch_file(fileName)** - Přepne na jiný soubor
- **read_all_files(maxFilesSize)** - Přečte všechny soubory najednou
- Pokud potřebuješ obsah souboru který není v kontextu, POUŽIJ tool read_file!
- Pro vytváření nových souborů POUŽIJ tool create_file místo žádání uživatele!

💡 ODPOVĚDI:
- Stručně a prakticky v češtině
- Kód zabal do \\\`\\\`\\\`html...\\\`\\\`\\\` (nebo \\\`\\\`\\\`css\\\`\\\`\\\`, \\\`\\\`\\\`javascript\\\`\\\`\\\`)
- Pro vysvětlení použij jasný jazyk
- Navazuj na předchozí konverzaci
- Pokud doporučuješ více souborů, jasně to označ`;
      }
    }

    // Add search/replace instructions if editing (ale ne pro popis!)
    if (hasCode && currentCode.trim().length > 100 && !isDescriptionRequest) {
      systemPrompt += `

═══════════════════════════════════════════════════════════
✅ PREFEROVANÝ FORMÁT: SEARCH/REPLACE (použij VŽDY když je to možné!)
═══════════════════════════════════════════════════════════

Pro úpravy existujícího kódu PREFERUJ tento formát:

\`\`\`SEARCH
[přesný kód který chceš nahradit - MUSÍ existovat v aktuálním kódu!]
\`\`\`
\`\`\`REPLACE
[nový kód kterým ho nahradíš]
\`\`\`

� KRITICKÉ! KÓD VIDÍŠ S ČÍSLY ŘÁDKŮ - IGNORUJ JE PŘI KOPÍROVÁNÍ! 🚨

Když vidíš kód jako:
\`\`\`
  235|     <div class="calculator-container">
  236|       <h1>Kalkulačka</h1>
\`\`\`

Do SEARCH bloku zkopíruj BEZ čísel řádků, ale VČETNĚ mezer před prvním znakem:
\`\`\`SEARCH
    <div class="calculator-container">
      <h1>Kalkulačka</h1>
\`\`\`

❌ ŠPATNĚ (chybí mezery na začátku):
\`\`\`SEARCH
<div class="calculator-container">
  <h1>Kalkulačka</h1>
\`\`\`

✅ SPRÁVNĚ (zachovány všechny mezery před prvním znakem):
\`\`\`SEARCH
    <div class="calculator-container">
      <h1>Kalkulačka</h1>
\`\`\`

🔴 KRITICKÉ PRAVIDLO PRO SEARCH BLOK:
- SEARCH blok MUSÍ obsahovat PŘESNOU kopii kódu z editoru
- ✅ VČETNĚ VŠECH MEZER NA ZAČÁTKU KAŽDÉHO ŘÁDKU!
- ✅ Spočítej mezery před prvním znakem a použij STEJNÝ počet!
- ❌ NIKDY "..." nebo zkratky
- ❌ NIKDY "zkráceno" nebo placeholdery
- ❌ NIKDY "🔽 ZKRÁCENO" text - to je jen UI značka!
- ❌ NIKDY "⚠️ ŘÁDKY NEJSOU VIDITELNÉ" - to je jen upozornění!
- ✅ Zkopíruj PŘESNĚ kód ze zdrojového souboru (včetně všech řádků!)
- ✅ Zachovej PŘESNÉ odsazení (mezery nebo tabulátory - jak je v originále!)
- ✅ Zachovaj PŘESNÉ konce řádků (CRLF nebo LF - jak je v originále!)
- ✅ Pokud kód obsahuje "🔽 ZKRÁCENO", NEJPRVE napiš: "Potřebuji vidět celý kód v této sekci"

⚠️ WHITESPACE JE DŮLEŽITÝ!
- Kód v editoru může používat MEZERY nebo TABULÁTORY pro odsazení
- MUSÍŠ použít STEJNÉ znaky jako v originále!
- Copy-paste kód PŘESNĚ jak je - bez reformátování!
- Pokud vidíš "    " (4 mezery) v editoru, použij "    " (4 mezery)
- Pokud vidíš "\t" (tabulátor) v editoru, použij "\t" (tabulátor)

🎯 POKUD CHCEŠ ODSTRANIT/ZMĚNIT VÍCE STEJNÝCH ELEMENTŮ:
- Použij VÍCERO SEARCH/REPLACE bloků (jeden pro každý element)
- NEBO použij jeden SEARCH blok obsahující všechny elementy najednou
- ❌ NIKDY nepoužij jen jeden SEARCH blok pro první výskyt, pokud je jich víc!

💡 PŘÍKLAD - Odstranění dvou smajlíků:

\`\`\`SEARCH
<div class="emoji-container">
  <span class="emoji" aria-label="Smutný smajlík">😔</span>
</div>

<div class="emoji-container left-emoji">
  <span class="emoji" aria-label="Vysmátý smajlík">😂</span>
</div>
\`\`\`
\`\`\`REPLACE
<!-- Smajlíky odstraněny -->
\`\`\`

⚠️ POKUD VIDÍŠ ZKRÁCENÝ KÓD (např. "🔽 ZKRÁCENO 336 ŘÁDKŮ"):
1. NEPOKOUŠEJ SE editovat zkrácenou část!
2. Místo toho napiš: "Potřebuji zobrazit celý kód. Požádej uživatele: 'zobraz celý kód' nebo 'zobraz řádky X-Y'"
3. POČKEJ na celý kód před editací

📝 PŘÍKLAD - SPRÁVNĚ:

\`\`\`SEARCH
const x = 1;
const y = 2;
console.log(x + y);
\`\`\`
\`\`\`REPLACE
const x = 1;
const y = 3;
console.log(x + y);
\`\`\`

❌ PŘÍKLAD - ŠPATNĚ (nikdy nedělej!):

\`\`\`SEARCH
🔽 ZKRÁCENO 336 ŘÁDKŮ (42-377) 🔽
\`\`\`
\`\`\`REPLACE
ZKRÁCENO 336 ŘÁDKŮ (42-377)
\`\`\`

═══════════════════════════════════════════════════════════
📝 ZÁLOŽNÍ FORMÁT: EDIT:LINES (pouze pokud SEARCH/REPLACE nelze použít)
═══════════════════════════════════════════════════════════

Pokud SEARCH/REPLACE nelze použít (např. kód se opakuje mnohokrát),
můžeš použít starší formát s čísly řádků:

\`\`\`EDIT:LINES:45-47
OLD:
[PŘESNÝ původní kód zkopírovaný z editoru - VIDÍŠ ho výše s čísly řádků!]
NEW:
[nový kód]
\`\`\`

🔴 ABSOLUTNĚ ZAKÁZÁNO V OLD BLOKU:
❌ "..." nebo "// ..." nebo "/* ... */"
❌ "zkráceno" nebo "...zbytek kódu..."
❌ jakékoliv zkratky nebo placeholder text
❌ "STEJNÉ JAKO NAHOŘE" nebo reference

✅ OLD BLOK MUSÍ OBSAHOVAT:
✅ PŘESNOU KOPII kódu z daných řádků (vidíš čísla řádků!)
✅ Všechny řádky včetně prázdných
✅ Přesné odsazení a whitespace

💡 TIP: Raději použij více menších SEARCH/REPLACE bloků než jeden velký EDIT:LINES!`;
    }

    return systemPrompt;
  }

  /**
   * Detekuje meta-prompt pro výběr promptu
   */
  getPromptSelectionMetaPrompt(userMessage, codeLength, lineCount) {
    return `Analyzuj tento požadavek a zvol nejlepší přístup:

Požadavek: "${userMessage}"
Aktuální kód: ${codeLength} znaků, ${lineCount} řádků

Možnosti:
1. NEW_PROJECT - Vytvoř nový kompletní projekt
2. MODIFY - Uprav existující kód (SEARCH/REPLACE nebo EDIT:LINES)
3. EXPLAIN - Vysvětli jak kód funguje
4. DEBUG - Najdi a oprav chyby

Odpověz POUZE číslem (1-4).`;
  }
}
