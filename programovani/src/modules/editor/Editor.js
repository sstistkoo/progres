/**
 * Editor Module - Hlavní logika code editoru
 */
import { state } from '@core/state.js';
import { eventBus } from '@core/events.js';
import { debounce } from '@utils/async.js';
import { countLines } from '@utils/string.js';

export class Editor {
  constructor(container) {
    this.container = container;
    this.textarea = null;
    this.lineNumbers = null;
    this.wrapper = null;
    this.history = {
      past: [],
      future: [],
      maxSize: 100,
    };

    // Store bound handlers for cleanup
    this.handlers = {
      input: null,
      scroll: null,
      keydown: null,
      selectionchange: null,
    };

    this.init();
    this.setupEventListeners();
  }

  init() {
    // Create editor structure
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'editor-wrapper';

    // Line numbers
    this.lineNumbers = document.createElement('div');
    this.lineNumbers.className = 'line-numbers';

    // Textarea
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'code-input';
    this.textarea.id = 'codeInput';
    this.textarea.spellcheck = false;
    this.textarea.autocomplete = 'off';
    this.textarea.autocorrect = 'off';
    this.textarea.autocapitalize = 'off';

    // Append elements
    this.wrapper.appendChild(this.lineNumbers);
    this.wrapper.appendChild(this.textarea);
    this.container.appendChild(this.wrapper);

    // Load initial code
    const initialCode = state.get('editor.code') || this.getDefaultCode();
    this.setCode(initialCode);
    this.updateLineNumbers();
  }

  setupEventListeners() {
    // Input changes
    this.handlers.input = debounce(() => {
      this.handleInput();
    }, 300);
    this.textarea.addEventListener('input', this.handlers.input);

    // Scroll sync
    this.handlers.scroll = () => {
      this.lineNumbers.scrollTop = this.textarea.scrollTop;
    };
    this.textarea.addEventListener('scroll', this.handlers.scroll);

    // Tab key handling
    this.handlers.keydown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.insertTab();
      }
    };
    this.textarea.addEventListener('keydown', this.handlers.keydown);

    // Cursor position tracking
    this.handlers.selectionchange = () => {
      this.updateCursorPosition();
    };
    this.textarea.addEventListener('selectionchange', this.handlers.selectionchange);

    // State changes
    state.subscribe('editor.code', code => {
      if (code !== this.getCode()) {
        this.setCode(code);
      }
    });

    // Actions
    eventBus.on('action:undo', () => this.undo());
    eventBus.on('action:redo', () => this.redo());
    eventBus.on('editor:insertText', ({ text }) => this.insertText(text));
    eventBus.on('editor:replaceAll', ({ code }) => this.setCode(code));
  }

  handleInput() {
    const code = this.getCode();

    // Save to history
    this.saveToHistory();

    // Update state
    state.set('editor.code', code);

    // Update UI
    this.updateLineNumbers();

    // Emit change event
    eventBus.emit('editor:change', { code });

    // Auto-save
    if (state.get('settings.autoSave')) {
      this.autoSave();
    }
  }

  getCode() {
    return this.textarea.value;
  }

  setCode(code) {
    this.textarea.value = code;
    this.updateLineNumbers();
    state.set('editor.code', code);
    // Emit change event to update preview
    eventBus.emit('editor:change', { code });
  }

  insertText(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const current = this.getCode();

    const newCode = current.substring(0, start) + text + current.substring(end);
    this.setCode(newCode);

    // Set cursor after inserted text
    const newPosition = start + text.length;
    this.textarea.setSelectionRange(newPosition, newPosition);
    this.textarea.focus();
  }

  insertTab() {
    const tabSize = state.get('settings.tabSize') || 2;
    const tab = ' '.repeat(tabSize);
    this.insertText(tab);
  }

  updateLineNumbers() {
    const code = this.getCode();
    const lineCount = countLines(code);
    const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    this.lineNumbers.textContent = numbers;
  }

  updateCursorPosition() {
    const position = this.textarea.selectionStart;
    const code = this.getCode();
    const beforeCursor = code.substring(0, position);
    const line = beforeCursor.split('\n').length;
    const col = beforeCursor.split('\n').pop().length;

    state.set('editor.cursor', { line, col });
  }

  saveToHistory() {
    const code = this.getCode();
    const last = this.history.past[this.history.past.length - 1];

    if (code === last) return;

    this.history.past.push(code);
    if (this.history.past.length > this.history.maxSize) {
      this.history.past.shift();
    }
    this.history.future = [];
  }

  undo() {
    if (this.history.past.length === 0) return;

    const current = this.getCode();
    const previous = this.history.past.pop();

    this.history.future.unshift(current);
    this.setCode(previous);

    eventBus.emit('editor:undo', { code: previous });
  }

  redo() {
    if (this.history.future.length === 0) return;

    const current = this.getCode();
    const next = this.history.future.shift();

    this.history.past.push(current);
    this.setCode(next);

    eventBus.emit('editor:redo', { code: next });
  }

  autoSave() {
    // Save current file
    const activeFile = state.get('files.active');
    if (activeFile) {
      const tabs = state.get('files.tabs');
      const tab = tabs.find(t => t.id === activeFile);
      if (tab) {
        tab.content = this.getCode();
        tab.modified = false;
        state.set('files.tabs', tabs);
      }
    }
  }

  getDefaultCode() {
    return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
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
</html>`;
  }

  focus() {
    this.textarea.focus();
  }

  destroy() {
    // Remove event listeners
    if (this.textarea) {
      if (this.handlers.input) {
        this.textarea.removeEventListener('input', this.handlers.input);
      }
      if (this.handlers.scroll) {
        this.textarea.removeEventListener('scroll', this.handlers.scroll);
      }
      if (this.handlers.keydown) {
        this.textarea.removeEventListener('keydown', this.handlers.keydown);
      }
      if (this.handlers.selectionchange) {
        this.textarea.removeEventListener('selectionchange', this.handlers.selectionchange);
      }
    }

    // Clean up DOM
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    // Clear references
    this.textarea = null;
    this.lineNumbers = null;
    this.wrapper = null;
    this.handlers = null;
  }
}

export default Editor;
