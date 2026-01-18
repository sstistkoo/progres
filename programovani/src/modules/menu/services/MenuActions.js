/**
 * Menu Actions Service
 * Handles all menu action dispatching
 */

import { eventBus } from '../../../core/events.js';
import { FileOperations } from './FileOperations.js';

export class MenuActions {
  constructor(menuPanel) {
    this.menuPanel = menuPanel;
  }

  /**
   * Execute menu action by name
   * @param {string} action - Action identifier
   */
  execute(action) {
    console.log('Menu action:', action);

    const actions = {
      // Settings
      'aiSettings': () => this.showAISettings(),
      'theme': () => this.toggleTheme(),

      // Advanced tools
      'gridEditor': () => this.showGridEditor(),
      'liveServer': () => this.showLiveServer(),
      'gitignore': () => FileOperations.createGitignore(),
      'replace': () => this.showReplaceDialog(),

      // Content
      'ai-component': () => this.menuPanel.modals.showAIComponentGenerator(),
      'components': () => this.menuPanel.modals.showComponents(),
      'templates': () => this.menuPanel.modals.showTemplates(),
      'images': () => this.menuPanel.modals.showImages(),

      // Sharing
      'share': () => FileOperations.shareProject(),

      // GitHub
      'github-search': () => {
        eventBus.emit('ai:github-search');
        this.menuPanel.hide();
      },
      'load-from-url': () => this.menuPanel.modals.showLoadFromURL(),
      'deploy': () => this.deployProject(),

      // Dev tools
      'devtools': () => this.openDevTools(),
      'error-log': () => this.menuPanel.modals.showErrorLog(),
      'audit': () => this.menuPanel.modals.showAuditReport()
    };

    const actionFn = actions[action];
    if (actionFn) {
      actionFn();
    } else {
      console.warn('Unknown action:', action);
    }
  }

  // ===== Settings Actions =====

  showAISettings() {
    eventBus.emit('aiSettings:show');
  }

  toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    eventBus.emit('toast:show', {
      message: `${isLight ? 'â˜€ï¸' : 'ðŸŒ™'} TÃ©ma zmÄ›nÄ›no`,
      type: 'success'
    });
  }

  // ===== Tools Actions =====

  showGridEditor() {
    eventBus.emit('toast:show', {
      message: 'ðŸ“ Grid Editor bude implementovÃ¡n',
      type: 'info'
    });
  }

  showLiveServer() {
    eventBus.emit('toast:show', {
      message: 'ðŸŒ Live Server funkce',
      type: 'info'
    });
  }

  showReplaceDialog() {
    eventBus.emit('findReplace:show');
  }

  // ===== GitHub Actions =====

  deployProject() {
    eventBus.emit('toast:show', {
      message: 'ðŸš€ Deploy bude implementovÃ¡n',
      type: 'info'
    });
  }

  // ===== DevTools Actions =====

  openDevTools() {
    // Check if Eruda is loaded
    if (typeof window.eruda !== 'undefined') {
      if (!window.eruda._isInit) {
        window.eruda.init();
      }
      window.eruda.show();
      eventBus.emit('toast:show', {
        message: 'ðŸž DevTools otevÅ™eny',
        type: 'success',
        duration: 2000
      });
    } else {
      eventBus.emit('toast:show', {
        message: 'âš ï¸ DevTools (Eruda) nejsou dostupnÃ©. Zkuste obnovit strÃ¡nku.',
        type: 'warning'
      });
    }
  }
}
