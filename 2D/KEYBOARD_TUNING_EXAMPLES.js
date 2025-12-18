/**
 * KEYBOARD TUNING EXAMPLES
 * Příklady, jak upravit keyboard shortcuts v keyboard.js
 */

// ============================================================================
// PŘÍKLAD 1: Změnit Ctrl+N na Ctrl+Alt+N (Nový projekt)
// ============================================================================

/*
Původně (keyboard.js, řádka ~32):
  file: {
    new: { key: "n", ctrl: true, meta: true },
  }

Upravit na:
  file: {
    new: { key: "n", ctrl: true, alt: true, meta: true },  // Nyní Ctrl+Alt+N nebo Cmd+Alt+N
  }

Efekt: Nový projekt se bude otvírat s Ctrl+Alt+N místo Ctrl+N
*/

// ============================================================================
// PŘÍKLAD 2: Odebrat shortcut (Vypnout Ctrl+E Export)
// ============================================================================

/*
Původně (keyboard.js, řádka ~34):
  file: {
    export: { key: "e", ctrl: true, meta: true },
  }

Zakomentovat:
  file: {
    // export: { key: "e", ctrl: true, meta: true },  // ← Zakomentováno
  }

Efekt: Ctrl+E nebude fungovat (musíte exportovat přes tlačítko)
*/

// ============================================================================
// PŘÍKLAD 3: Přidat nový shortcut - Shift+O pro "Measure" (měřítko)
// ============================================================================

/*
1. Přidej do keyboardConfig (keyboard.js, řádka ~54):

  view: {
    help: { key: "/", ctrl: true, meta: true },
    home: { key: "h", ctrl: false },
    centerOrigin: { key: "o", ctrl: false },
    measure: { key: "o", shift: true },  // ← NOVÉ: Shift+O
  }

2. Přidej handler v handleGlobalKeyDown (keyboard.js, řádka ~325):

  // ===== VIEW OPERATIONS =====
  if (window.matchesShortcut(e, config.view.measure)) {
    e.preventDefault();
    if (window.showMeasureTool) window.showMeasureTool();
    return;
  }

3. Ujisti se, že v tvém modulů máš funkci:
  window.showMeasureTool = function() {
    console.log("Measure tool opened!");
  };

Efekt: Shift+O otevře nový "Measure" nástroj
*/

// ============================================================================
// PŘÍKLAD 4: Změnit číslo pro režim - 7 na Q (Oříznutí)
// ============================================================================

/*
Původně (keyboard.js, řádka ~26):
  quickModes: {
    "1": "line",
    "2": "circle",
    "3": "arc",
    "4": "tangent",
    "5": "perpendicular",
    "6": "parallel",
    "7": "trim",      // ← Číslo 7
    "8": "offset",
    "9": "mirror",
    "0": "erase",
  }

Upravit na:
  quickModes: {
    "1": "line",
    "2": "circle",
    "3": "arc",
    "4": "tangent",
    "5": "perpendicular",
    "6": "parallel",
    "q": "trim",      // ← Změněno na Q
    "8": "offset",
    "9": "mirror",
    "0": "erase",
  }

Efekt: Q místo 7 pro Oříznutí
*/

// ============================================================================
// PŘÍKLAD 5: Duplikovat Undo - Přidat Ctrl+U jako alternativa
// ============================================================================

/*
Původně (keyboard.js, řádka ~48):
  edit: {
    undo: { key: "z", ctrl: true, meta: true },
    redo: { key: "y", ctrl: true, meta: true },
    redoAlt: { key: "Z", ctrl: false, shift: true },
    delete: { key: "Delete", ctrl: false },
    deleteAlt: { key: "Backspace", ctrl: false },
  }

Upravit na:
  edit: {
    undo: { key: "z", ctrl: true, meta: true },
    undoAlt: { key: "u", ctrl: true, meta: true },  // ← NOVÉ: Ctrl+U
    redo: { key: "y", ctrl: true, meta: true },
    redoAlt: { key: "Z", ctrl: false, shift: true },
    delete: { key: "Delete", ctrl: false },
    deleteAlt: { key: "Backspace", ctrl: false },
  }

2. Přidej handler v handleGlobalKeyDown (keyboard.js, ~295):

  // ===== EDIT OPERATIONS =====
  if (window.matchesShortcut(e, config.edit.undo) || window.matchesShortcut(e, config.edit.undoAlt)) {
    e.preventDefault();
    if (window.undo) window.undo();
    return;
  }

Efekt: Ctrl+Z i Ctrl+U fungují pro Undo
*/

// ============================================================================
// PŘÍKLAD 6: Vyměnit WASD pro pohyb - Přidat Pan shortcuty
// ============================================================================

/*
Přidej nový objekt (keyboard.js, řádka ~54):

  view: {
    help: { key: "/", ctrl: true, meta: true },
    home: { key: "h", ctrl: false },
    centerOrigin: { key: "o", ctrl: false },
    panUp: { key: "w", shift: true },      // ← NOVÉ: Shift+W
    panDown: { key: "s", shift: true },    // ← NOVÉ: Shift+S
    panLeft: { key: "a", shift: true },    // ← NOVÉ: Shift+A
    panRight: { key: "d", shift: true },   // ← NOVÉ: Shift+D
  }

2. Přidej handlers (keyboard.js, ~325):

  if (window.matchesShortcut(e, config.view.panUp)) {
    e.preventDefault();
    window.panY += 50;
    if (window.draw) window.draw();
    return;
  }
  if (window.matchesShortcut(e, config.view.panDown)) {
    e.preventDefault();
    window.panY -= 50;
    if (window.draw) window.draw();
    return;
  }
  // ... atd.

Efekt: Shift+W/A/S/D posunou výkres
*/

// ============================================================================
// PŘÍKLAD 7: KONFLIKT - Duplikátní handler (CO DĚLAT)
// ============================================================================

/*
⚠️ PROBLÉM: Chci aby J otvíral AI (JSON to CMD)

Původně (keyboard.js):
  ai: {
    send: { key: "Enter", shift: false },
  }

Pokusit se přidat:
  // Špatně! J je již pro mode "arc" v init.js (nebo jinde)
  ai: {
    send: { key: "Enter", shift: false },
    togglePanel: { key: "j", ctrl: false },  // ← KONFLIKT!
  }

✅ ŘEŠENÍ: Kontrola existujících shortcutů

1. Grep pro existující "J":
   grep -r "\"j\"" keyboard.js

2. Pokud J není používán, jdi do config a přidej:
   ai: {
     togglePanel: { key: "j", ctrl: false },  // ✅ OK
   }

3. Pokud JE používán, vyber jinou klávesu:
   ai: {
     togglePanel: { key: "y", ctrl: false },  // ✅ Y místo J
   }

4. Přidej handler (keyboard.js, handleGlobalKeyDown):
   if (window.matchesShortcut(e, config.ai.togglePanel)) {
     e.preventDefault();
     if (window.toggleAiPanel) window.toggleAiPanel();
     return;
   }

Efekt: Y otevře AI panel
*/

// ============================================================================
// PŘÍKLAD 8: Mac vs Windows - Jak se to řeší
// ============================================================================

/*
V keyboardConfig:

  file: {
    new: { key: "n", ctrl: true, meta: true },  // Ctrl na Windows, Cmd na Mac
  }

V handleGlobalKeyDown:

  const keyMatches = event.key === shortcut.key;
  const ctrlMatches = (shortcut.ctrl === undefined ||
                      shortcut.ctrl === (event.ctrlKey || event.metaKey));
                      ↑ Tohle kombinuje Ctrl i Meta!

Efekt:
  - Windows: Ctrl+N funguje
  - Mac: Cmd+N funguje
  - Oba se nakonfigurují jednou!
*/

// ============================================================================
// PŘÍKLAD 9: Deaktivovat jsem po chvíli - ESC ve všech modech
// ============================================================================

/*
Původně (keyboard.js):
  ESC zavírá pouze controller modal

Nyní upravit na (keyboard.js, handleGlobalKeyDown, řádka ~280):

  // ===== ESC = Clear mode ВЕЗДЕ =====
  if (e.key === "Escape") {
    // 1. Zavřít controller modal (pokud je otevřen)
    const controllerModal = document.getElementById("controllerModal");
    if (controllerModal && controllerModal.style.display === "flex") {
      if (window.closeControllerModal) window.closeControllerModal();
      e.preventDefault();
      return;
    }

    // 2. Zavřít AI panel (pokud existuje)
    const aiPanel = document.getElementById("aiPanel");
    if (aiPanel && aiPanel.style.display === "flex") {
      if (window.closeAiPanel) window.closeAiPanel();
      e.preventDefault();
      return;
    }

    // 3. Clear drawing mode
    if (window.clearMode) window.clearMode();
    e.preventDefault();
    return;
  }

Efekt: ESC zavřívá všechno postupně
*/

// ============================================================================
// PŘÍKLAD 10: Kontrola - Jak zjistit co je nastaveno
// ============================================================================

/*
V Developer Console (F12 → Console):

1. Zjistit všechny shortcuts:
   console.log(window.keyboardConfig)

2. Zkontrolovat konkrétní shortcut:
   console.log(window.keyboardConfig.file.new)
   // Výstup: { key: "n", ctrl: true, meta: true }

3. Testovat matchesShortcut:
   const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true });
   console.log(window.matchesShortcut(event, window.keyboardConfig.file.new))
   // Výstup: true ✅

4. Získat label:
   console.log(window.getShortcutLabel(window.keyboardConfig.file.new))
   // Výstup: "Ctrl+n"

5. Alle shortcuts:
   console.log(window.getAllShortcuts())
   // Vypíše všechny kategorie
*/

// ============================================================================
// SHRNUTÍ - KRÁTKÝ CHECKLIST
// ============================================================================

/*
1. ✅ Najdi shortcut v keyboardConfig
2. ✅ Změň "key", "ctrl", "alt", "shift", "meta"
3. ✅ Pokud přidáváš NOVÝ shortcut:
   a) Přidej do config
   b) Přidej handler v handleGlobalKeyDown()
   c) Ujisti se, že window.funkce existuje
4. ✅ Testuj v browser console
5. ✅ Zkontroluj konflikty (grep)
6. ✅ Commit + Push

Otázky?
- Zjistit co je nastaveno: console.log(window.keyboardConfig)
- Testovat shortcut: new KeyboardEvent('keydown', { key: 'x', ctrlKey: true })
- Reportuj bugs! 🐛
*/
