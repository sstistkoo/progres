/**
 * AppState - Centrální správa stavu aplikace
 * Implementuje observer pattern pro reaktivní updates
 */
export class AppState {
  constructor() {
    this.subscribers = new Map();
    this.state = this.getInitialState();
    this.loadFromStorage();
  }

  getInitialState() {
    return {
      editor: {
        code: `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dokument</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>Začni psát svůj kód zde...</p>
</body>
</html>`,
        language: 'html',
        cursor: { line: 0, col: 0 },
        selection: null,
      },
      files: {
        active: 1,
        tabs: [
          {
            id: 1,
            name: 'index.html',
            content: `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dokument</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <h1>Hello World!</h1>
  <p>Začni psát svůj kód zde...</p>
</body>
</html>`,
            modified: false,
            type: 'html'
          }
        ],
        tree: {},
        nextId: 2,
      },
      ui: {
        theme: 'dark',
        view: 'preview',
        splitRatio: 50,
        toolsPanelOpen: false,
        toolsPanelWidth: 300,
        sidebarOpen: false,
        consoleOpen: false,
      },
      ai: {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        keys: {},
        chatHistory: [],
      },
      settings: {
        fontSize: 14,
        tabSize: 2,
        autoSave: true,
        livePreview: true,
        wordWrap: true,
        lineNumbers: true,
      },
    };
  }

  /**
   * Získání hodnoty ze stavu pomocí tečkové notace
   * @param {string} path - Cesta ke klíči (např. 'editor.code')
   * @returns {*} Hodnota
   */
  get(path) {
    if (!path) return this.state;
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * Nastavení hodnoty do stavu
   * @param {string} path - Cesta ke klíči
   * @param {*} value - Nová hodnota
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const obj = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);

    const oldValue = obj[lastKey];
    obj[lastKey] = value;

    this.notify(path, value, oldValue);
    this.saveToStorage();
  }

  /**
   * Update objektu (shallow merge)
   * @param {string} path - Cesta k objektu
   * @param {Object} updates - Změny
   */
  update(path, updates) {
    const current = this.get(path);
    this.set(path, { ...current, ...updates });
  }

  /**
   * Přidání položky do pole
   * @param {string} path - Cesta k poli
   * @param {*} item - Nová položka
   */
  push(path, item) {
    const array = this.get(path) || [];
    this.set(path, [...array, item]);
  }

  /**
   * Odebrání položky z pole
   * @param {string} path - Cesta k poli
   * @param {Function|*} predicateOrValue - Predikát nebo hodnota
   */
  remove(path, predicateOrValue) {
    const array = this.get(path) || [];
    const predicate = typeof predicateOrValue === 'function'
      ? predicateOrValue
      : item => item === predicateOrValue;
    this.set(path, array.filter(item => !predicate(item)));
  }

  /**
   * Subscribe na změny
   * @param {string|Function} pathOrCallback - Cesta nebo callback
   * @param {Function} [callback] - Callback funkce
   * @returns {Function} Unsubscribe funkce
   */
  subscribe(pathOrCallback, callback) {
    // subscribe(callback) - globální
    if (typeof pathOrCallback === 'function') {
      callback = pathOrCallback;
      pathOrCallback = '*';
    }

    if (!this.subscribers.has(pathOrCallback)) {
      this.subscribers.set(pathOrCallback, new Set());
    }

    this.subscribers.get(pathOrCallback).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(pathOrCallback);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(pathOrCallback);
        }
      }
    };
  }

  /**
   * Notifikace subscriberů o změně
   * @private
   */
  notify(path, value, oldValue) {
    // Notify exact path subscribers
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(cb => {
        cb(value, oldValue, path);
      });
    }

    // Notify parent path subscribers (např. 'editor' když se změní 'editor.code')
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      if (this.subscribers.has(parentPath)) {
        this.subscribers.get(parentPath).forEach(cb => {
          cb(this.get(parentPath), undefined, parentPath);
        });
      }
    }

    // Notify global subscribers
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(cb => {
        cb(value, oldValue, path);
      });
    }
  }

  /**
   * Uložení stavu do localStorage
   */
  saveToStorage() {
    try {
      const toSave = {
        files: this.state.files,
        ui: this.state.ui,
        settings: this.state.settings,
        ai: {
          provider: this.state.ai.provider,
          model: this.state.ai.model,
          keys: this.state.ai.keys,
        },
      };
      localStorage.setItem('htmlStudio:state', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  /**
   * Načtení stavu z localStorage
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('htmlStudio:state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved state with initial state
        this.state = {
          ...this.state,
          ...parsed,
          editor: this.state.editor, // Keep editor state fresh
        };
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  /**
   * Reset stavu na výchozí
   */
  reset() {
    this.state = this.getInitialState();
    localStorage.removeItem('htmlStudio:state');
    this.notify('*', this.state);
  }
}

// Singleton instance
export const state = new AppState();
