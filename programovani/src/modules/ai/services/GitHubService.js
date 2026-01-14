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
   * GitHub Device Flow OAuth
   * Používá Device Authorization Grant - funguje bez backendu
   * Uživatel dostane kód, jde na github.com/login/device a zadá ho
   */

  // GitHub OAuth App Client ID (veřejné, bezpečné sdílet)
  // Pro vlastní app: https://github.com/settings/applications/new
  GITHUB_CLIENT_ID = 'Ov23liUGAmK0plc9FgLL'; // Výchozí demo client ID

  /**
   * Initiate GitHub Device Flow OAuth
   */
  async initiateGitHubOAuth() {
    // Zobraz modal s možností volby
    const choice = await this.showAuthMethodModal();

    if (choice === 'device-flow') {
      await this.startDeviceFlow();
    } else if (choice === 'token') {
      await this.authenticateWithToken();
    }
  }

  /**
   * Zobrazí modal pro výběr metody autentizace
   */
  showAuthMethodModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay github-login-modal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #333;">
            <h2 style="display: flex; align-items: center; gap: 12px; margin: 0; font-size: 20px;">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 32px; height: 32px;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Přihlásit se na GitHub
            </h2>
            <button class="modal-close" aria-label="Zavřít" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); padding: 4px; line-height: 1;">×</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <p style="margin: 0 0 20px; color: #8b949e; font-size: 14px; line-height: 1.6;">
              Vyberte způsob přihlášení k vašemu GitHub účtu:
            </p>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Device Flow - doporučeno -->
              <button id="deviceFlowBtn" style="
                display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px;
                background: linear-gradient(135deg, #238636 0%, #2ea043 100%);
                border: none; border-radius: 12px; cursor: pointer; text-align: left;
                transition: transform 0.2s, box-shadow 0.2s;
              ">
                <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 10px; flex-shrink: 0;">
                  <svg viewBox="0 0 24 24" fill="white" style="width: 24px; height: 24px;">
                    <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 2c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9zm0 3a1 1 0 00-1 1v5a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L13 11.586V7a1 1 0 00-1-1z"/>
                  </svg>
                </div>
                <div>
                  <div style="color: white; font-weight: 700; font-size: 16px; margin-bottom: 4px;">
                    🔐 Device Flow OAuth
                    <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">Doporučeno</span>
                  </div>
                  <div style="color: rgba(255,255,255,0.85); font-size: 13px; line-height: 1.4;">
                    Otevře GitHub v prohlížeči kde zadáte kód.<br>
                    Bezpečné, žádné kopírování tokenů.
                  </div>
                </div>
              </button>

              <!-- Token metoda -->
              <button id="tokenBtn" style="
                display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px;
                background: #21262d; border: 1px solid #30363d; border-radius: 12px;
                cursor: pointer; text-align: left; transition: border-color 0.2s;
              ">
                <div style="background: #30363d; padding: 10px; border-radius: 10px; flex-shrink: 0;">
                  <svg viewBox="0 0 24 24" fill="#8b949e" style="width: 24px; height: 24px;">
                    <path d="M15 7h1a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2h1m4-4h-4a1 1 0 00-1 1v2a1 1 0 001 1h4a1 1 0 001-1V4a1 1 0 00-1-1z"/>
                  </svg>
                </div>
                <div>
                  <div style="color: #c9d1d9; font-weight: 600; font-size: 15px; margin-bottom: 4px;">
                    🔑 Personal Access Token
                  </div>
                  <div style="color: #8b949e; font-size: 13px; line-height: 1.4;">
                    Zadejte token ručně.<br>
                    Vyžaduje vytvoření tokenu na GitHubu.
                  </div>
                </div>
              </button>
            </div>

            <button id="cancelBtn" style="
              width: 100%; margin-top: 16px; padding: 12px;
              background: transparent; border: 1px solid #30363d; border-radius: 8px;
              color: #8b949e; cursor: pointer; font-size: 14px;
            ">Zrušit</button>
          </div>
        </div>
      `;

      const closeModal = (result = null) => {
        modal.remove();
        resolve(result);
      };

      modal.querySelector('#deviceFlowBtn').addEventListener('click', () => closeModal('device-flow'));
      modal.querySelector('#tokenBtn').addEventListener('click', () => closeModal('token'));
      modal.querySelector('#cancelBtn').addEventListener('click', () => closeModal(null));
      modal.querySelector('.modal-close').addEventListener('click', () => closeModal(null));
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(null); });

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);
    });
  }

  /**
   * Start GitHub Device Flow
   */
  async startDeviceFlow() {
    const loadingModal = this.showDeviceFlowModal('loading');

    try {
      // Krok 1: Požádej o device code
      // Poznámka: GitHub CORS blokuje přímé volání, použijeme proxy nebo popup
      const deviceCodeResponse = await this.requestDeviceCode();

      // Krok 2: Zobraz kód uživateli
      loadingModal.remove();
      const authModal = this.showDeviceFlowModal('code', deviceCodeResponse);

      // Krok 3: Otevři GitHub v novém okně
      window.open(deviceCodeResponse.verification_uri, '_blank', 'width=600,height=700');

      // Krok 4: Polluj pro token
      const token = await this.pollForToken(deviceCodeResponse, authModal);

      if (token) {
        // Ověř token a získej username
        const userData = await this.verifyToken(token);

        localStorage.setItem('github_token', token);
        localStorage.setItem('github_username', userData.login);

        authModal.remove();

        eventBus.emit('toast:show', {
          message: `✅ Přihlášen jako @${userData.login}`,
          type: 'success',
          duration: 3000
        });

        if (this.panel.modal) {
          this.checkGitHubConnection(this.panel.modal);
          const tokenInput = this.panel.modal.element?.querySelector('#githubToken');
          if (tokenInput) tokenInput.value = token;
        }
      }
    } catch (error) {
      loadingModal?.remove?.();
      console.error('Device Flow error:', error);

      // Fallback na token metodu
      eventBus.emit('toast:show', {
        message: '⚠️ Device Flow není dostupný, použijte token',
        type: 'warning',
        duration: 3000
      });

      await this.authenticateWithToken();
    }
  }

  /**
   * Request device code from GitHub
   */
  async requestDeviceCode() {
    // GitHub vyžaduje specifické hlavičky
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.GITHUB_CLIENT_ID,
        scope: 'repo gist delete_repo read:user'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get device code');
    }

    return response.json();
  }

  /**
   * Poll GitHub for access token
   */
  async pollForToken(deviceCode, modal) {
    const interval = deviceCode.interval || 5;
    const expiresIn = deviceCode.expires_in || 900;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        // Zkontroluj jestli nevypršel čas
        if (Date.now() - startTime > expiresIn * 1000) {
          reject(new Error('Authorization expired'));
          return;
        }

        // Zkontroluj jestli modal ještě existuje
        if (!document.body.contains(modal)) {
          resolve(null);
          return;
        }

        try {
          const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              client_id: this.GITHUB_CLIENT_ID,
              device_code: deviceCode.device_code,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
          });

          const data = await response.json();

          if (data.access_token) {
            resolve(data.access_token);
            return;
          }

          if (data.error === 'authorization_pending') {
            // Uživatel ještě neautorizoval, čekej
            setTimeout(poll, interval * 1000);
          } else if (data.error === 'slow_down') {
            // Zpomal polling
            setTimeout(poll, (interval + 5) * 1000);
          } else if (data.error === 'expired_token') {
            reject(new Error('Authorization expired'));
          } else if (data.error === 'access_denied') {
            reject(new Error('User denied access'));
          } else {
            setTimeout(poll, interval * 1000);
          }
        } catch (error) {
          // CORS error - fallback
          reject(error);
        }
      };

      setTimeout(poll, interval * 1000);
    });
  }

  /**
   * Verify token and get user info
   */
  async verifyToken(token) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    return response.json();
  }

  /**
   * Show Device Flow modal
   */
  showDeviceFlowModal(state, data = {}) {
    const existingModal = document.querySelector('.github-device-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay github-device-modal';

    if (state === 'loading') {
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
          <h3 style="margin: 0 0 10px; color: #c9d1d9;">Připravuji přihlášení...</h3>
          <p style="color: #8b949e; margin: 0;">Čekejte prosím</p>
        </div>
      `;
    } else if (state === 'code') {
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #333;">
            <h2 style="display: flex; align-items: center; gap: 10px; margin: 0;">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 28px; height: 28px;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Zadejte kód na GitHubu
            </h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">×</button>
          </div>
          <div class="modal-body" style="padding: 30px; text-align: center;">
            <p style="color: #8b949e; margin: 0 0 20px; font-size: 15px;">
              Otevřelo se okno GitHubu. Zadejte tento kód:
            </p>

            <div style="
              background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
              border: 2px solid #238636;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
            ">
              <div style="
                font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 8px;
                color: #58a6ff;
                text-shadow: 0 0 20px rgba(88, 166, 255, 0.3);
              ">${data.user_code || 'XXXX-XXXX'}</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
              <a href="${data.verification_uri || 'https://github.com/login/device'}"
                 target="_blank"
                 style="
                   display: flex; align-items: center; justify-content: center; gap: 8px;
                   padding: 14px 24px; background: #238636; color: white;
                   border-radius: 8px; font-weight: 600; text-decoration: none;
                   font-size: 15px;
                 ">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
                Otevřít github.com/login/device
              </a>

              <button onclick="navigator.clipboard.writeText('${data.user_code || ''}'); this.textContent='✓ Zkopírováno!'" style="
                padding: 12px; background: #21262d; border: 1px solid #30363d;
                border-radius: 8px; color: #8b949e; cursor: pointer; font-size: 14px;
              ">📋 Kopírovat kód</button>
            </div>

            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #30363d;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #8b949e; font-size: 13px;">
                <div class="loading-spinner" style="
                  width: 16px; height: 16px; border: 2px solid #30363d;
                  border-top-color: #58a6ff; border-radius: 50%;
                  animation: spin 1s linear infinite;
                "></div>
                Čekám na autorizaci...
              </div>
            </div>
          </div>
        </div>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      `;
    }

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    return modal;
  }

  /**
   * Authenticate with Personal Access Token
   */
  async authenticateWithToken() {
    const result = await this.showTokenInputModal();
    if (!result || !result.token) return;

    eventBus.emit('toast:show', {
      message: '🔄 Ověřuji token...',
      type: 'info'
    });

    try {
      const userData = await this.verifyToken(result.token);

      localStorage.setItem('github_token', result.token);
      localStorage.setItem('github_username', userData.login);

      eventBus.emit('toast:show', {
        message: `✅ Přihlášen jako @${userData.login}`,
        type: 'success',
        duration: 3000
      });

      if (this.panel.modal) {
        this.checkGitHubConnection(this.panel.modal);
        const tokenInput = this.panel.modal.element?.querySelector('#githubToken');
        if (tokenInput) tokenInput.value = result.token;
      }
    } catch (error) {
      eventBus.emit('toast:show', {
        message: `❌ Neplatný token: ${error.message}`,
        type: 'error',
        duration: 4000
      });
    }
  }

  /**
   * Show token input modal
   */
  showTokenInputModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay github-login-modal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
          <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid #333;">
            <h2 style="display: flex; align-items: center; gap: 10px; margin: 0;">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width: 28px; height: 28px;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Personal Access Token
            </h2>
            <button class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary);">×</button>
          </div>
          <div class="modal-body" style="padding: 24px;">
            <div style="background: #161b22; padding: 16px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #30363d;">
              <p style="margin: 0 0 12px; color: #8b949e; font-size: 14px;">
                🔐 Vytvořte Personal Access Token s oprávněními:
              </p>
              <code style="display: block; background: #0d1117; padding: 8px 12px; border-radius: 6px; color: #58a6ff; font-size: 12px;">
                repo, gist, delete_repo, read:user
              </code>
              <a href="https://github.com/settings/tokens/new?scopes=repo,gist,delete_repo,read:user&description=HTML%20Studio"
                 target="_blank"
                 style="display: inline-flex; align-items: center; gap: 6px; color: #58a6ff; font-size: 13px; margin-top: 12px; text-decoration: none;">
                📝 Vytvořit token →
              </a>
            </div>
            <form id="tokenForm">
              <input type="password" id="tokenInput" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required
                style="width: 100%; padding: 14px; background: #0d1117; border: 2px solid #30363d; border-radius: 8px; color: #c9d1d9; font-family: monospace; font-size: 14px; margin-bottom: 16px;"
              />
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button type="button" id="cancelBtn" style="padding: 12px 20px; background: #21262d; border: 1px solid #30363d; border-radius: 8px; color: #8b949e; cursor: pointer;">Zrušit</button>
                <button type="submit" style="padding: 12px 24px; background: #238636; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Přihlásit</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = (result = null) => {
        modal.remove();
        resolve(result);
      };

      modal.querySelector('.modal-close').addEventListener('click', () => closeModal());
      modal.querySelector('#cancelBtn').addEventListener('click', () => closeModal());
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

      modal.querySelector('#tokenForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const token = modal.querySelector('#tokenInput').value.trim();
        if (token) closeModal({ token });
      });

      document.body.appendChild(modal);
      setTimeout(() => {
        modal.classList.add('show');
        modal.querySelector('#tokenInput').focus();
      }, 10);
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

  // ============= Repository Manager Methods =============

  /**
   * Create repository manager content HTML
   */
  createRepoManagerContent() {
    const undoHistory = this.getUndoHistory();
    const redoHistory = this.getRedoHistory();

    return `
      <div class="repo-manager">
        <div class="repo-toolbar">
          <button class="repo-btn" id="createRepoBtn">
            <span class="icon">➕</span>
            <span>Vytvořit repozitář</span>
          </button>
          <button class="repo-btn" id="refreshReposBtn">
            <span class="icon">🔄</span>
            <span>Obnovit</span>
          </button>
          <div class="repo-history-btns">
            <button class="repo-btn" id="undoRepoActionBtn" ${undoHistory.length === 0 ? 'disabled' : ''}>
              <span class="icon">↩️</span>
              <span>Zpět (${undoHistory.length}/5)</span>
            </button>
            <button class="repo-btn" id="redoRepoActionBtn" ${redoHistory.length === 0 ? 'disabled' : ''}>
              <span class="icon">↪️</span>
              <span>Vpřed (${redoHistory.length})</span>
            </button>
          </div>
        </div>
        <div class="repo-search">
          <input type="text" id="repoSearchInput" placeholder="🔍 Hledat repozitář..." class="repo-search-input" />
        </div>
        <div class="repo-list" id="repoList">
          <div class="repo-loading">Načítám repozitáře...</div>
        </div>
      </div>
    `;
  }

  /**
   * Attach repository manager event handlers
   */
  attachRepoManagerHandlers(repoModal) {
    const createBtn = repoModal.element.querySelector('#createRepoBtn');
    const refreshBtn = repoModal.element.querySelector('#refreshReposBtn');
    const undoBtn = repoModal.element.querySelector('#undoRepoActionBtn');
    const redoBtn = repoModal.element.querySelector('#redoRepoActionBtn');
    const searchInput = repoModal.element.querySelector('#repoSearchInput');

    if (createBtn) createBtn.addEventListener('click', () => this.createRepository(repoModal));
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadRepositories(repoModal));
    if (undoBtn) undoBtn.addEventListener('click', () => this.undoLastRepoAction(repoModal));
    if (redoBtn) redoBtn.addEventListener('click', () => this.redoRepoAction(repoModal));
    if (searchInput) searchInput.addEventListener('input', (e) => this.filterRepositories(e.target.value, repoModal));
  }

  /**
   * Load repositories list
   */
  async loadRepositories(repoModal) {
    const repoList = repoModal.element.querySelector('#repoList');
    if (!repoList) return;

    repoList.innerHTML = '<div class="repo-loading">Načítám repozitáře...</div>';

    try {
      const username = localStorage.getItem('github_username') || 'user';
      const repos = this.getMockRepositories(username);

      if (repos.length === 0) {
        repoList.innerHTML = '<div class="repo-empty">Žádné repozitáře</div>';
        return;
      }

      repoList.innerHTML = repos.map(repo => this.createRepoItem(repo)).join('');

      // Attach delete handlers
      repoList.querySelectorAll('.repo-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteRepository(btn.dataset.repo, repoModal);
        });
      });

      // Attach repo click handlers
      repoList.querySelectorAll('.repo-item').forEach(item => {
        item.addEventListener('click', () => this.openRepository(item.dataset.repo));
      });
    } catch (error) {
      repoList.innerHTML = '<div class="repo-error">Chyba při načítání repozitářů</div>';
      console.error(error);
    }
  }

  /**
   * Get mock repositories (or from localStorage)
   */
  getMockRepositories(_username) {
    const stored = localStorage.getItem('github_repos');
    if (stored) return JSON.parse(stored);

    const mockRepos = [
      { name: 'my-website', description: 'Personal portfolio', stars: 5, private: false },
      { name: 'html-editor', description: 'Web-based HTML editor', stars: 12, private: false },
      { name: 'secret-project', description: 'Private repository', stars: 0, private: true }
    ];
    localStorage.setItem('github_repos', JSON.stringify(mockRepos));
    return mockRepos;
  }

  /**
   * Create repository item HTML
   */
  createRepoItem(repo) {
    const privateLabel = repo.private ? '<span class="repo-badge private">🔒 Private</span>' : '';
    return `
      <div class="repo-item" data-repo="${repo.name}">
        <div class="repo-icon">📁</div>
        <div class="repo-info">
          <div class="repo-name">${repo.name}</div>
          <div class="repo-description">${repo.description || 'Bez popisu'}</div>
          <div class="repo-meta">${privateLabel}<span class="repo-stars">⭐ ${repo.stars}</span></div>
        </div>
        <button class="repo-delete-btn" data-repo="${repo.name}">🗑️</button>
      </div>
    `;
  }

  /**
   * Create a new repository
   */
  async createRepository(repoModal) {
    const name = prompt('Název repozitáře:');
    if (!name) return;

    const description = prompt('Popis (volitelné):') || '';
    const isPrivate = confirm('Vytvořit jako privátní repozitář?');

    const repos = this.getMockRepositories();
    const newRepo = { name, description, stars: 0, private: isPrivate };

    this.storeUndoAction('create', newRepo);
    repos.unshift(newRepo);
    localStorage.setItem('github_repos', JSON.stringify(repos));

    eventBus.emit('toast:show', { message: `Repozitář "${name}" vytvořen`, type: 'success' });
    await this.loadRepositories(repoModal);
    this.updateHistoryButtons(repoModal);
  }

  /**
   * Delete a repository
   */
  async deleteRepository(repoName, repoModal) {
    const repos = this.getMockRepositories();
    const repoIndex = repos.findIndex(r => r.name === repoName);
    if (repoIndex === -1) return;

    const lastChars = repoName.slice(-2);
    const confirmation = prompt(
      `Pro potvrzení smazání doplňte poslední 2 znaky názvu repozitáře:\n\n` +
      `Repozitář: ${repoName}\nZadejte: **`
    );

    if (confirmation !== lastChars) {
      eventBus.emit('toast:show', { message: 'Smazání zrušeno - špatné potvrzení', type: 'warning' });
      return;
    }

    const deletedRepo = repos[repoIndex];
    this.storeUndoAction('delete', deletedRepo);
    repos.splice(repoIndex, 1);
    localStorage.setItem('github_repos', JSON.stringify(repos));

    eventBus.emit('toast:show', { message: `Repozitář "${repoName}" byl smazán`, type: 'success' });
    await this.loadRepositories(repoModal);
    this.updateHistoryButtons(repoModal);
  }

  /**
   * Get undo history
   */
  getUndoHistory() {
    const history = localStorage.getItem('github_undo_history');
    return history ? JSON.parse(history) : [];
  }

  /**
   * Get redo history
   */
  getRedoHistory() {
    const history = localStorage.getItem('github_redo_history');
    return history ? JSON.parse(history) : [];
  }

  /**
   * Store undo action
   */
  storeUndoAction(action, data) {
    const history = this.getUndoHistory();
    history.push({ action, data, timestamp: Date.now() });
    if (history.length > 5) history.shift();
    localStorage.setItem('github_undo_history', JSON.stringify(history));
    localStorage.removeItem('github_redo_history');
  }

  /**
   * Undo last repository action
   */
  async undoLastRepoAction(repoModal) {
    const undoHistory = this.getUndoHistory();
    if (undoHistory.length === 0) return;

    const lastAction = undoHistory.pop();
    const { action, data } = lastAction;
    const repos = this.getMockRepositories();

    const redoHistory = this.getRedoHistory();
    redoHistory.push(lastAction);
    localStorage.setItem('github_redo_history', JSON.stringify(redoHistory));

    if (action === 'create') {
      const index = repos.findIndex(r => r.name === data.name);
      if (index !== -1) repos.splice(index, 1);
    } else if (action === 'delete') {
      repos.unshift(data);
    }

    localStorage.setItem('github_repos', JSON.stringify(repos));
    localStorage.setItem('github_undo_history', JSON.stringify(undoHistory));

    eventBus.emit('toast:show', { message: `Akce vrácena zpět (${undoHistory.length} zbývá)`, type: 'success' });
    await this.loadRepositories(repoModal);
    this.updateHistoryButtons(repoModal);
  }

  /**
   * Redo repository action
   */
  async redoRepoAction(repoModal) {
    const redoHistory = this.getRedoHistory();
    if (redoHistory.length === 0) return;

    const lastAction = redoHistory.pop();
    const { action, data } = lastAction;
    const repos = this.getMockRepositories();

    const undoHistory = this.getUndoHistory();
    undoHistory.push(lastAction);
    localStorage.setItem('github_undo_history', JSON.stringify(undoHistory));

    if (action === 'create') {
      repos.unshift(data);
    } else if (action === 'delete') {
      const index = repos.findIndex(r => r.name === data.name);
      if (index !== -1) repos.splice(index, 1);
    }

    localStorage.setItem('github_repos', JSON.stringify(repos));
    localStorage.setItem('github_redo_history', JSON.stringify(redoHistory));

    eventBus.emit('toast:show', { message: `Akce obnovena (${redoHistory.length} zbývá vpřed)`, type: 'success' });
    await this.loadRepositories(repoModal);
    this.updateHistoryButtons(repoModal);
  }

  /**
   * Update history buttons state
   */
  updateHistoryButtons(repoModal) {
    const undoHistory = this.getUndoHistory();
    const redoHistory = this.getRedoHistory();

    const undoBtn = repoModal.element.querySelector('#undoRepoActionBtn');
    const redoBtn = repoModal.element.querySelector('#redoRepoActionBtn');

    if (undoBtn) {
      undoBtn.disabled = undoHistory.length === 0;
      undoBtn.querySelector('span:last-child').textContent = `Zpět (${undoHistory.length}/5)`;
    }
    if (redoBtn) {
      redoBtn.disabled = redoHistory.length === 0;
      redoBtn.querySelector('span:last-child').textContent = `Vpřed (${redoHistory.length})`;
    }
  }

  /**
   * Filter repositories by search query
   */
  filterRepositories(query, repoModal) {
    const repoItems = repoModal.element.querySelectorAll('.repo-item');
    const lowerQuery = query.toLowerCase();

    repoItems.forEach(item => {
      const repoName = item.dataset.repo.toLowerCase();
      const description = item.querySelector('.repo-description')?.textContent.toLowerCase() || '';
      item.style.display = (repoName.includes(lowerQuery) || description.includes(lowerQuery)) ? 'flex' : 'none';
    });
  }

  /**
   * Open repository
   */
  openRepository(repoName) {
    eventBus.emit('toast:show', { message: `Otevírám repozitář ${repoName}...`, type: 'info' });
  }
}
