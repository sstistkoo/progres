/**
 * GitHub Service
 * Handles all GitHub-related functionality including search, repository management, and code loading
 */

import { eventBus } from '../../../core/events.js';
import { state } from '../../../core/state.js';
import { SafeOps } from '../../../core/safeOps.js';
import { Modal } from '../../../ui/components/Modal.js';

export class GitHubService {
  constructor(aiPanel) {
    this.panel = aiPanel; // Reference to AIPanel for shared functionality
  }

  /**
   * Handle GitHub action routing
   */
  handleGitHubAction(action) {
    const actions = {
      'repos': () => this.showRepoManager(),
      'search-repos': () => this.showGitHubSearchDialog(),
      'clone': () => this.cloneRepo(),
      'create-gist': () => this.createGist(),
      'issues': () => eventBus.emit('github:showIssues'),
      'pull-requests': () => eventBus.emit('github:showPullRequests'),
      'deploy': () => eventBus.emit('github:deployPages')
    };

    const actionFn = actions[action];
    if (actionFn) {
      actionFn();
    }
  }

  /**
   * Show GitHub search dialog for repositories and code
   */
  showGitHubSearchDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 850px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #ffffff; font-size: 18px;">🔍 Hledat na GitHub</h3>
          <button class="modal-close" id="githubSearchClose" style="background: #333; border: none; color: #ffffff; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 0; overflow-y: auto;">

          <!-- Rozbalovací formulář -->
          <div id="searchFormSection" style="border-bottom: 1px solid #333;">
            <button id="toggleSearchForm" style="width: 100%; padding: 15px 25px; background: transparent; border: none; color: #ffffff; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 14px; transition: background 0.2s;">
              <span>⚙️ Nastavení vyhledávání</span>
              <span id="toggleIcon" style="font-size: 18px; transition: transform 0.3s;">▼</span>
            </button>

            <div id="searchFormContent" style="padding: 0 25px 25px 25px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: #cccccc;">GitHub Token (volitelné pro více výsledků)</label>
                <input type="password" id="githubToken" placeholder="ghp_..." value="${localStorage.getItem('github_token') || ''}" style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 6px; font-size: 13px; background: #0d0d0d; color: #ffffff;">
                <p style="font-size: 11px; color: #888888; margin-top: 4px;">
                  Token se uloží do prohlížeče. <a href="https://github.com/settings/tokens" target="_blank" style="color: #0066cc;">Vytvořit token</a>
                </p>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: #cccccc;">Co hledáte?</label>
                <input type="text" id="githubSearchQuery" placeholder="Např. landing page, portfolio, navbar..." style="width: 100%; padding: 12px; border: 1px solid #333; border-radius: 8px; font-size: 14px; background: #0d0d0d; color: #ffffff;">
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: #cccccc;">Jazyk (volitelné)</label>
                <select id="githubLanguage" style="width: 100%; padding: 10px; border: 1px solid #333; border-radius: 6px; font-size: 13px; background: #0d0d0d; color: #ffffff;">
                  <option value="">Všechny jazyky</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="php">PHP</option>
                  <option value="ruby">Ruby</option>
                </select>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <button id="searchRepos" style="padding: 14px; background: #0066cc; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; transition: all 0.2s;">
                  📦 Hledat repozitáře
                </button>
                <button id="searchCode" style="padding: 14px; background: #333; color: #ffffff; border: 1px solid #555; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; transition: all 0.2s;">
                  📄 Hledat kód
                </button>
              </div>
            </div>
          </div>

          <!-- Výsledky a loading -->
          <div style="padding: 25px;">
            <div id="githubSearchResults" style="display: none;">
              <div id="githubResultsHeader" style="margin-bottom: 12px;"></div>
              <div id="githubResultsList" style="display: grid; gap: 10px; max-height: 450px; overflow-y: auto;"></div>
              <div id="githubPagination" style="margin-top: 16px;"></div>
            </div>
            <div id="githubSearchLoading" style="display: none; text-align: center; padding: 40px;">
              <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #333; border-top-color: #0066cc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <p style="margin-top: 15px; color: #888888;">Hledání na GitHub...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let currentPage = 1;
    let totalCount = 0;
    let formCollapsed = false;

    const closeModal = () => modal.remove();
    modal.querySelector('#githubSearchClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Toggle formuláře
    const toggleBtn = modal.querySelector('#toggleSearchForm');
    const toggleIcon = modal.querySelector('#toggleIcon');
    const formContent = modal.querySelector('#searchFormContent');

    toggleBtn.addEventListener('click', () => {
      formCollapsed = !formCollapsed;
      if (formCollapsed) {
        formContent.style.display = 'none';
        toggleIcon.textContent = '▶';
        toggleIcon.style.transform = 'rotate(0deg)';
      } else {
        formContent.style.display = 'block';
        toggleIcon.textContent = '▼';
        toggleIcon.style.transform = 'rotate(0deg)';
      }
    });

    let lastSearchType = 'repositories'; // Výchozí hledání repozitářů

    const performSearch = async (searchType, page = 1) => {
      currentPage = page;
      const query = modal.querySelector('#githubSearchQuery').value.trim();
      const language = modal.querySelector('#githubLanguage').value;
      const token = modal.querySelector('#githubToken').value.trim();

      lastSearchType = searchType; // Ulož pro použití ve výsledcích

      if (!query) {
        eventBus.emit('toast:show', {
          message: 'Zadejte hledaný výraz',
          type: 'warning'
        });
        return;
      }

      // Po zahájení hledání sbal formulář
      if (!formCollapsed && page === 1) {
        formCollapsed = true;
        formContent.style.display = 'none';
        toggleIcon.textContent = '▶';
      }

      // Ulož token
      if (token) {
        localStorage.setItem('github_token', token);
      }

      const loadingDiv = modal.querySelector('#githubSearchLoading');
      const resultsDiv = modal.querySelector('#githubSearchResults');
      const resultsList = modal.querySelector('#githubResultsList');
      const resultsHeader = modal.querySelector('#githubResultsHeader');
      const paginationDiv = modal.querySelector('#githubPagination');

      loadingDiv.style.display = 'block';
      resultsDiv.style.display = 'none';
      resultsList.innerHTML = '';
      resultsHeader.innerHTML = '';
      paginationDiv.innerHTML = '';

      try {
        let results;

        if (searchType === 'repositories') {
          results = await this.searchGitHubRepos(query, language, page, token);
        } else {
          results = await this.searchGitHubCode(query, language, page, token);
        }

        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';

        if (results.items.length === 0) {
          resultsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenalezeny žádné výsledky</p>';
          return;
        }

        totalCount = results.total_count;

        // Header s počtem výsledků
        const githubSearchUrl = `https://github.com/search?q=${encodeURIComponent(query)}${language ? `+language:${language}` : ''}&type=${searchType === 'repositories' ? 'repositories' : 'code'}`;
        resultsHeader.innerHTML = `
          <div style="padding: 12px; background: var(--bg-secondary); border-radius: 6px; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 6px; color: var(--accent);">
              📊 Nalezeno ${totalCount.toLocaleString('cs-CZ')} výsledků | Stránka ${page}
            </div>
            <a href="${githubSearchUrl}" target="_blank" style="color: var(--accent); text-decoration: none; font-size: 13px;">
              🔗 Otevřít na GitHubu
            </a>
          </div>
        `;

        results.items.forEach(result => {
          const resultCard = document.createElement('div');
          resultCard.style.cssText = 'padding: 15px; background: #242424; border: 1px solid #333; border-radius: 8px; transition: all 0.2s;';

          if (lastSearchType === 'repositories') {
            resultCard.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <h5 style="margin: 0; color: #0066cc; font-size: 14px;">${result.name}</h5>
                    <a href="${result.html_url}" target="_blank" style="color: #888888; text-decoration: none; font-size: 11px;">🔗</a>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #cccccc;">${result.description || 'Bez popisu'}</p>
                  <div style="display: flex; gap: 15px; font-size: 11px; color: #888888;">
                    <span>⭐ ${result.stargazers_count}</span>
                    <span>🍴 ${result.forks_count}</span>
                  </div>
                </div>
                <button class="load-github-repo" data-fullname="${result.full_name}" data-name="${result.name}" style="padding: 8px 16px; background: #0066cc; color: #ffffff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                  📥 Načíst
                </button>
              </div>
            `;
          } else {
            resultCard.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <h5 style="margin: 0; color: #0066cc; font-size: 14px;">${result.name}</h5>
                    <a href="${result.html_url}" target="_blank" style="color: #888888; text-decoration: none; font-size: 11px;">🔗</a>
                  </div>
                  <p style="margin: 0 0 6px 0; font-size: 11px; color: #cccccc;">📦 ${result.repository.full_name}</p>
                  <p style="margin: 0; font-size: 11px; color: #888888;">📄 ${result.path}</p>
                </div>
                <button class="load-github-file" data-url="${result.html_url}" data-name="${result.name}" style="padding: 8px 16px; background: #0066cc; color: #ffffff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
                  📥 Načíst
                </button>
              </div>
            `;
          }

          // Event listeners pro načtení
          const loadBtn = resultCard.querySelector('.load-github-repo, .load-github-file');
          loadBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = '⏳ Načítání...';

            try {
              closeModal();
              this.panel.showLoadingOverlay('📥 Načítám z GitHub...');

              if (lastSearchType === 'repositories') {
                const fullName = btn.dataset.fullname;
                await this.loadGitHubRepo(fullName, btn.dataset.name);
              } else {
                await this.loadGitHubCode(result.html_url, result.name, true);
              }

              this.panel.hideLoadingOverlay();
              eventBus.emit('toast:show', {
                message: '✅ Kód načten z GitHub',
                type: 'success'
              });
            } catch (error) {
              this.panel.hideLoadingOverlay();
              eventBus.emit('toast:show', {
                message: '❌ ' + error.message,
                type: 'error'
              });
              btn.disabled = false;
              btn.textContent = '📥 Načíst';
            }
          });

          resultsList.appendChild(resultCard);
        });

        // Pagination
        const maxPages = Math.min(Math.ceil(totalCount / 10), 100);
        if (maxPages > 1) {
          const paginationHTML = this.createPaginationHTML(page, maxPages);
          paginationDiv.innerHTML = paginationHTML;

          // Bind pagination clicks
          paginationDiv.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
              const newPage = parseInt(btn.dataset.page);
              performSearch(lastSearchType, newPage);
            });
          });
        }

      } catch (error) {
        loadingDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = `<p style="text-align: center; color: #ff6b6b; padding: 20px;">❌ ${error.message}</p>`;
      }
    };

    // Tlačítko pro hledání repozitářů
    modal.querySelector('#searchRepos').addEventListener('click', () => performSearch('repositories', 1));

    // Tlačítko pro hledání kódu
    modal.querySelector('#searchCode').addEventListener('click', () => performSearch('code', 1));

    // Enter pro hledání repozitářů (výchozí)
    modal.querySelector('#githubSearchQuery').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') performSearch('repositories', 1);
    });
  }

  /**
   * Create pagination HTML
   */
  createPaginationHTML(page, maxPages) {
    let html = '<div style="display: flex; justify-content: center; align-items: center; gap: 6px; flex-wrap: wrap;">';

    // Previous
    html += `<button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} style="padding: 8px 12px; background: ${page === 1 ? '#333' : '#0066cc'}; color: #ffffff; border: none; border-radius: 6px; cursor: ${page === 1 ? 'not-allowed' : 'pointer'}; font-weight: 600;">←</button>`;

    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(maxPages, page + 2);

    if (page <= 3) endPage = Math.min(5, maxPages);
    else if (page >= maxPages - 2) startPage = Math.max(1, maxPages - 4);

    // First + ellipsis
    if (startPage > 1) {
      html += `<button data-page="1" style="padding: 8px 12px; background: #242424; color: #ffffff; border: 1px solid #333; border-radius: 6px; cursor: pointer; font-weight: 600;">1</button>`;
      if (startPage > 2) html += '<span style="padding: 8px 4px; color: #888888;">...</span>';
    }

    // Pages
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === page;
      html += `<button data-page="${i}" style="padding: 8px 12px; background: ${isActive ? '#0066cc' : '#242424'}; color: #ffffff; border: 1px solid ${isActive ? '#0066cc' : '#333'}; border-radius: 6px; cursor: pointer; font-weight: 600;">${i}</button>`;
    }

    // Ellipsis + last
    if (endPage < maxPages) {
      if (endPage < maxPages - 1) html += '<span style="padding: 8px 4px; color: #888888;">...</span>';
      html += `<button data-page="${maxPages}" style="padding: 8px 12px; background: #242424; color: #ffffff; border: 1px solid #333; border-radius: 6px; cursor: pointer; font-weight: 600;">${maxPages}</button>`;
    }

    // Next
    html += `<button data-page="${page + 1}" ${page >= maxPages ? 'disabled' : ''} style="padding: 8px 12px; background: ${page >= maxPages ? '#333' : '#0066cc'}; color: #ffffff; border: none; border-radius: 6px; cursor: ${page >= maxPages ? 'not-allowed' : 'pointer'}; font-weight: 600;">→</button>`;

    html += '</div>';
    return html;
  }

  /**
   * Search GitHub code
   */
  async searchGitHubCode(query, language, page = 1, token = null) {
    const searchQuery = language ? `${query}+language:${language}` : query;
    const headers = { 'Accept': 'application/vnd.github+json' };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-GitHub-Api-Version'] = '2022-11-28';
    }

    const response = await fetch(
      `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=10&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('GitHub API chyba: ' + response.statusText);
    }

    return await response.json();
  }

  /**
   * Search GitHub repositories
   */
  async searchGitHubRepos(query, language, page = 1, token = null) {
    const searchQuery = language ? `${query}+language:${language}` : query;
    const headers = { 'Accept': 'application/vnd.github+json' };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-GitHub-Api-Version'] = '2022-11-28';
    }

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&per_page=10&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('GitHub API chyba: ' + response.statusText);
    }

    return await response.json();
  }

  /**
   * Load GitHub repository
   */
  async loadGitHubRepo(fullName, repoName) {
    try {
      this.panel.showLoadingOverlay('📥 Načítám repozitář...');

      const token = localStorage.getItem('github_token');
      const headers = { 'Accept': 'application/vnd.github+json' };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-GitHub-Api-Version'] = '2022-11-28';
      }

      // Get repository contents (try main branch first)
      let branch = 'main';
      let response = await fetch(`https://api.github.com/repos/${fullName}/contents?ref=main`, { headers });

      if (!response.ok) {
        // Try master branch
        branch = 'master';
        response = await fetch(`https://api.github.com/repos/${fullName}/contents?ref=master`, { headers });
      }

      if (!response.ok) {
        this.panel.hideLoadingOverlay();
        throw new Error('Nepodařilo se načíst obsah repozitáře');
      }

      const rootFiles = await response.json();

      // Load all files from root directory
      const allFiles = [];

      for (const file of rootFiles) {
        if (file.type === 'file' && !file.name.startsWith('.')) {
          if (this.isTextFile(file.name)) {
            try {
              const contentResponse = await fetch(file.download_url);
              if (contentResponse.ok) {
                const content = await contentResponse.text();
                allFiles.push({
                  name: file.name,
                  content: content,
                  path: file.path
                });
              }
            } catch (err) {
              console.warn(`⚠️ Nepodařilo se načíst soubor ${file.name}:`, err);
            }
          }
        }
      }

      this.panel.hideLoadingOverlay();

      if (allFiles.length === 0) {
        throw new Error('V repozitáři nejsou žádné načitatelné soubory');
      }

      console.log(`📦 Načteno ${allFiles.length} souborů z ${repoName}`);

      // Check if there are existing files
      const existingTabs = state.get('files.tabs') || [];
      const hasExistingFiles = existingTabs.length > 0;

      if (hasExistingFiles) {
        this.showRepoLoadOptions(repoName, allFiles);
      } else {
        // Empty project - load directly
        eventBus.emit('github:project:loaded', {
          name: repoName,
          files: allFiles
        });

        eventBus.emit('toast:show', {
          message: `✅ Načten repozitář ${repoName} (${allFiles.length} souborů)`,
          type: 'success',
          duration: 3000
        });
      }

    } catch (error) {
      this.panel.hideLoadingOverlay();
      throw new Error('Nepodařilo se načíst repozitář: ' + error.message);
    }
  }

  /**
   * Show repo load options modal
   */
  showRepoLoadOptions(repoName, allFiles) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333;">
          <h3 style="margin: 0; color: #ffffff; font-size: 18px;">📥 Načíst repozitář ${repoName}</h3>
        </div>
        <div class="modal-body" style="padding: 25px;">
          <p style="margin-bottom: 20px; color: #cccccc; line-height: 1.6;">
            Načteno <strong>${allFiles.length} souborů</strong>. Už máte otevřené soubory. Co chcete udělat?
          </p>
          <div style="display: grid; gap: 12px;">
            <button id="replaceAllFiles" style="padding: 14px; background: #0066cc; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
              🔄 Nahradit všechny soubory
            </button>
            <button id="addToExisting" style="padding: 14px; background: #242424; color: #ffffff; border: 2px solid #333; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
              ➕ Přidat k existujícím
            </button>
            <button id="cancelRepoLoad" style="padding: 14px; background: transparent; color: #888888; border: 1px solid #333; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
              ❌ Zrušit
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('#replaceAllFiles').addEventListener('click', async () => {
      const success = await SafeOps.safeBatch(async () => {
        eventBus.emit('github:project:loaded', {
          name: repoName,
          files: allFiles
        });
      }, 'Replace all GitHub files');

      if (success) {
        eventBus.emit('toast:show', {
          message: `✅ Nahrazeno ${allFiles.length} souborů z ${repoName}`,
          type: 'success',
          duration: 3000
        });
      } else {
        eventBus.emit('toast:show', {
          message: `❌ Chyba při nahrávání souborů`,
          type: 'error',
          duration: 3000
        });
      }
      closeModal();
    });

    modal.querySelector('#addToExisting').addEventListener('click', async () => {
      const success = await SafeOps.safeTransaction(async () => {
        const existingTabs = state.get('files.tabs') || [];
        let nextId = state.get('files.nextId') || 1;

        const newTabs = [];
        allFiles.forEach(file => {
          newTabs.push({
            id: nextId++,
            name: file.name,
            content: file.content,
            modified: false,
            type: this.getFileType(file.name),
            path: file.path
          });
        });

        const allTabs = [...existingTabs, ...newTabs];
        state.set('files.tabs', allTabs);
        state.set('files.nextId', nextId);

        if (newTabs.length > 0) {
          state.set('files.active', newTabs[0].id);
          eventBus.emit('editor:setCode', {
            code: newTabs[0].content,
            skipStateUpdate: false,
            force: true
          });
        }
      }, 'Add GitHub files to existing');

      if (success) {
        eventBus.emit('sidebar:show');
        eventBus.emit('files:changed');

        eventBus.emit('toast:show', {
          message: `✅ Přidáno ${allFiles.length} souborů z ${repoName}`,
          type: 'success',
          duration: 3000
        });
      } else {
        eventBus.emit('toast:show', {
          message: `❌ Chyba při přidávání souborů`,
          type: 'error',
          duration: 3000
        });
      }
      closeModal();
    });

    modal.querySelector('#cancelRepoLoad').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  /**
   * Load GitHub code file
   */
  async loadGitHubCode(url, name, isSingleFile) {
    if (isSingleFile) {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
      if (!match) {
        throw new Error('Neplatná URL GitHub souboru');
      }

      const [, owner, repo, branch, path] = match;
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error('Nepodařilo se načíst soubor z GitHub');
      }

      const code = await response.text();
      await this.handleGitHubCodeLoad(code, name);
    }
  }

  /**
   * Handle GitHub code load with options
   */
  async handleGitHubCodeLoad(code, fileName) {
    const currentCode = state.get('editor.code') || '';
    const hasCode = currentCode.trim().length > 0;

    if (hasCode) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; overflow: hidden;">
          <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #333;">
            <h3 style="margin: 0; color: #ffffff; font-size: 18px;">📥 Načíst kód z GitHub</h3>
          </div>
          <div class="modal-body" style="padding: 25px;">
            <p style="margin-bottom: 20px; color: #cccccc; line-height: 1.6;">
              V editoru už máte kód. Co chcete udělat?
            </p>
            <div style="display: grid; gap: 12px;">
              <button id="replaceCode" style="padding: 14px; background: #0066cc; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
                🔄 Nahradit aktuální kód
              </button>
              <button id="createNewFile" style="padding: 14px; background: #242424; color: #ffffff; border: 2px solid #333; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
                ➕ Vytvořit nový soubor
              </button>
              <button id="cancelLoad" style="padding: 14px; background: transparent; color: #888888; border: 1px solid #333; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">
                ❌ Zrušit
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      return new Promise((resolve) => {
        const closeModal = () => {
          modal.remove();
          resolve();
        };

        modal.querySelector('#replaceCode').addEventListener('click', () => {
          const activeFileId = state.get('files.active');
          if (activeFileId) {
            const tabs = state.get('files.tabs') || [];
            const updatedTabs = tabs.map(f =>
              f.id === activeFileId ? { ...f, content: code, modified: false } : f
            );
            state.set('files.tabs', [...updatedTabs]);
          }

          eventBus.emit('editor:replaceAll', { code, force: true });

          eventBus.emit('toast:show', {
            message: `✅ Kód byl nahrazen z ${fileName}`,
            type: 'success',
            duration: 2000
          });
          closeModal();
        });

        modal.querySelector('#createNewFile').addEventListener('click', () => {
          eventBus.emit('file:create', { name: fileName, content: code });
          eventBus.emit('toast:show', {
            message: `✅ Vytvořen nový soubor: ${fileName}`,
            type: 'success'
          });
          closeModal();
        });

        modal.querySelector('#cancelLoad').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
      });
    } else {
      const activeFileId = state.get('files.active');
      if (activeFileId) {
        const tabs = state.get('files.tabs') || [];
        const updatedTabs = tabs.map(f =>
          f.id === activeFileId ? { ...f, content: code, modified: false } : f
        );
        state.set('files.tabs', [...updatedTabs]);
      }

      eventBus.emit('editor:replaceAll', { code, force: true });

      eventBus.emit('toast:show', {
        message: `✅ Načten kód z ${fileName}`,
        type: 'success',
        duration: 2000
      });
    }
  }

  /**
   * Clone repository
   */
  cloneRepo() {
    const url = prompt('URL GitHub repozitáře:');
    if (url) {
      eventBus.emit('github:clone', { url });
    }
  }

  /**
   * Create Gist
   */
  createGist() {
    const code = state.get('editor.content') || '';
    const description = prompt('Popis Gistu:');

    if (description !== null) {
      eventBus.emit('github:createGist', {
        code,
        description,
        filename: 'index.html'
      });
      eventBus.emit('toast:show', {
        message: 'Gist byl vytvořen',
        type: 'success'
      });
    }
  }

  /**
   * Get stored GitHub token
   */
  getStoredToken() {
    return localStorage.getItem('github_token') || '';
  }

  /**
   * Save GitHub token
   */
  saveGitHubToken(modal) {
    const tokenInput = modal.element.querySelector('#githubToken');
    if (!tokenInput) return;

    const token = tokenInput.value.trim();

    if (!token) {
      eventBus.emit('toast:show', {
        message: 'Zadejte GitHub token',
        type: 'error'
      });
      return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      eventBus.emit('toast:show', {
        message: 'Neplatný formát tokenu. Token by měl začínat ghp_ nebo github_pat_',
        type: 'warning'
      });
    }

    localStorage.setItem('github_token', token);
    this.checkGitHubConnection(modal);

    eventBus.emit('toast:show', {
      message: 'GitHub token byl uložen',
      type: 'success'
    });
  }

  /**
   * Check GitHub connection status
   */
  checkGitHubConnection(modal) {
    const token = this.getStoredToken();
    const statusElement = modal?.element?.querySelector('#githubConnected');

    if (statusElement) {
      if (token) {
        statusElement.textContent = '✅ Připojeno';
        statusElement.style.color = '#10b981';
      } else {
        statusElement.textContent = '❌ Nepřipojeno';
        statusElement.style.color = '#ef4444';
      }
    }
  }

  /**
   * Initiate GitHub OAuth
   */
  async initiateGitHubOAuth() {
    eventBus.emit('toast:show', {
      message: 'Zahajuji GitHub přihlášení...',
      type: 'info'
    });

    const result = await this.showGitHubLoginModal();
    if (!result || !result.username) return;

    localStorage.setItem('github_username', result.username);
    if (result.token) {
      localStorage.setItem('github_token', result.token);
    }

    eventBus.emit('toast:show', {
      message: 'Připojeno jako @' + result.username + (result.token ? '' : '. Nezapomeňte nastavit token pro API přístup.'),
      type: 'success'
    });

    if (this.panel.modal) {
      this.checkGitHubConnection(this.panel.modal);
    }
  }

  /**
   * Show GitHub login modal
   */
  showGitHubLoginModal() {
    return new Promise((resolve) => {
      const existingModal = document.querySelector('.github-login-modal');
      if (existingModal) {
        existingModal.remove();
      }

      const modal = document.createElement('div');
      modal.className = 'modal-overlay github-login-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              Přihlášení na GitHub
            </h2>
            <button class="modal-close" aria-label="Zavřít">&times;</button>
          </div>
          <div class="modal-body">
            <p class="modal-description" style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
              💡 V produkční verzi by se zde otevřelo OAuth okno od GitHubu.
              Pro demo zadejte své GitHub údaje:
            </p>
            <form id="githubLoginForm">
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="githubUsername" style="display: block; margin-bottom: 6px; font-weight: 500;">GitHub uživatelské jméno</label>
                <input
                  type="text"
                  id="githubUsername"
                  name="github-user"
                  placeholder="např. octocat"
                  required
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  style="width: 100%; padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px;"
                />
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="githubToken" style="display: block; margin-bottom: 6px; font-weight: 500;">Personal Access Token (volitelné)</label>
                <input
                  type="password"
                  id="githubToken"
                  name="github-token"
                  placeholder="ghp_xxxxxxxxxxxx"
                  autocomplete="new-password"
                  style="width: 100%; padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 6px; color: var(--text-primary); font-size: 14px;"
                />
                <small style="display: block; margin-top: 6px; font-size: 12px; color: var(--text-secondary);">
                  Pro API přístup. <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--primary);">Vytvořit token</a>
                </small>
              </div>
              <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 15px; border-top: 1px solid var(--border);">
                <button type="button" class="btn btn-secondary" data-action="cancel" style="padding: 10px 20px; border: none; border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; min-width: 44px; min-height: 44px;">Zrušit</button>
                <button type="submit" class="btn btn-primary" style="padding: 10px 20px; border: none; border-radius: 6px; background: var(--primary); color: white; cursor: pointer; min-width: 44px; min-height: 44px;">Přihlásit</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = (result = null) => {
        modal.classList.add('closing');
        setTimeout(() => {
          modal.remove();
          document.removeEventListener('keydown', escHandler);
          resolve(result);
        }, 300);
      };

      modal.querySelector('.modal-content')?.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      modal.querySelector('.modal-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });

      modal.querySelector('[data-action="cancel"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      document.addEventListener('keydown', escHandler);

      modal.querySelector('#githubLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = modal.querySelector('#githubUsername').value.trim();
        const token = modal.querySelector('#githubToken').value.trim();
        if (username) {
          closeModal({ username, token });
        }
      });

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);
      setTimeout(() => modal.querySelector('#githubUsername').focus(), 100);
    });
  }

  /**
   * Show repository manager (simplified stub - full implementation in AIPanel)
   */
  async showRepoManager() {
    const token = this.getStoredToken();
    if (!token) {
      eventBus.emit('toast:show', {
        message: 'Nejprve nastavte GitHub token',
        type: 'error'
      });
      return;
    }

    eventBus.emit('toast:show', {
      message: 'Repository Manager - funkce bude implementována v další fázi refaktoringu',
      type: 'info'
    });
  }

  /**
   * Utility: Get file type from name
   */
  getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const types = {
      html: 'html', htm: 'html',
      css: 'css',
      js: 'javascript', jsx: 'javascript',
      ts: 'typescript', tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      py: 'python',
      java: 'java',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      c: 'c', cpp: 'cpp', h: 'c'
    };
    return types[ext] || 'text';
  }

  /**
   * Utility: Check if file is text file
   */
  isTextFile(fileName) {
    const textExtensions = [
      '.html', '.htm', '.css', '.js', '.json', '.txt', '.md',
      '.xml', '.svg', '.py', '.java', '.c', '.cpp', '.h',
      '.php', '.rb', '.go', '.rs', '.ts', '.jsx', '.tsx',
      '.vue', '.yml', '.yaml', '.toml', '.ini', '.cfg'
    ];
    return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }
}
