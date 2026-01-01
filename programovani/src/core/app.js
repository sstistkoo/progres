/**
 * Main Application Entry Point
 */
import { state } from '@core/state.js';
import { eventBus } from '@core/events.js';
import config from '@core/config.js';
import { registerDefaultShortcuts } from '@utils/shortcuts.js';
import { ready } from '@utils/dom.js';
import toast from '@ui/components/Toast.js';

// Import modules
import Editor from '@modules/editor/Editor.js';
import Preview from '@modules/preview/Preview.js';
import { AIPanel } from '@modules/ai/AIPanel.js';
import { ShortcutsPanel } from '@modules/shortcuts/ShortcutsPanel.js';
import { MenuPanel } from '@modules/menu/MenuPanel.js';
import { SearchPanel } from '@modules/search/SearchPanel.js';

class App {
  constructor() {
    this.editor = null;
    this.preview = null;
    this.aiPanel = null;
    this.shortcutsPanel = null;
    this.menuPanel = null;
    this.searchPanel = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    console.log(`🚀 ${config.app.name} v${config.app.version} starting...`);

    // Setup global error handling
    this.setupErrorHandling();

    // Register shortcuts
    registerDefaultShortcuts();

    // Setup console message listener
    this.setupConsoleListener();

    // Initialize modules
    await this.initializeModules();

    // Setup event listeners
    this.setupEventListeners();

    // Apply theme
    this.applyTheme(state.get('ui.theme'));

    // Apply initial view
    const initialView = state.get('ui.view');
    this.switchView(initialView);

    this.initialized = true;
    eventBus.emit('app:initialized');

    toast.success('HTML Studio načten!', 2000);
    console.log('✅ App initialized');
  }

  async initializeModules() {
    // Editor
    const editorContainer = document.getElementById('editorContainer');
    if (editorContainer) {
      this.editor = new Editor(editorContainer);
      console.log('✓ Editor initialized');
    }

    // Preview
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer) {
      this.preview = new Preview(previewContainer);
      console.log('✓ Preview initialized');
    }

    // AI Panel
    this.aiPanel = new AIPanel();
    console.log('✓ AI Panel initialized');

    // Shortcuts Panel
    this.shortcutsPanel = new ShortcutsPanel();
    console.log('✓ Shortcuts Panel initialized');

    // Menu Panel
    this.menuPanel = new MenuPanel();
    console.log('✓ Menu Panel initialized');

    // Search Panel
    this.searchPanel = new SearchPanel();
    console.log('✓ Search Panel initialized');
  }

  setupEventListeners() {
    // View switching
    eventBus.on('view:change', ({ view }) => {
      this.switchView(view);
    });

    // Theme toggle
    eventBus.on('theme:toggle', () => {
      const current = state.get('ui.theme');
      const newTheme = current === 'dark' ? 'light' : 'dark';
      state.set('ui.theme', newTheme);
      this.applyTheme(newTheme);
    });

    // Menu toggle
    eventBus.on('menu:toggle', () => {
      this.menuPanel.toggle();
    });

    // State changes
    state.subscribe('ui.theme', theme => {
      this.applyTheme(theme);
    });

    // Actions
    eventBus.on('action:save', () => this.saveFile());
    eventBus.on('action:format', () => this.formatCode());
    eventBus.on('action:preview', () => this.togglePreview());
    eventBus.on('action:newTab', () => this.newTab());
    eventBus.on('action:download', () => this.downloadFile());
    eventBus.on('action:validate', () => this.validateCode());
    eventBus.on('action:minify', () => this.minifyCode());
    eventBus.on('action:undo', () => this.editor?.undo());
    eventBus.on('action:redo', () => this.editor?.redo());
    eventBus.on('action:search', () => this.showSearch());
    eventBus.on('console:toggle', () => this.toggleConsole());
    eventBus.on('preview:refresh', () => this.refreshPreview());
  }

  setupConsoleListener() {
    window.addEventListener('message', e => {
      if (e.data && e.data.type === 'console') {
        const { level, message, timestamp } = e.data;
        eventBus.emit('console:message', { level, message, timestamp });

        // Log to dev console too
        console[level](`[Preview] ${message}`);
      }
    });
  }

  setupErrorHandling() {
    window.addEventListener('error', e => {
      console.error('Global error:', e.error);
      toast.error(`Chyba: ${e.message}`, 5000);
    });

    window.addEventListener('unhandledrejection', e => {
      console.error('Unhandled rejection:', e.reason);
      toast.error(`Promise error: ${e.reason}`, 5000);
    });
  }

  switchView(view) {
    const app = document.querySelector('.app');
    if (!app) return;

    app.className = app.className.replace(/view-\w+/, '');
    app.classList.add(`view-${view}`);
    state.set('ui.view', view);

    eventBus.emit('view:changed', { view });
  }

  applyTheme(theme) {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    eventBus.emit('theme:changed', { theme });
  }

  async saveFile() {
    const code = state.get('editor.code');
    const activeFile = state.get('files.active');

    if (activeFile) {
      // Update file content
      const tabs = state.get('files.tabs');
      const tab = tabs.find(t => t.id === activeFile);
      if (tab) {
        tab.content = code;
        tab.modified = false;
        state.set('files.tabs', tabs);
        toast.success('Soubor uložen', 2000);
      }
    } else {
      toast.info('Žádný aktivní soubor', 2000);
    }
  }

  async formatCode() {
    const code = state.get('editor.code');

    try {
      // TODO: Integrate beautifier
      // For now, just emit event
      eventBus.emit('code:format', { code });
      toast.success('Kód naformátován', 2000);
    } catch (error) {
      toast.error('Chyba při formátování', 3000);
    }
  }

  async validateCode() {
    toast.info('Validace kódu...', 2000);
    // TODO: Implement HTML validation
  }

  async minifyCode() {
    toast.info('Minifikace kódu...', 2000);
    // TODO: Implement code minification
  }

  newTab() {
    const code = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nový dokument</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>Nový dokument</h1>
  <p>Začněte psát zde...</p>
</body>
</html>`;

    // Set new content
    state.set('editor.code', code);
    if (this.editor) {
      this.editor.setCode(code);
    }

    toast.success('Nový soubor vytvořen', 2000);
  }

  downloadFile() {
    const code = state.get('editor.code');
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Soubor stažen', 2000);
  }

  showSearch() {
    eventBus.emit('search:show');
  }

  toggleConsole() {
    const consolePanel = document.querySelector('.console-panel');
    if (consolePanel) {
      consolePanel.classList.toggle('active');
    }
  }

  refreshPreview() {
    if (this.preview) {
      this.preview.refresh();
      toast.success('Náhled obnoven', 2000);
    }
  }

  togglePreview() {
    const currentView = state.get('ui.view');
    const newView = currentView === 'split' ? 'editor' : 'split';
    this.switchView(newView);
  }

  destroy() {
    if (this.editor) this.editor.destroy();
    if (this.preview) this.preview.destroy();
    eventBus.clear();
  }
}

// Create and initialize app
const app = new App();

// Start when DOM is ready
ready(() => {
  app.init().catch(error => {
    console.error('Failed to initialize app:', error);
    document.body.innerHTML = `
      <div style="padding: 2rem; color: #ff6b6b; font-family: monospace;">
        <h1>⚠️ Chyba při načítání aplikace</h1>
        <pre>${error.message}</pre>
      </div>
    `;
  });
});

// Export for debugging
window.app = app;
window.state = state;
window.eventBus = eventBus;

export default app;
