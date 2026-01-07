/**
 * Menu Panel Module - REFACTORED
 * Main navigation menu - delegating to services
 */

import { eventBus } from '../../core/events.js';
import { state } from '../../core/state.js';
import { AITester } from '../ai/AITester.js';
import { Modal } from '../../ui/components/Modal.js';

// Import services
import { FileOperations } from './services/FileOperations.js';
import { TemplateManager } from './services/TemplateManager.js';
import { GitHubService } from './services/GitHubService.js';
import { ComponentLibrary } from './services/ComponentLibrary.js';
import { ImageLibrary } from './services/ImageLibrary.js';

export class MenuPanel {
  constructor() {
    this.menuElement = null;
    this.isOpen = false;
    this.aiTester = new AITester();
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('menu:toggle', () => this.toggle());
    eventBus.on('menu:show', () => this.show());
    eventBus.on('menu:hide', () => this.hide());
  }

  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (!this.menuElement) {
      this.createMenu();
    }

    this.updateOpenFilesList();
    this.menuElement.classList.add('active');
    this.isOpen = true;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    backdrop.addEventListener('click', () => this.hide());
    document.body.appendChild(backdrop);

    // Close on escape
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  hide() {
    if (this.menuElement) {
      this.menuElement.classList.remove('active');
    }

    const backdrop = document.querySelector('.menu-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

    this.isOpen = false;
  }

  createMenu() {
    this.menuElement = document.createElement('div');
    this.menuElement.className = 'side-menu';
    
    // Create menu content using textContent and createElement (not innerHTML!)
    const header = this.createMenuHeader();
    const nav = this.createMenuNav();
    
    this.menuElement.appendChild(header);
    this.menuElement.appendChild(nav);

    document.body.appendChild(this.menuElement);
    this.attachEventHandlers();
  }

  createMenuHeader() {
    const header = document.createElement('div');
    header.className = 'menu-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Menu';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'menu-close';
    closeBtn.id = 'menuClose';
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>`;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    return header;
  }

  createMenuNav() {
    const nav = document.createElement('nav');
    nav.className = 'menu-nav';
    
    // Settings section
    nav.appendChild(this.createMenuSection('⚙️ Nastavení', [
      { icon: '🤖', label: 'Nastavení AI', action: 'aiSettings' },
      { icon: '🎨', label: 'Přepnout téma', action: 'theme' }
    ]));
    
    // Advanced tools section
    nav.appendChild(this.createMenuSection('🛠️ Pokročilé nástroje', [
      { icon: '📐', label: 'CSS Grid/Flex editor', action: 'gridEditor' },
      { icon: '🌐', label: 'Živý server', action: 'liveServer' },
      { icon: '📝', label: 'Vytvořit .gitignore', action: 'gitignore' },
      { icon: '🔄', label: 'Nahradit v kódu', action: 'replace', shortcut: 'Ctrl+H' }
    ]));
    
    // Content section
    nav.appendChild(this.createMenuSection('📋 Obsah', [
      { icon: '🤖', label: 'AI Generátor komponent', action: 'ai-component' },
      { icon: '🧩', label: 'Komponenty', action: 'components' },
      { icon: '📋', label: 'Šablony', action: 'templates' },
      { icon: '🖼️', label: 'Obrázky', action: 'images' }
    ]));
    
    // Sharing section
    nav.appendChild(this.createMenuSection('🔗 Sdílení', [
      { icon: '🔗', label: 'Sdílet odkaz', action: 'share' }
    ]));
    
    // GitHub section
    nav.appendChild(this.createMenuSection('🐙 GitHub', [
      { icon: '🔍', label: 'Hledat na GitHubu', action: 'github-search' },
      { icon: '🚀', label: 'Deploy projekt', action: 'deploy' }
    ]));
    
    // Dev tools section
    nav.appendChild(this.createMenuSection('🔧 Vývojářské nástroje', [
      { icon: '📊', label: 'Audit projektu', action: 'audit' },
      { icon: '🐞', label: 'Otevřít DevTools', action: 'devtools' }
    ]));
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'menu-footer';
    const footerText = document.createElement('small');
    footerText.innerHTML = '💡 Pro základní akce použijte <strong>logo ⚡</strong> nebo <strong>Ctrl+K</strong>';
    footer.appendChild(footerText);
    nav.appendChild(footer);
    
    return nav;
  }

  createMenuSection(title, items) {
    const section = document.createElement('div');
    section.className = 'menu-section';
    
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'menu-item';
      btn.dataset.action = item.action;
      
      const icon = document.createElement('span');
      icon.className = 'menu-icon';
      icon.textContent = item.icon;
      
      const label = document.createElement('span');
      label.textContent = item.label;
      
      btn.appendChild(icon);
      btn.appendChild(label);
      
      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.className = 'menu-shortcut';
        shortcut.textContent = item.shortcut;
        btn.appendChild(shortcut);
      }
      
      section.appendChild(btn);
    });
    
    return section;
  }

  attachEventHandlers() {
    // Close button
    const closeBtn = this.menuElement.querySelector('#menuClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Menu item buttons
    const menuItems = this.menuElement.querySelectorAll('[data-action]');
    menuItems.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        this.executeAction(action);
        this.hide();
      });
    });
  }

  executeAction(action) {
    console.log('Menu action:', action);

    switch (action) {
      // Advanced tools
      case 'gridEditor':
        this.showGridEditor();
        break;
      case 'liveServer':
        this.showLiveServer();
        break;
      case 'gitignore':
        FileOperations.createGitignore();
        break;
      case 'replace':
        this.showReplaceDialog();
        break;

      // Content
      case 'ai-component':
        this.showAIComponentGenerator();
        break;
      case 'components':
        this.showComponents();
        break;
      case 'templates':
        this.showTemplates();
        break;
      case 'images':
        this.showImages();
        break;

      // Sharing
      case 'share':
        FileOperations.shareProject();
        break;

      // GitHub
      case 'github-search':
        GitHubService.githubSearch();
        break;
      case 'deploy':
        this.deployProject();
        break;

      // Dev tools
      case 'devtools':
        this.openDevTools();
        break;
      case 'audit':
        this.showAuditReport();
        break;

      // Settings
      case 'aiSettings':
        this.showAISettings();
        break;
      case 'theme':
        this.toggleTheme();
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }

  // ===== Components Modal =====
  showComponents() {
    const components = ComponentLibrary.getComponents();
    
    const content = document.createElement('div');
    content.style.padding = '20px';
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;';
    
    Object.entries(components).forEach(([key, component]) => {
      const card = document.createElement('div');
      card.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;';
      card.onmouseover = () => card.style.borderColor = 'var(--primary-color)';
      card.onmouseout = () => card.style.borderColor = 'var(--border-color)';
      
      const name = document.createElement('h4');
      name.textContent = component.name;
      name.style.marginBottom = '8px';
      
      const category = document.createElement('small');
      category.textContent = component.category;
      category.style.color = 'var(--text-secondary)';
      
      card.appendChild(name);
      card.appendChild(category);
      
      card.onclick = () => {
        ComponentLibrary.insertComponent(component.code);
        modal.close();
      };
      
      grid.appendChild(card);
    });
    
    content.appendChild(grid);
    
    const modal = new Modal({
      title: '🧩 Knihovna komponent',
      content: content.outerHTML,
      width: '900px'
    });
    
    modal.open();
  }

  // ===== Templates Modal =====
  showTemplates() {
    const { builtInTemplates, customTemplates } = TemplateManager.getTemplates();
    
    const content = document.createElement('div');
    content.style.padding = '20px';
    
    // Built-in templates
    const builtInSection = document.createElement('div');
    builtInSection.innerHTML = '<h4>📋 Vestavěné šablony</h4>';
    
    const builtInGrid = document.createElement('div');
    builtInGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; margin-bottom: 24px;';
    
    Object.entries(builtInTemplates).forEach(([key, template]) => {
      const card = this.createTemplateCard(template, () => {
        TemplateManager.applyTemplate(template.code);
        modal.close();
      });
      builtInGrid.appendChild(card);
    });
    
    builtInSection.appendChild(builtInGrid);
    content.appendChild(builtInSection);
    
    // Custom templates
    if (Object.keys(customTemplates).length > 0) {
      const customSection = document.createElement('div');
      customSection.innerHTML = '<h4>🎨 Vlastní šablony</h4>';
      
      const customGrid = document.createElement('div');
      customGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;';
      
      Object.entries(customTemplates).forEach(([key, template]) => {
        const card = this.createTemplateCard(template, () => {
          TemplateManager.applyTemplate(template.code);
          modal.close();
        });
        customGrid.appendChild(card);
      });
      
      customSection.appendChild(customGrid);
      content.appendChild(customSection);
    }
    
    const modal = new Modal({
      title: '📋 Knihovna šablon',
      content: content.outerHTML,
      width: '900px'
    });
    
    modal.open();
  }

  createTemplateCard(template, onClick) {
    const card = document.createElement('div');
    card.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s;';
    card.onmouseover = () => card.style.borderColor = 'var(--primary-color)';
    card.onmouseout = () => card.style.borderColor = 'var(--border-color)';
    
    const name = document.createElement('h4');
    name.textContent = template.name;
    name.style.marginBottom = '8px';
    
    const desc = document.createElement('small');
    desc.textContent = template.description || '';
    desc.style.color = 'var(--text-secondary)';
    
    card.appendChild(name);
    card.appendChild(desc);
    card.onclick = onClick;
    
    return card;
  }

  // ===== Images Modal =====
  showImages() {
    const categories = ImageLibrary.getImageCategories();
    
    const content = document.createElement('div');
    content.style.padding = '20px';
    
    Object.entries(categories).forEach(([key, category]) => {
      const section = document.createElement('div');
      section.style.marginBottom = '24px';
      
      const heading = document.createElement('h4');
      heading.textContent = category.name;
      section.appendChild(heading);
      
      const grid = document.createElement('div');
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;';
      
      category.images.forEach(image => {
        const card = document.createElement('div');
        card.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; cursor: pointer; text-align: center;';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.name;
        img.style.cssText = 'width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;';
        
        const label = document.createElement('div');
        label.textContent = image.name;
        label.style.fontSize = '13px';
        
        card.appendChild(img);
        card.appendChild(label);
        
        card.onclick = () => {
          ImageLibrary.insertImage(image.url, image.width, image.height, image.name);
          modal.close();
        };
        
        grid.appendChild(card);
      });
      
      section.appendChild(grid);
      content.appendChild(section);
    });
    
    const modal = new Modal({
      title: '🖼️ Knihovna obrázků',
      content: content.outerHTML,
      width: '900px'
    });
    
    modal.open();
  }

  // ===== AI Component Generator =====
  showAIComponentGenerator() {
    const content = `
      <div style="padding: 20px;">
        <p style="margin-bottom: 16px;">Popište komponentu, kterou chcete vytvořit:</p>
        <textarea
          id="aiComponentPrompt"
          placeholder="Např: Vytvoř moderní kontaktní formulář s poli pro jméno, email a zprávu"
          style="width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; font-family: inherit; resize: vertical;"
        ></textarea>
        <button
          id="aiComponentGenerate"
          style="width: 100%; padding: 12px; margin-top: 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
        >
          🚀 Vygenerovat
        </button>
        <div id="aiComponentResult" style="display: none; margin-top: 20px;">
          <h4>Vygenerovaný kód:</h4>
          <pre id="aiComponentCode" style="background: var(--bg-secondary); padding: 12px; border-radius: 6px; overflow-x: auto;"></pre>
          <button
            id="aiComponentInsert"
            style="width: 100%; padding: 10px; margin-top: 8px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer;"
          >
            ✅ Vložit do editoru
          </button>
        </div>
      </div>
    `;
    
    const modal = new Modal({
      title: '🤖 AI Generátor komponent',
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
      
      generateBtn.textContent = '⏳ Generuji...';
      generateBtn.disabled = true;
      
      const code = await ComponentLibrary.generateAIComponent(description);
      
      if (code) {
        generatedCode = code;
        codeElement.textContent = code;
        resultDiv.style.display = 'block';
      }
      
      generateBtn.textContent = '🚀 Vygenerovat';
      generateBtn.disabled = false;
    });
    
    insertBtn?.addEventListener('click', () => {
      if (generatedCode) {
        eventBus.emit('editor:insert', generatedCode);
        modal.close();
      }
    });
  }

  // ===== Stub methods (TODO: implement or delegate) =====
  
  showGridEditor() {
    eventBus.emit('toast:show', {
      message: 'Grid Editor bude implementován',
      type: 'info'
    });
  }

  showLiveServer() {
    eventBus.emit('toast:show', {
      message: 'Live Server funkce',
      type: 'info'
    });
  }

  showReplaceDialog() {
    eventBus.emit('toast:show', {
      message: 'Find & Replace - použijte Ctrl+H',
      type: 'info'
    });
  }

  deployProject() {
    eventBus.emit('toast:show', {
      message: 'Deploy bude implementován',
      type: 'info'
    });
  }

  openDevTools() {
    if (window.eruda) {
      window.eruda.show();
    } else {
      eventBus.emit('toast:show', {
        message: 'DevTools nejsou dostupné',
        type: 'warning'
      });
    }
  }

  async showAuditReport() {
    try {
      const response = await fetch('/docs/AUDIT_REPORT.md');
      const markdown = await response.text();
      const html = this.markdownToHtml(markdown);

      const modal = new Modal({
        title: '📊 Audit Report - HTML Studio v2.0',
        content: `<div style="max-height: 70vh; overflow-y: auto; padding: 20px; line-height: 1.6;">${html}</div>`,
        width: '90%',
        maxWidth: '1000px'
      });

      modal.open();
    } catch (error) {
      console.error('Error loading audit report:', error);
      eventBus.emit('toast:show', {
        message: 'Chyba při načítání audit reportu',
        type: 'error'
      });
    }
  }

  markdownToHtml(markdown) {
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3 style="color: var(--primary-color); margin-top: 24px; margin-bottom: 12px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: var(--primary-color); margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: var(--primary-color); margin-bottom: 20px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border-color);"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/^\- (.*$)/gim, '<li style="margin-left: 20px;">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li style="margin-left: 20px;">$2</li>')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" style="color: var(--primary-color); text-decoration: underline;">$1</a>')
      .replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 24px 0;">');

    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) => `<ul style="margin: 12px 0;">${match}</ul>`);

    html = html.split('\n').map(line => {
      line = line.trim();
      if (!line) return '<br>';
      if (line.startsWith('<')) return line;
      return `<p style="margin-bottom: 12px;">${line}</p>`;
    }).join('\n');

    return html;
  }

  showAISettings() {
    eventBus.emit('toast:show', {
      message: 'Nastavení AI - otevřete AI panel',
      type: 'info'
    });
  }

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    eventBus.emit('toast:show', {
      message: `${isLight ? '☀️' : '🌙'} Téma změněno`,
      type: 'success'
    });
  }

  updateOpenFilesList() {
    // Optional: implement if needed
  }
}
