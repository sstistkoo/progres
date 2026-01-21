/**
 * Menu Modals Service
 * Handles all modal dialogs from menu
 */

import { eventBus } from '../../../core/events.js';
import { state } from '../../../core/state.js';
import { Modal } from '../../../ui/components/Modal.js';
import { ComponentLibrary } from './ComponentLibrary.js';
import { TemplateManager } from './TemplateManager.js';
import { ImageLibrary } from './ImageLibrary.js';

export class MenuModals {
  constructor() {
    // No dependencies needed
  }

  // ===== Components Modal =====
  showComponents() {
    const components = ComponentLibrary.getComponents();

    const content = document.createElement('div');
    content.style.padding = '20px';

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;';

    Object.entries(components).forEach(([key, component]) => {
      const card = this.createCard({
        className: 'component-card',
        dataKey: key,
        title: component.name,
        subtitle: component.category
      });
      grid.appendChild(card);
    });

    content.appendChild(grid);

    const modal = new Modal({
      title: 'ðŸ§© Knihovna komponent',
      content: content,
      width: '900px'
    });

    modal.open();
    this.attachCardListeners(modal.element, '.component-card', (key) => {
      ComponentLibrary.insertComponent(components[key].code);
      modal.close();
    });
  }

  // ===== Templates Modal =====
  showTemplates() {
    const { builtInTemplates, customTemplates } = TemplateManager.getTemplates();

    const content = document.createElement('div');
    content.style.padding = '20px';

    // Built-in templates section
    content.appendChild(this.createTemplateSection(
      'ðŸ“‹ VestavÄ›nÃ© Å¡ablony',
      builtInTemplates,
      'builtin'
    ));

    // Custom templates section
    if (Object.keys(customTemplates).length > 0) {
      content.appendChild(this.createTemplateSection(
        'ðŸŽ¨ VlastnÃ­ Å¡ablony',
        customTemplates,
        'custom'
      ));
    }

    const modal = new Modal({
      title: 'ðŸ“‹ Knihovna Å¡ablon',
      content: content,
      width: '900px'
    });

    modal.open();

    // Attach listeners for both template types
    const allTemplates = { ...builtInTemplates, ...customTemplates };
    this.attachCardListeners(modal.element, '.template-card', (key) => {
      const template = allTemplates[key];
      if (template) {
        TemplateManager.applyTemplate(template.code);
        modal.close();
      }
    });
  }

  createTemplateSection(title, templates, type) {
    const section = document.createElement('div');
    section.style.marginBottom = '24px';

    const heading = document.createElement('h4');
    heading.textContent = title;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; margin-top: 12px;';

    Object.entries(templates).forEach(([key, template]) => {
      const card = this.createCard({
        className: 'template-card',
        dataKey: key,
        dataType: type,
        title: template.name,
        subtitle: template.description || ''
      });
      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  // ===== Images Modal =====
  showImages() {
    const categories = ImageLibrary.getImageCategories();

    const content = document.createElement('div');
    content.style.padding = '20px';

    Object.entries(categories).forEach(([categoryKey, category]) => {
      const section = document.createElement('div');
      section.style.marginBottom = '24px';

      const heading = document.createElement('h4');
      heading.textContent = category.name;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;';

      category.images.forEach((image, imageIndex) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.categoryKey = categoryKey;
        card.dataset.imageIndex = imageIndex;
        card.style.cssText = 'border: 1px solid var(--border); border-radius: 8px; padding: 12px; cursor: pointer; text-align: center; background: var(--bg-secondary); transition: all 0.2s;';

        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.name;
        img.style.cssText = 'width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;';

        const label = document.createElement('div');
        label.textContent = image.name;
        label.style.fontSize = '13px';

        card.appendChild(img);
        card.appendChild(label);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      content.appendChild(section);
    });

    const modal = new Modal({
      title: 'ðŸ–¼ï¸ Knihovna obrÃ¡zkÅ¯',
      content: content,
      width: '900px'
    });

    modal.open();

    // Attach image card listeners
    const modalElement = modal.element;
    if (modalElement) {
      modalElement.querySelectorAll('.image-card').forEach(card => {
        const categoryKey = card.dataset.categoryKey;
        const imageIndex = parseInt(card.dataset.imageIndex);
        const image = categories[categoryKey].images[imageIndex];

        this.addHoverEffect(card);

        card.addEventListener('click', () => {
          ImageLibrary.insertImage(image.url, image.width, image.height, image.name);
          modal.close();
        });
      });
    }
  }

  // ===== AI Component Generator =====
  showAIComponentGenerator() {
    const content = `
      <div style="padding: 20px;">
        <p style="margin-bottom: 16px;">PopiÅ¡te komponentu, kterou chcete vytvoÅ™it:</p>
        <textarea
          id="aiComponentPrompt"
          placeholder="NapÅ™: VytvoÅ™it modernÃ­ kontaktnÃ­ formulÃ¡Å™ s poli pro jmÃ©no, email a zprÃ¡vu"
          style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--border); border-radius: 6px; font-family: inherit; resize: vertical; background: var(--bg-secondary); color: var(--text-primary);"
        ></textarea>
        <button
          id="aiComponentGenerate"
          style="width: 100%; padding: 12px; margin-top: 12px; background: var(--accent); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
        >
          ðŸš€ Vygenerovat
        </button>
        <div id="aiComponentResult" style="display: none; margin-top: 20px;">
          <h4>VygenerovanÃ½ kÃ³d:</h4>
          <pre id="aiComponentCode" style="background: var(--bg-secondary); padding: 12px; border-radius: 6px; overflow-x: auto; max-height: 300px;"></pre>
          <button
            id="aiComponentInsert"
            style="width: 100%; padding: 10px; margin-top: 8px; background: #22c55e; color: white; border: none; border-radius: 6px; cursor: pointer;"
          >
            âœ… VloÅ¾it do editoru
          </button>
        </div>
      </div>
    `;

    const modal = new Modal({
      title: 'ðŸ¤– AI GenerÃ¡tor komponent',
      content,
      width: '600px'
    });

    modal.open();

    const promptTextarea = document.getElementById('aiComponentPrompt');
    const generateBtn = document.getElementById('aiComponentGenerate');
    const resultDiv = document.getElementById('aiComponentResult');
    const codeElement = document.getElementById('aiComponentCode');
    const insertBtn = document.getElementById('aiComponentInsert');
    let generatedCode = '';

    generateBtn?.addEventListener('click', async () => {
      const description = promptTextarea?.value.trim();
      if (!description) return;

      generateBtn.textContent = 'â³ Generuji...';
      generateBtn.disabled = true;

      try {
        const code = await ComponentLibrary.generateAIComponent(description);

        if (code) {
          generatedCode = code;
          codeElement.textContent = code;
          resultDiv.style.display = 'block';
        }
      } catch (error) {
        console.error('AI generation error:', error);
        eventBus.emit('toast:show', {
          message: 'âŒ Chyba pÅ™i generovÃ¡nÃ­',
          type: 'error'
        });
      }

      generateBtn.textContent = 'ðŸš€ Vygenerovat';
      generateBtn.disabled = false;
    });

    insertBtn?.addEventListener('click', () => {
      if (generatedCode) {
        eventBus.emit('editor:insert', generatedCode);
        modal.close();
      }
    });
  }

  // ===== Load from URL Modal =====
  showLoadFromURL() {
    const modal = new Modal({
      title: 'ðŸŒ NaÄÃ­st z URL',
      content: this.getLoadFromURLContent(),
      className: 'load-url-modal',
      closeOnEscape: true,
      closeOnOverlay: true
    });

    modal.create();
    modal.open();

    this.setupLoadFromURLHandlers(modal);
  }

  getLoadFromURLContent() {
    return `
      <div style="padding: 20px;">
        <p style="margin-bottom: 15px; color: var(--text-secondary);">
          NaÄti obsah HTML, CSS, JS nebo textovÃ©ho souboru z URL adresy.
        </p>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">URL adresa:</label>
          <input
            type="url"
            id="urlInput"
            placeholder="https://example.com/file.html"
            style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px;"
          />
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Akce:</label>
          <select
            id="urlAction"
            style="width: 100%; padding: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px; cursor: pointer;"
          >
            <option value="replace">Nahradit celÃ½ editor</option>
            <option value="append">PÅ™idat na konec</option>
            <option value="new-file">VytvoÅ™it novÃ½ soubor</option>
          </select>
        </div>

        <div style="padding: 12px; background: rgba(59,130,246,0.1); border-left: 3px solid #3b82f6; border-radius: 4px; margin-bottom: 15px;">
          <strong style="color: #60a5fa;">ðŸ’¡ Tip:</strong>
          <ul style="margin: 8px 0 0 20px; color: var(--text-secondary); font-size: 0.9em;">
            <li>PodporovanÃ©: HTML, CSS, JS, TXT, MD</li>
            <li>Pro CORS problÃ©my pouÅ¾ijeme proxy</li>
            <li>GitHub: PouÅ¾ij "raw" URL</li>
          </ul>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="loadUrlBtn" style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            ðŸ“¥ NaÄÃ­st
          </button>
          <button id="cancelUrlBtn" style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            âŒ ZruÅ¡it
          </button>
        </div>

        <div id="urlStatus" style="margin-top: 15px; display: none;"></div>
      </div>
    `;
  }

  setupLoadFromURLHandlers(modal) {
    const urlInput = modal.element.querySelector('#urlInput');
    const urlAction = modal.element.querySelector('#urlAction');
    const loadBtn = modal.element.querySelector('#loadUrlBtn');
    const cancelBtn = modal.element.querySelector('#cancelUrlBtn');
    const statusDiv = modal.element.querySelector('#urlStatus');

    setTimeout(() => urlInput?.focus(), 100);

    cancelBtn?.addEventListener('click', () => modal.close());

    loadBtn?.addEventListener('click', async () => {
      const url = urlInput?.value?.trim();
      const action = urlAction?.value || 'replace';

      if (!url) {
        this.showUrlStatus(statusDiv, 'error', 'âŒ Zadejte URL adresu');
        return;
      }

      try {
        new URL(url);
      } catch (e) {
        this.showUrlStatus(statusDiv, 'error', 'âŒ NeplatnÃ¡ URL adresa');
        return;
      }

      loadBtn.disabled = true;
      loadBtn.textContent = 'â³ NaÄÃ­tÃ¡m...';
      this.showUrlStatus(statusDiv, 'loading', 'â³ Stahuji obsah...');

      try {
        const content = await this.fetchFromURL(url);

        if (!content) {
          throw new Error('PrÃ¡zdnÃ½ obsah');
        }

        this.applyURLContent(content, action, url);
        this.showUrlStatus(statusDiv, 'success', `âœ… NaÄteno ${content.length} znakÅ¯`);

        setTimeout(() => {
          modal.close();
          eventBus.emit('toast:show', {
            message: 'âœ… Obsah ÃºspÄ›Å¡nÄ› naÄten',
            type: 'success',
            duration: 3000
          });
        }, 1000);

      } catch (error) {
        console.error('Load from URL error:', error);
        this.showUrlStatus(statusDiv, 'error', `âŒ Chyba: ${error.message}`);
        loadBtn.disabled = false;
        loadBtn.textContent = 'ðŸ“¥ NaÄÃ­st';
      }
    });

    urlInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') loadBtn?.click();
    });
  }

  async fetchFromURL(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,text/plain,text/css,application/javascript,text/javascript'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (directError) {
      console.warn('Direct fetch failed, trying CORS proxy:', directError.message);

      const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
      ];

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl);
          if (response.ok) {
            console.log('âœ… Loaded via proxy:', proxyUrl);
            return await response.text();
          }
        } catch (proxyError) {
          console.warn('Proxy failed:', proxyUrl, proxyError.message);
          continue;
        }
      }

      throw new Error('NepodaÅ™ilo se naÄÃ­st obsah (CORS problÃ©m).');
    }
  }

  applyURLContent(content, action, url) {
    const currentCode = state.get('editor.code') || '';
    const filename = this.extractFilenameFromURL(url);

    switch (action) {
    case 'replace':
      state.set('editor.code', content);
      eventBus.emit('editor:update', content);
      break;

    case 'append': {
      const newCode = currentCode + '\n\n<!-- Loaded from: ' + url + ' -->\n' + content;
      state.set('editor.code', newCode);
      eventBus.emit('editor:update', newCode);
      break;
    }

    case 'new-file': {
      const files = state.get('files.list') || [];
      files.push({
        name: filename,
        content: content,
        lastModified: new Date().toISOString()
      });
      state.set('files.list', files);
      state.set('files.active', filename);
      state.set('editor.code', content);
      eventBus.emit('editor:update', content);
      eventBus.emit('files:update');
      break;
    }
    }
  }

  extractFilenameFromURL(url) {
    try {
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || 'untitled.html';
      return filename.includes('.') ? filename : filename + '.html';
    } catch (e) {
      return 'loaded-from-url.html';
    }
  }

  showUrlStatus(statusDiv, type, message) {
    if (!statusDiv) return;

    const colors = { loading: '#3b82f6', success: '#10b981', error: '#ef4444' };

    statusDiv.style.display = 'block';
    statusDiv.style.padding = '12px';
    statusDiv.style.background = `${colors[type]}20`;
    statusDiv.style.border = `1px solid ${colors[type]}`;
    statusDiv.style.borderRadius = '6px';
    statusDiv.style.color = colors[type];
    statusDiv.textContent = message;
  }

  // ===== Error Log Modal =====
  showErrorLog() {
    const errors = state.get('debug.errors') || [];

    if (errors.length === 0) {
      eventBus.emit('toast:show', {
        message: 'âœ… Å½Ã¡dnÃ© chyby nezaznamenÃ¡ny!',
        type: 'success',
        duration: 2000
      });
      return;
    }

    const errorHtml = errors.map((error, index) => {
      const time = new Date(error.timestamp).toLocaleTimeString('cs-CZ');
      const type = error.type === 'promise' ? 'âš ï¸ Promise' : 'âŒ Error';

      return `
        <div style="margin-bottom: 15px; padding: 12px; background: ${error.type === 'promise' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)'}; border-left: 3px solid ${error.type === 'promise' ? '#fbbf24' : '#ef4444'}; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong>${type} #${errors.length - index}</strong>
            <span style="color: var(--text-secondary); font-size: 0.9em;">${time}</span>
          </div>
          <div style="font-family: monospace; font-size: 0.9em; color: var(--text-primary); margin-bottom: 8px;">
            ${this.escapeHtml(error.message)}
          </div>
          ${error.filename ? `<div style="font-size: 0.85em; color: var(--text-secondary);">ðŸ“„ ${error.filename}:${error.lineno}:${error.colno}</div>` : ''}
          ${error.stack ? `
            <details style="margin-top: 8px;">
              <summary style="cursor: pointer; color: #3b82f6; font-size: 0.9em;">ðŸ” Stack trace</summary>
              <pre style="margin-top: 8px; padding: 8px; background: var(--bg-primary); border-radius: 4px; overflow-x: auto; font-size: 0.8em; color: var(--text-secondary);">${this.escapeHtml(error.stack.substring(0, 500))}</pre>
            </details>
          ` : ''}
        </div>
      `;
    }).reverse().join('');

    const modal = new Modal({
      title: `ðŸ› Error Log (${errors.length} chyb)`,
      content: `
        <div style="max-height: 500px; overflow-y: auto;">
          <div style="margin-bottom: 15px; padding: 12px; background: rgba(59,130,246,0.1); border-radius: 6px;">
            <strong>â„¹ï¸ O Error Logu:</strong>
            <ul style="margin: 8px 0 0 20px; color: var(--text-secondary);">
              <li>Zobrazuje poslednÃ­ch 50 chyb</li>
              <li>DuplicitnÃ­ chyby jsou potlaÄeny (max 1Ã— za 5s)</li>
              <li>Pro detailnÃ­ debugging pouÅ¾ijte <code>?debug</code> v URL</li>
            </ul>
          </div>
          ${errorHtml}
        </div>
        <div style="margin-top: 15px; display: flex; gap: 10px;">
          <button id="copyErrorLogBtn" style="flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            ðŸ“‹ KopÃ­rovat log
          </button>
          <button id="clearErrorLogBtn" style="flex: 1; padding: 10px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
            ðŸ—‘ï¸ Vymazat log
          </button>
        </div>
      `,
      className: 'error-log-modal',
      size: 'large'
    });

    modal.create();
    modal.open();

    // Attach button handlers
    const copyBtn = modal.element.querySelector('#copyErrorLogBtn');
    const clearBtn = modal.element.querySelector('#clearErrorLogBtn');

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(errors, null, 2));
      copyBtn.textContent = 'âœ“ ZkopÃ­rovÃ¡no!';
      setTimeout(() => { copyBtn.textContent = 'ðŸ“‹ KopÃ­rovat log'; }, 2000);
    });

    clearBtn?.addEventListener('click', () => {
      state.set('debug.errors', []);
      modal.close();
      eventBus.emit('toast:show', {
        message: 'ðŸ—‘ï¸ Error log vymazÃ¡n',
        type: 'success'
      });
    });
  }

  // ===== Audit Report Modal =====
  async showAuditReport() {
    const audit = this.generateLiveAudit();

    const modal = new Modal({
      title: ' Audit projektu - HTML Studio',
      content: `<div style="max-height: 70vh; overflow-y: auto; padding: 20px; line-height: 1.6;">${audit}</div>`,
      width: '90%',
      maxWidth: '1000px'
    });

    modal.open();
  }

  generateLiveAudit() {
    // After cleanup - only remaining issues
    const notImplemented = [
      { name: '✅ Validovat HTML', location: 'Rychlé akce (Ctrl+Shift+V)', status: 'todo' },
      { name: '📦 Minifikovat', location: 'Rychlé akce (Ctrl+Shift+M)', status: 'todo' },
      { name: '📦 Export ZIP', location: 'FileOperations', status: 'toast' }
    ];

    const working = [
      { name: '💾 Uložit', location: 'Ctrl+S, Rychlé akce' },
      { name: '⬇️ Stáhnout', location: 'Ctrl+D, Rychlé akce' },
      { name: '📄 Nový soubor', location: 'Ctrl+N, Rychlé akce' },
      { name: '🔍 Hledat', location: 'Ctrl+F, Menu' },
      { name: '✨ Formátovat', location: 'Ctrl+Shift+F' },
      { name: '↩️ Zpět / ↪️ Vpřed', location: 'Ctrl+Z/Y' },
      { name: '❌ Zavřít tab', location: 'Ctrl+W' },
      { name: '🎨 Přepnout téma', location: 'Menu > Nastavení' },
      { name: '🤖 AI Asistent', location: 'Tlačítko AI' },
      { name: '🤖 AI Nastavení', location: 'Menu, Rychlé akce' },
      { name: '🔄 Nahradit v kódu', location: 'Ctrl+H, Menu' },
      { name: '📄 Vytvořit .gitignore', location: 'Menu > Nástroje' },
      { name: '🐙 GitHub hledání', location: 'Menu > GitHub' },
      { name: '🌐 Načíst z URL', location: 'Menu > GitHub' },
      { name: '🐞 DevTools', location: 'Menu > Vývojářské nástroje' },
      { name: '📋 Error Log', location: 'Menu > Vývojářské nástroje' },
      { name: '📊 Audit projektu', location: 'Menu > Vývojářské nástroje' },
      { name: '🧩 Komponenty', location: 'Menu > Obsah' },
      { name: '📋 Šablony', location: 'Menu > Obsah' },
      { name: '🖼️ Obrázky', location: 'Menu > Obsah' },
      { name: '🤖 AI Generátor', location: 'Menu > Obsah' }
    ];

    const removed = [
      { name: '📐 CSS Grid/Flex editor', reason: 'Jen toast, neimplementováno' },
      { name: '🌐 Živý server', reason: 'Jen toast, neimplementováno' },
      { name: '🔗 Sdílet odkaz', reason: 'Jen toast, neimplementováno' },
      { name: '🚀 Deploy projekt', reason: 'Jen toast, neimplementováno' },
      { name: '🚀 Publikovat', reason: 'Chyběl handler' },
      { name: '🔧 SEO', reason: 'Chyběl handler' },
      { name: '📱 Zařízení', reason: 'Chyběl handler' },
      { name: '📸 Screenshot', reason: 'Chyběl handler' },
      { name: '⚙️ Nastavení', reason: 'Duplicitní (AI Nastavení funguje)' }
    ];

    return `
      <style>
        .audit-section { margin-bottom: 24px; }
        .audit-title { color: var(--accent); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .audit-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
        .badge-error { background: #ef444433; color: #ef4444; }
        .badge-warning { background: #f59e0b33; color: #f59e0b; }
        .badge-success { background: #10b98133; color: #10b981; }
        .badge-removed { background: #6b728033; color: #6b7280; }
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th, .audit-table td { padding: 10px; text-align: left; border-bottom: 1px solid var(--border); }
        .audit-table th { background: var(--bg-secondary); font-weight: 600; }
        .audit-table tr:hover { background: var(--bg-secondary); }
        .status-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
        .status-toast { background: #f59e0b33; color: #f59e0b; }
        .status-todo { background: #3b82f633; color: #3b82f6; }
      </style>

      <div class="audit-section">
        <h2 class="audit-title">✅ Funkční funkce <span class="audit-badge badge-success">${working.length}</span></h2>
        <table class="audit-table">
          <thead><tr><th>Funkce</th><th>Umístění</th></tr></thead>
          <tbody>
            ${working.map(item => '<tr><td><strong>' + item.name + '</strong></td><td>' + item.location + '</td></tr>').join('')}
          </tbody>
        </table>
      </div>

      <div class="audit-section">
        <h2 class="audit-title">⚠️ K implementaci <span class="audit-badge badge-warning">${notImplemented.length}</span></h2>
        <p style="color: var(--text-secondary); margin-bottom: 12px;">Tyto funkce jsou v UI, ale mají jen TODO v kódu.</p>
        <table class="audit-table">
          <thead><tr><th>Funkce</th><th>Umístění</th><th>Stav</th></tr></thead>
          <tbody>
            ${notImplemented.map(item => '<tr><td><strong>' + item.name + '</strong></td><td>' + item.location + '</td><td><span class="status-tag status-' + item.status + '">' + (item.status === 'todo' ? '📝 TODO' : '📢 Toast') + '</span></td></tr>').join('')}
          </tbody>
        </table>
      </div>

      <div class="audit-section">
        <h2 class="audit-title">🗑️ Odstraněno <span class="audit-badge badge-removed">${removed.length}</span></h2>
        <p style="color: var(--text-secondary); margin-bottom: 12px;">Tyto tlačítka byla odstraněna z UI.</p>
        <table class="audit-table">
          <thead><tr><th>Tlačítko</th><th>Důvod odstranění</th></tr></thead>
          <tbody>
            ${removed.map(item => '<tr><td><strong>' + item.name + '</strong></td><td>' + item.reason + '</td></tr>').join('')}
          </tbody>
        </table>
      </div>

      <div class="audit-section" style="background: var(--bg-secondary); padding: 16px; border-radius: 8px;">
        <h3>📊 Souhrn</h3>
        <p style="margin-top: 8px;">
          <strong style="color: #10b981;">Funkční:</strong> ${working.length} funkcí ✅<br>
          <strong style="color: #f59e0b;">K implementaci:</strong> ${notImplemented.length} tlačítek ⚠️<br>
          <strong style="color: #6b7280;">Odstraněno:</strong> ${removed.length} nefunkčních tlačítek 🗑️<br>
          <strong style="color: var(--accent);">Pokrytí:</strong> ${Math.round(working.length / (working.length + notImplemented.length) * 100)}%
        </p>
      </div>
    `;
  }

  // ===== Helper Methods =====

  createCard({ className, dataKey, dataType, title, subtitle }) {
    const card = document.createElement('div');
    card.className = className;
    card.dataset.key = dataKey;
    if (dataType) card.dataset.type = dataType;
    card.style.cssText = 'border: 1px solid var(--border); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s; background: var(--bg-secondary);';

    const titleEl = document.createElement('h4');
    titleEl.textContent = title;
    titleEl.style.marginBottom = '8px';

    const subtitleEl = document.createElement('small');
    subtitleEl.textContent = subtitle;
    subtitleEl.style.color = 'var(--text-secondary)';

    card.appendChild(titleEl);
    card.appendChild(subtitleEl);

    return card;
  }

  attachCardListeners(modalElement, selector, onClick) {
    if (!modalElement) return;

    modalElement.querySelectorAll(selector).forEach(card => {
      const key = card.dataset.key;

      this.addHoverEffect(card);

      card.addEventListener('click', () => onClick(key));
    });
  }

  addHoverEffect(card) {
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'var(--accent)';
      card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--border)';
      card.style.transform = 'none';
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  markdownToHtml(markdown) {
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3 style="color: var(--accent); margin-top: 24px; margin-bottom: 12px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: var(--accent); margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid var(--border); padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: var(--accent); margin-bottom: 20px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border);"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px;">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin-left: 20px;">$2</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: var(--accent); text-decoration: underline;">$1</a>')
      .replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid var(--border); margin: 24px 0;">');

    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) => `<ul style="margin: 12px 0;">${match}</ul>`);

    html = html.split('\n').map(line => {
      line = line.trim();
      if (!line) return '<br>';
      if (line.startsWith('<')) return line;
      return `<p style="margin-bottom: 12px;">${line}</p>`;
    }).join('\n');

    return html;
  }
}
