/**
 * Preview Module - Live náhled HTML kódu
 */
import { state } from '@core/state.js';
import { eventBus } from '@core/events.js';
import { debounce } from '@utils/async.js';

export class Preview {
  constructor(container) {
    this.container = container;
    this.iframe = null;
    this.init();
    this.setupEventListeners();
  }

  init() {
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'preview-frame';
    this.iframe.id = 'previewFrame';
    this.iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';

    this.container.appendChild(this.iframe);

    // Load initial preview
    const code = state.get('editor.code');
    if (code) {
      this.update(code);
    }
  }

  setupEventListeners() {
    // Listen to editor changes
    if (state.get('settings.livePreview')) {
      eventBus.on('editor:change', debounce(({ code }) => {
        this.update(code);
      }, 500));
    }

    // Manual refresh
    eventBus.on('preview:refresh', () => {
      const code = state.get('editor.code');
      this.update(code);
    });

    // Listen to settings changes
    state.subscribe('settings.livePreview', enabled => {
      if (enabled) {
        const code = state.get('editor.code');
        this.update(code);
      }
    });
  }

  update(code) {
    try {
      // Inject console capture script
      const wrappedCode = this.injectConsoleCapture(code);

      // Write to iframe
      const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
      doc.open();
      doc.write(wrappedCode);
      doc.close();

      eventBus.emit('preview:updated', { code });
    } catch (error) {
      console.error('Preview update error:', error);
      this.showError(error);
    }
  }

  injectConsoleCapture(code) {
    const consoleScript = `
      <script>
        (function() {
          const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
          };

          function sendToParent(type, args) {
            try {
              window.parent.postMessage({
                type: 'console',
                level: type,
                message: Array.from(args).map(arg => {
                  try {
                    return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                  } catch {
                    return String(arg);
                  }
                }).join(' '),
                timestamp: Date.now()
              }, '*');
            } catch (e) {}
          }

          console.log = function(...args) {
            originalConsole.log.apply(console, args);
            sendToParent('log', args);
          };

          console.error = function(...args) {
            originalConsole.error.apply(console, args);
            sendToParent('error', args);
          };

          console.warn = function(...args) {
            originalConsole.warn.apply(console, args);
            sendToParent('warn', args);
          };

          console.info = function(...args) {
            originalConsole.info.apply(console, args);
            sendToParent('info', args);
          };

          // Capture errors
          window.addEventListener('error', function(e) {
            sendToParent('error', [e.message + ' at ' + e.filename + ':' + e.lineno]);
          });

          window.addEventListener('unhandledrejection', function(e) {
            sendToParent('error', ['Unhandled Promise rejection:', e.reason]);
          });
        })();
      </script>
    `;

    // Insert before </head> or at start of body
    if (code.includes('</head>')) {
      return code.replace('</head>', consoleScript + '</head>');
    } else if (code.includes('<body')) {
      return code.replace('<body', consoleScript + '<body');
    } else {
      return consoleScript + code;
    }
  }

  showError(error) {
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: monospace;
            padding: 20px;
            background: #1a1a2e;
            color: #ff6b6b;
          }
          h1 { font-size: 1.2rem; }
          pre {
            background: #0f0f1e;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <h1>⚠️ Chyba v náhledu</h1>
        <pre>${this.escapeHTML(error.toString())}</pre>
      </body>
      </html>
    `;

    const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
    doc.open();
    doc.write(errorHTML);
    doc.close();
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  clear() {
    const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><body></body></html>');
    doc.close();
  }

  destroy() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}

export default Preview;
