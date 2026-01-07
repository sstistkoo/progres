/**
 * GitHub Integration Service
 * Handles GitHub search, deploy, and integrations
 */

import { Modal } from '../../../ui/components/Modal.js';
import { eventBus } from '../../../core/events.js';
import { createElement } from '../../../utils/dom.js';

export class GitHubService {
  /**
   * Search GitHub for code snippets
   */
  static async githubSearch() {
    const modal = new Modal({
      title: '🔍 GitHub Search',
      content: `
        <div style="padding: 20px;">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">
              Vyhledat kód na GitHubu:
            </label>
            <input
              type="text"
              id="githubQuery"
              placeholder="např. 'navbar responsive css'"
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px;"
            />
          </div>
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">
              Jazyk (volitelné):
            </label>
            <select
              id="githubLanguage"
              style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px;"
            >
              <option value="">Všechny jazyky</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div id="githubResults" style="margin-top: 20px; max-height: 400px; overflow-y: auto;"></div>
        </div>
      `,
      width: '700px'
    });

    modal.open();

    const queryInput = document.getElementById('githubQuery');
    const languageSelect = document.getElementById('githubLanguage');
    const resultsDiv = document.getElementById('githubResults');

    const performSearch = async () => {
      const query = queryInput?.value?.trim();
      if (!query) {
        eventBus.emit('toast:show', {
          message: 'Zadejte hledaný výraz',
          type: 'warning'
        });
        return;
      }

      if (!resultsDiv) return;

      // Clear and show loading
      resultsDiv.textContent = '';
      const loading = document.createElement('p');
      loading.textContent = '🔍 Hledám...';
      loading.style.cssText = 'text-align: center; padding: 20px;';
      resultsDiv.appendChild(loading);

      try {
        const language = languageSelect?.value || '';
        const searchQuery = language ? `${query}+language:${language}` : query;

        const response = await fetch(
          `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=10`
        );

        if (!response.ok) {
          throw new Error('GitHub API error');
        }

        const data = await response.json();

        // Clear loading
        resultsDiv.textContent = '';

        if (data.items && data.items.length > 0) {
          data.items.forEach(item => {
            const repoName = item.repository.full_name;
            const fileName = item.name;
            const fileUrl = item.html_url;

            // Create result card using createElement (safe!)
            const card = document.createElement('div');
            card.style.cssText = 'padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 12px; background: var(--bg-secondary);';

            const fileNameEl = document.createElement('div');
            fileNameEl.textContent = fileName; // Safe - textContent
            fileNameEl.style.cssText = 'font-weight: 600; margin-bottom: 4px; color: var(--primary-color);';

            const repoNameEl = document.createElement('div');
            repoNameEl.textContent = `📦 ${repoName}`; // Safe - textContent
            repoNameEl.style.cssText = 'font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;';

            const link = document.createElement('a');
            link.href = fileUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = '🔗 Zobrazit na GitHubu →';
            link.style.cssText = 'color: var(--primary-color); text-decoration: none; font-size: 13px;';

            card.appendChild(fileNameEl);
            card.appendChild(repoNameEl);
            card.appendChild(link);
            resultsDiv.appendChild(card);
          });
        } else {
          const noResults = document.createElement('p');
          noResults.textContent = 'Žádné výsledky';
          noResults.style.cssText = 'text-align: center; padding: 20px; color: var(--text-secondary);';
          resultsDiv.appendChild(noResults);
        }
      } catch (error) {
        console.error('GitHub search error:', error);
        resultsDiv.textContent = '';
        const errorMsg = document.createElement('p');
        errorMsg.textContent = '❌ Chyba při vyhledávání';
        errorMsg.style.cssText = 'text-align: center; padding: 20px; color: var(--error-color);';
        resultsDiv.appendChild(errorMsg);
      }
    };

    // Enter key search
    queryInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });

    // Add search button
    const searchBtn = createElement('button', {
      textContent: '🔍 Hledat',
      style: 'width: 100%; padding: 10px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; margin-top: 12px;'
    });

    searchBtn.onclick = performSearch;
    queryInput?.parentNode?.appendChild(searchBtn);
  }

  /**
   * Deploy to GitHub Pages
   */
  static async deployToGitHub() {
    eventBus.emit('toast:show', {
      message: 'GitHub Pages deploy bude implementován',
      type: 'info'
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
