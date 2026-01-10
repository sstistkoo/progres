/**
 * CodeEditorService.js
 * Service pro editaci kódu - SEARCH/REPLACE, EDIT:LINES, validace, fuzzy matching
 */

import { eventBus } from '../../../core/events.js';
import { state } from '../../../core/state.js';
import { SafeOps } from '../../../core/safeOps.js';

export class CodeEditorService {
  constructor(panel) {
    this.panel = panel;
    console.log('[CodeEditorService] Initialized');
  }

  /**
   * Parse VS Code style SEARCH/REPLACE blocks
   */
  parseSearchReplaceInstructions(response) {
    const instructions = [];

    // Pattern: ```SEARCH ... ``` ```REPLACE ... ```
    const pattern = /```\s*SEARCH\s*\n([\s\S]*?)\n```\s*```\s*REPLACE\s*\n([\s\S]*?)\n```/gi;
    let match;

    while ((match = pattern.exec(response)) !== null) {
      const searchCode = match[1].trim();
      const replaceCode = match[2].trim();

      // Validate search code
      if (!searchCode || searchCode === '...' || searchCode.includes('...existing code...')) {
        console.warn('[CodeEditor] Invalid search code (empty or placeholder):', searchCode);
        continue;
      }

      instructions.push({
        searchCode,
        replaceCode,
        type: 'search-replace'
      });
    }

    return instructions;
  }

  /**
   * Parse legacy EDIT:LINES format
   */
  parseEditInstructions(response) {
    const instructions = [];

    // Multiple patterns
    const patterns = [
      // Pattern 1: EDIT:LINES 10-15
      /EDIT:LINES\s+(\d+)-(\d+)\s*\n```(?:javascript|js|html|css|python|java|cpp|c)?\n([\s\S]*?)\n```/gi,
      // Pattern 2: Edit lines 10-15:
      /Edit\s+lines?\s+(\d+)-(\d+):\s*\n```(?:javascript|js|html|css|python|java|cpp|c)?\n([\s\S]*?)\n```/gi,
      // Pattern 3: Replace lines 10-15 with:
      /Replace\s+lines?\s+(\d+)-(\d+)\s+with:\s*\n```(?:javascript|js|html|css|python|java|cpp|c)?\n([\s\S]*?)\n```/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const startLine = parseInt(match[1], 10) - 1; // Convert to 0-based
        const endLine = parseInt(match[2], 10) - 1;
        const newCode = match[3].trim();

        instructions.push({
          startLine,
          endLine,
          newCode,
          type: 'line-edit'
        });
      }
    });

    return instructions;
  }

  /**
   * Apply line-based edits (EDIT:LINES)
   * Uses fuzzy matching and aggressive normalization
   */
  applyLineEdits(edits) {
    const currentCode = SafeOps.safe(
      () => state.get('editor.code') || '',
      'Chyba při získávání kódu z editoru'
    );

    if (!currentCode) {
      return { success: false, message: '❌ Editor je prázdný' };
    }

    // Save original code for potential rollback
    const originalCode = currentCode;

    let successCount = 0;
    let failCount = 0;
    const details = [];

    // Sort edits by line number descending to avoid line number shifts
    const sortedEdits = [...edits].sort((a, b) => b.startLine - a.startLine);

    for (const edit of sortedEdits) {
      // Re-read code after each change
      const code = state.get('editor.code') || '';
      const lines = code.split('\n');

      // Extract old code from specified lines
      const oldCode = lines.slice(edit.startLine, edit.endLine + 1).join('\n');

      // Aggressive normalization (remove ALL whitespace for comparison)
      const oldNormalized = oldCode.replace(/\s+/g, '');
      const newNormalized = edit.newCode.replace(/\s+/g, '');

      // If exactly matches, replace directly
      if (oldNormalized === newNormalized) {
        details.push(`⏭️ Řádky ${edit.startLine + 1}-${edit.endLine + 1}: Již je stejné, přeskočeno`);
        continue;
      }

      // Check if old code exists at specified position
      const actualOldCode = lines.slice(edit.startLine, edit.endLine + 1).join('\n');
      const actualOldNormalized = actualOldCode.replace(/\s+/g, '');

      // If matches closely, replace
      if (actualOldNormalized === oldNormalized) {
        lines.splice(edit.startLine, edit.endLine - edit.startLine + 1, ...edit.newCode.split('\n'));
        const newCode = lines.join('\n');
        eventBus.emit('editor:setCode', { code: newCode });
        successCount++;
        details.push(`✅ Řádky ${edit.startLine + 1}-${edit.endLine + 1}: Změněno`);
        continue;
      }

      // Fuzzy search - try to find similar code nearby
      console.log(`[CodeEditor] Line edit mismatch, trying fuzzy search...`);

      // Search in wider range (±100 lines)
      const searchStart = Math.max(0, edit.startLine - 100);
      const searchEnd = Math.min(lines.length - 1, edit.endLine + 100);
      const searchRange = lines.slice(searchStart, searchEnd + 1);

      let bestMatch = null;
      let bestSimilarity = 0;
      const SIMILARITY_THRESHOLD = 0.70; // Lowered threshold

      // Try to find best match in search range
      for (let i = 0; i < searchRange.length; i++) {
        const rangeSize = edit.endLine - edit.startLine + 1;
        const offsetCode = searchRange.slice(i, i + rangeSize).join('\n');
        const offsetNormalized = offsetCode.replace(/\s+/g, '');

        const similarity = this.calculateSimilarity(offsetNormalized, oldNormalized);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = {
            startLine: searchStart + i,
            endLine: searchStart + i + rangeSize - 1,
            code: offsetCode
          };
        }
      }

      if (bestMatch && bestSimilarity >= SIMILARITY_THRESHOLD) {
        // Found good match - apply edit
        const currentLines = (state.get('editor.code') || '').split('\n');
        currentLines.splice(bestMatch.startLine, bestMatch.endLine - bestMatch.startLine + 1, ...edit.newCode.split('\n'));
        const newCode = currentLines.join('\n');
        eventBus.emit('editor:setCode', { code: newCode });
        successCount++;
        details.push(`✅ Řádky ${bestMatch.startLine + 1}-${bestMatch.endLine + 1}: Změněno (fuzzy match, ${Math.round(bestSimilarity * 100)}% shoda)`);
      } else {
        failCount++;
        details.push(`❌ Řádky ${edit.startLine + 1}-${edit.endLine + 1}: Kód nenalezen (nejlepší shoda: ${Math.round(bestSimilarity * 100)}%)`);
      }
    }

    // State is updated automatically by editor:setCode event

    const message = successCount > 0
      ? `✅ Aplikováno ${successCount}/${edits.length} změn\n\n${details.join('\n')}`
      : `❌ Nepodařilo se aplikovat žádnou změnu (${failCount}/${edits.length})\n\n${details.join('\n')}`;

    return {
      success: successCount > 0,
      message
    };
  }

  /**
   * Apply SEARCH/REPLACE edits
   * 3-phase approach: validation, conflict detection, application
   */
  applySearchReplaceEdits(edits) {
    const currentCode = SafeOps.safe(
      () => state.get('editor.code') || '',
      'Chyba při získávání kódu z editoru'
    );

    if (!currentCode) {
      return { success: false, message: '❌ Editor je prázdný' };
    }

    // Save original code for potential rollback
    const originalCode = currentCode;

    // ===== PHASE 1: BATCH VALIDATION =====
    console.log('[CodeEditor] Phase 1: Validating all edits...');
    const validatedEdits = [];
    const validationErrors = [];

    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      const searchCode = edit.searchCode;

      // Try exact match first
      let index = currentCode.indexOf(searchCode);

      if (index !== -1) {
        // Count occurrences
        const occurrences = this.countOccurrences(currentCode, searchCode);

        if (occurrences > 1) {
          validationErrors.push({
            index: i + 1,
            reason: `Kód se vyskytuje ${occurrences}x - nejednoznačné`,
            suggestion: null
          });
          continue;
        }

        validatedEdits.push({ ...edit, index, exact: true });
        continue;
      }

      // Try fuzzy search
      console.log(`[CodeEditor] Edit #${i + 1}: Exact match failed, trying fuzzy...`);
      const fuzzyResult = this.fuzzySearchCode(currentCode, searchCode);

      if (fuzzyResult.found) {
        validatedEdits.push({ ...edit, index: fuzzyResult.index, exact: false });
        console.log(`[CodeEditor] Edit #${i + 1}: Found via fuzzy search at index ${fuzzyResult.index}`);
        continue;
      }

      // Not found - try to suggest similar code
      const similarCode = this.findSimilarCode(currentCode, searchCode);
      validationErrors.push({
        index: i + 1,
        reason: 'Kód nenalezen',
        suggestion: similarCode
      });
    }

    // ===== PHASE 2: CONFLICT DETECTION =====
    const conflicts = this.detectEditConflicts(validatedEdits);

    if (conflicts.length > 0) {
      let message = `⚠️ Detekováno ${conflicts.length} konfliktů (překrývající se změny):\n\n`;
      conflicts.forEach(conflict => {
        message += `❌ Edit #${conflict.edit1} a #${conflict.edit2} se překrývají\n`;
      });
      return { success: false, message };
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      this.showValidationErrors(validationErrors);

      if (validatedEdits.length === 0) {
        return { success: false, message: `❌ Žádná změna nebyla aplikována (${validationErrors.length} chyb)` };
      }
    }

    // ===== PHASE 3: APPLY EDITS =====
    console.log('[CodeEditor] Phase 3: Applying validated edits...');

    // Sort by index descending to avoid position shifts
    validatedEdits.sort((a, b) => b.index - a.index);

    let code = currentCode;
    const appliedEdits = [];

    for (const edit of validatedEdits) {
      const before = code.substring(0, edit.index);
      const after = code.substring(edit.index + edit.searchCode.length);
      code = before + edit.replaceCode + after;

      // Calculate line:column for logging
      const lines = before.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;

      appliedEdits.push({
        position: `${line}:${column}`,
        exact: edit.exact
      });

      console.log(`[CodeEditor] Applied edit at ${line}:${column} (${edit.exact ? 'exact' : 'fuzzy'})`);
    }

    // Update editor
    eventBus.emit('editor:setCode', { code });

    // Generate success message
    let message = `✅ Aplikováno ${appliedEdits.length}/${edits.length} změn:\n\n`;
    appliedEdits.forEach((edit, i) => {
      const prefix = edit.exact ? '✅' : '⚠️ (fuzzy)';
      message += `${prefix} Edit #${i + 1} at line:col ${edit.position}\n`;
    });

    if (validationErrors.length > 0) {
      message += `\n⚠️ ${validationErrors.length} změn nebylo aplikováno (viz výše)`;
    }

    return { success: true, message };
  }

  /**
   * Fuzzy search with whitespace normalization
   */
  fuzzySearchCode(code, search) {
    try {
      // Normalize whitespace
      const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();

      const codeNormalized = normalizeWhitespace(code);
      const searchNormalized = normalizeWhitespace(search);

      // Build regex from search pattern (escape special chars)
      const searchPattern = searchNormalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(searchPattern, 'i');

      const match = regex.exec(codeNormalized);

      if (match) {
        // Find original position by counting characters up to match
        let originalIndex = 0;
        let normalizedIndex = 0;

        while (normalizedIndex < match.index && originalIndex < code.length) {
          if (!/\s/.test(code[originalIndex])) {
            normalizedIndex++;
          }
          originalIndex++;
        }

        return { found: true, index: originalIndex };
      }

      return { found: false, index: -1 };
    } catch (error) {
      console.error('[CodeEditor] Fuzzy search error:', error);
      return { found: false, index: -1 };
    }
  }

  /**
   * Find similar code for suggestions
   */
  findSimilarCode(code, search, maxSuggestions = 1) {
    const lines = code.split('\n');
    const searchLines = search.split('\n');
    const searchFirstLine = searchLines[0].trim();

    // Find lines that contain part of the search
    const candidates = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes(searchFirstLine) || searchFirstLine.includes(line)) {
        // Extract context (3 lines before and after)
        const start = Math.max(0, i - 3);
        const end = Math.min(lines.length, i + 4);
        const contextLines = lines.slice(start, end);
        candidates.push(contextLines.join('\n'));
      }
    }

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Count occurrences of search string in code
   */
  countOccurrences(code, search) {
    let count = 0;
    let pos = 0;
    while ((pos = code.indexOf(search, pos)) !== -1) {
      count++;
      pos += search.length;
    }
    return count;
  }

  /**
   * Detect overlapping edits (conflicts)
   */
  detectEditConflicts(edits) {
    const conflicts = [];

    for (let i = 0; i < edits.length; i++) {
      for (let j = i + 1; j < edits.length; j++) {
        const edit1 = edits[i];
        const edit2 = edits[j];

        const end1 = edit1.index + edit1.searchCode.length;
        const end2 = edit2.index + edit2.searchCode.length;

        // Check if ranges overlap
        if (
          (edit1.index <= edit2.index && end1 > edit2.index) ||
          (edit2.index <= edit1.index && end2 > edit1.index)
        ) {
          conflicts.push({
            edit1: i + 1,
            edit2: j + 1,
            range1: [edit1.index, end1],
            range2: [edit2.index, end2]
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Show validation errors with suggestions
   */
  showValidationErrors(errors) {
    let message = `⚠️ Některé změny nelze aplikovat (${errors.length}):\n\n`;

    errors.forEach(err => {
      message += `❌ Edit #${err.index}: ${err.reason}\n`;
      if (err.suggestion) {
        message += `💡 Možná jste mysleli:\n\`\`\`\n${err.suggestion.substring(0, 100)}...\n\`\`\`\n`;
      }
      message += '\n';
    });

    message += `💡 Tip: Zkuste "zobraz aktuální kód" a zkuste znovu.`;

    this.panel.addChatMessage('system', message);
  }

  /**
   * Add line numbers to code
   * Handles both normal and truncated code
   */
  addLineNumbers(code, metadata = null) {
    if (!code) return '';
    const lines = code.split('\n');

    if (!metadata || !metadata.isTruncated) {
      // Normal numbering
      return lines.map((line, i) => `${String(i + 1).padStart(4, ' ')}| ${line}`).join('\n');
    }

    // Truncated code - preserve original line numbers
    const result = [];
    let currentLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is the truncation marker
      if (line.includes('🔽 ZKRÁCENO')) {
        result.push(`     | ${line}`);
        // Add warning about missing lines
        const missingStart = metadata.topLinesCount + 1;
        const missingEnd = metadata.bottomStartLine - 1;
        result.push(`     | ⚠️ ŘÁDKY ${missingStart}-${missingEnd} NEJSOU VIDITELNÉ! ⚠️`);
        result.push(`     | ⚠️ PRO EDITACI TĚCHTO ŘÁDKŮ POŽÁDEJ O ZOBRAZENÍ CELÉHO SOUBORU! ⚠️`);
        // Jump to bottom section line numbers
        currentLine = metadata.bottomStartLine;
      } else {
        result.push(`${String(currentLine).padStart(4, ' ')}| ${line}`);
        currentLine++;
      }
    }

    return result.join('\n');
  }

  /**
   * Truncate code intelligently - show beginning, end, and indicate middle is truncated
   * Returns object with code and metadata about line numbers
   */
  truncateCodeIntelligently(code, maxChars = 3000) {
    if (!code || code.length <= maxChars) {
      return { code, isTruncated: false, topLinesCount: 0, bottomStartLine: 0 };
    }

    const lines = code.split('\n');
    const totalLines = lines.length;

    // Calculate how many chars we can allocate to top and bottom
    const charsPerSection = Math.floor(maxChars / 2) - 100; // Reserve space for truncation marker

    // Collect top lines
    let topLines = [];
    let topChars = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for newline
      if (topChars + lineLength > charsPerSection) break;
      topLines.push(lines[i]);
      topChars += lineLength;
    }

    // Collect bottom lines
    let bottomLines = [];
    let bottomChars = 0;
    for (let i = lines.length - 1; i >= topLines.length; i--) {
      const lineLength = lines[i].length + 1;
      if (bottomChars + lineLength > charsPerSection) break;
      bottomLines.unshift(lines[i]);
      bottomChars += lineLength;
    }

    // Determine line number where bottom section starts
    const bottomStartLine = totalLines - bottomLines.length + 1;

    // Build truncated code
    const topSection = topLines.join('\n');
    const truncationMarker = `\n\n🔽 ZKRÁCENO ${totalLines - topLines.length - bottomLines.length} ŘÁDKŮ (${topLines.length + 1}-${bottomStartLine - 1}) 🔽\n\n`;
    const bottomSection = bottomLines.join('\n');

    const truncatedCode = topSection + truncationMarker + bottomSection;

    return {
      code: truncatedCode,
      isTruncated: true,
      topLinesCount: topLines.length,
      bottomStartLine: bottomStartLine,
      totalLines: totalLines
    };
  }

  /**
   * Insert code to editor with validation
   * Handles duplicate detection, work mode (continue/new-project), and confirmations
   */
  async insertCodeToEditor(code, fullResponse) {
    console.log('[CodeEditor] Inserting code to editor...');

    // Get current editor content
    const currentCode = SafeOps.safe(
      () => state.get('editor.code') || '',
      'Chyba při získávání kódu z editoru'
    );

    // Režim práce: pokračovat nebo nový projekt
    const workMode = this.panel.workMode || 'continue';
    console.log('[CodeEditor] Režim práce:', workMode);

    // 1. NEJDŘÍV: Pokud je režim "nový projekt" a editor má obsah - zobrazit potvrzení
    if (workMode === 'new-project' && currentCode && currentCode.trim().length > 50) {
      console.log('[CodeEditor] Režim "Nový projekt" - zobrazuji potvrzení');
      const confirmed = await this.showNewProjectConfirmation();
      if (!confirmed) {
        console.log('[CodeEditor] Uživatel zrušil smazání projektu');
        return 'Vytvoření nového projektu zrušeno.';
      }
      // Vymazat kód v editoru pro nový projekt
      SafeOps.safe(
        () => {
          state.set('editor.code', '');
          eventBus.emit('editor:setCode', { code: '' });
        },
        'Chyba při mazání kódu'
      );
      console.log('[CodeEditor] Současný projekt smazán');
    }

    // 2. POTOM: Zobrazit schvalovací dialog s náhledem změn (VS Code style)
    const approvedCode = workMode === 'new-project' ? '' : currentCode; // Pro nový projekt ukázat prázdný editor
    const approved = await this.showCodeApprovalDialog(approvedCode, code);
    if (!approved) {
      console.log('[CodeEditor] Uživatel odmítl změny');
      // Pokud uživatel odmítl, vrátit původní kód (pokud byl smazán)
      if (workMode === 'new-project' && currentCode) {
        SafeOps.safe(
          () => eventBus.emit('editor:setCode', { code: currentCode }),
          'Chyba při obnovování kódu'
        );
      }
      return '❌ Změny odmítnuty';
    }

    // Detect duplicate variables
    const duplicates = this.detectDuplicateVariables(code);

    if (duplicates.length > 0) {
      console.warn('[CodeEditor] Duplicate variables detected:', duplicates);
      this.panel.addChatMessage('system',
        `⚠️ Varování: Zjištěny duplicitní proměnné:\n${duplicates.join(', ')}\n\n` +
        `To může způsobit problémy. Chcete pokračovat?\n\n` +
        `Tip: Použijte "oprav duplicity" nebo "zkontroluj kód"`
      );
    }

    // Save current code to history before change (only in continue mode and if has content)
    if (workMode === 'continue' && currentCode && currentCode.length > 0) {
      SafeOps.safe(
        () => {
          const history = state.get('editor.history') || [];
          history.push({ code: currentCode, timestamp: Date.now() });
          if (history.length > 20) history.shift(); // Keep last 20 versions
          state.actions.set('editor.history', history);
        },
        'Chyba při ukládání historie editoru'
      );
    }

    // Insert code
    SafeOps.safe(
      () => eventBus.emit('editor:setCode', { code }),
      'Chyba při nastavování hodnoty editoru'
    );

    // Switch to editor view on mobile
    if (window.innerWidth < 768) {
      eventBus.emit('view:change', { view: 'editor' });
    }

    // Po vytvoření nového projektu přepnout zpět na "pokračovat"
    if (workMode === 'new-project') {
      this.panel.workMode = 'continue';
      // Aktualizovat UI toggle button
      const modeToggleBtn = document.querySelector('#aiModeToggle');
      if (modeToggleBtn) {
        modeToggleBtn.querySelector('.mode-icon').textContent = '📝';
        modeToggleBtn.querySelector('.mode-text').textContent = 'Pokračovat';
        modeToggleBtn.classList.remove('new-project-mode');
        modeToggleBtn.title = 'Přidávat kód k existujícímu projektu';
      }
      console.log('[CodeEditor] Režim přepnut zpět na "Pokračovat"');
    }

    const message = workMode === 'new-project'
      ? '✅ Nový projekt vytvořen v editoru'
      : '✅ Kód byl vložen do editoru';

    console.log('[CodeEditor] Code inserted successfully');
    return message;
  }

  /**
   * Detect duplicate variable declarations
   */
  detectDuplicateVariables(code) {
    const duplicates = [];
    const variableNames = new Map();

    // Find all let/const/var declarations
    const declarationRegex = /(?:let|const|var)\s+([a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ_$][a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9_$]*)/g;
    let match;

    while ((match = declarationRegex.exec(code)) !== null) {
      const varName = match[1];
      if (variableNames.has(varName)) {
        variableNames.set(varName, variableNames.get(varName) + 1);
      } else {
        variableNames.set(varName, 1);
      }
    }

    // Find duplicates
    variableNames.forEach((count, name) => {
      if (count > 1) {
        duplicates.push(`${name} (${count}x)`);
      }
    });

    return duplicates;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Show confirmation before deleting current project
   * Returns Promise<boolean> - true if confirmed, false if cancelled
   */
  async showNewProjectConfirmation() {
    return new Promise((resolve) => {
      const chatMessages = document.getElementById('aiChatMessages');
      if (!chatMessages) {
        resolve(false);
        return;
      }

      // Create confirmation modal
      const modal = document.createElement('div');
      modal.className = 'code-insert-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <h3>⚠️ Potvrdit smazání projektu?</h3>
          <p style="margin: 15px 0; color: #e0e0e0;">
            Současný kód v editoru bude <strong>trvale smazán</strong>.<br>
            AI vytvoří úplně nový projekt od začátku.
          </p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn-danger" data-action="confirm">
              <span class="btn-icon">🗑️</span>
              <div class="btn-text">
                <strong>Ano, smazat</strong>
                <small>Začít nový projekt</small>
              </div>
            </button>
            <button class="modal-btn modal-btn-secondary" data-action="cancel">
              <span class="btn-icon">❌</span>
              <div class="btn-text">
                <strong>Ne, zrušit</strong>
                <small>Zachovat současný kód</small>
              </div>
            </button>
          </div>
        </div>
      `;

      // Add to chat
      chatMessages.appendChild(modal);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Handle button clicks
      const confirmBtn = modal.querySelector('[data-action="confirm"]');
      const cancelBtn = modal.querySelector('[data-action="cancel"]');

      const cleanup = () => {
        modal.remove();
      };

      confirmBtn.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
    });
  }

  /**
   * Show confirmation dialog for code insertion
   * Offers: Add to existing, Create new project, Cancel
   */
  async showCodeInsertConfirmation(newCode, currentCode) {
    console.log('[CodeEditor] Showing code insert confirmation dialog');

    return new Promise((resolve) => {
      const messagesContainer = this.panel.modal.element.querySelector('#aiChatMessages');

      // Remove any existing confirmation dialogs
      const existingConfirmations = messagesContainer.querySelectorAll('.code-insert-confirmation');
      existingConfirmations.forEach(el => el.remove());

      // Create confirmation UI
      const confirmationEl = document.createElement('div');
      confirmationEl.className = 'ai-message assistant code-insert-confirmation';

      const currentLength = currentCode.trim().length;
      const newLength = newCode.trim().length;

      confirmationEl.innerHTML = `
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin: 10px 0;">
          <h3 style="margin: 0 0 15px 0; color: white; font-size: 1.3em;">
            🎯 Jak chcete vložit kód?
          </h3>

          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 20px; color: white;">
            <div style="margin-bottom: 10px;">
              <strong>📝 Aktuální editor:</strong> ${currentLength.toLocaleString()} znaků
            </div>
            <div>
              <strong>✨ Nový kód:</strong> ${newLength.toLocaleString()} znaků
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="add-to-existing-btn" style="padding: 16px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1em; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
              <span style="font-size: 1.5em;">➕</span>
              <div style="text-align: left;">
                <div>Přidat na stávající stránku</div>
                <div style="font-size: 0.85em; opacity: 0.9; font-weight: 400;">Zachovat současný kód a přidat nový</div>
              </div>
            </button>

            <button class="create-new-btn" style="padding: 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1em; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
              <span style="font-size: 1.5em;">🆕</span>
              <div style="text-align: left;">
                <div>Vytvořit nový projekt</div>
                <div style="font-size: 0.85em; opacity: 0.9; font-weight: 400;">Nahradit celý editor novým kódem</div>
              </div>
            </button>

            <button class="cancel-insert-btn" style="padding: 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1em; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
              <span style="font-size: 1.5em;">❌</span>
              <div style="text-align: left;">
                <div>Zrušit</div>
                <div style="font-size: 0.85em; opacity: 0.9; font-weight: 400;">Nechat kód v chatu, nevkládat</div>
              </div>
            </button>
          </div>
        </div>
      `;

      messagesContainer.appendChild(confirmationEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Add event listeners
      const addToExistingBtn = confirmationEl.querySelector('.add-to-existing-btn');
      const createNewBtn = confirmationEl.querySelector('.create-new-btn');
      const cancelBtn = confirmationEl.querySelector('.cancel-insert-btn');

      const cleanup = () => {
        confirmationEl.remove();
      };

      addToExistingBtn.onclick = () => {
        console.log('[CodeEditor] User chose: Add to existing');
        cleanup();

        // Append new code to existing
        const combinedCode = currentCode + '\n\n' + newCode;
        eventBus.emit('editor:setCode', { code: combinedCode });

        this.panel.addChatMessage('system', '✅ Kód byl přidán na konec stávajícího kódu');

        // Switch to editor view on mobile
        if (window.innerWidth < 768) {
          eventBus.emit('view:change', { view: 'editor' });
        }

        resolve('added');
      };

      createNewBtn.onclick = () => {
        console.log('[CodeEditor] User chose: Create new project');
        cleanup();

        // Replace entire editor content
        eventBus.emit('editor:setCode', { code: newCode });

        this.panel.addChatMessage('system', '🆕 Vytvořen nový projekt - editor byl nahrazen novým kódem');

        // Switch to editor view on mobile
        if (window.innerWidth < 768) {
          eventBus.emit('view:change', { view: 'editor' });
        }

        resolve('replaced');
      };

      cancelBtn.onclick = () => {
        console.log('[CodeEditor] User cancelled code insertion');
        cleanup();
        this.panel.addChatMessage('system', '❌ Vložení kódu zrušeno - kód zůstává dostupný v chatu výše');
        resolve('cancelled');
      };
    });
  }

  /**
   * Show code approval dialog (VS Code style)
   * @param {string} oldCode - Current code in editor
   * @param {string} newCode - Proposed new code
   * @returns {Promise<boolean>} - true if approved, false if rejected
   */
  async showCodeApprovalDialog(oldCode, newCode) {
    return new Promise((resolve) => {
      // Calculate diff statistics
      const oldLines = oldCode.split('\n');
      const newLines = newCode.split('\n');
      const stats = this.calculateDiffStats(oldLines, newLines);

      // Create dialog overlay
      const overlay = document.createElement('div');
      overlay.className = 'code-approval-overlay';
      overlay.innerHTML = `
        <div class="code-approval-dialog">
          <div class="code-approval-header">
            <h3>🔍 Kontrola změn</h3>
            <div class="code-approval-stats">
              <span class="stat-added">+${stats.added} řádků</span>
              <span class="stat-removed">-${stats.removed} řádků</span>
              <span class="stat-changed">~${stats.changed} změn</span>
            </div>
          </div>

          <div class="code-approval-preview">
            <div class="preview-section">
              <div class="preview-label">📝 Současný kód (${oldLines.length} řádků)</div>
              <pre class="preview-code old-code">${this.escapeHtml(oldCode.substring(0, 2000))}${oldCode.length > 2000 ? '\n...' : ''}</pre>
            </div>
            <div class="preview-divider">→</div>
            <div class="preview-section">
              <div class="preview-label">✨ Nový kód (${newLines.length} řádků)</div>
              <pre class="preview-code new-code">${this.escapeHtml(newCode.substring(0, 2000))}${newCode.length > 2000 ? '\n...' : ''}</pre>
            </div>
          </div>

          <div class="code-approval-actions">
            <button class="approval-btn reject-btn">
              <span class="btn-icon">✗</span>
              <span class="btn-text">Odmítnout</span>
            </button>
            <button class="approval-btn accept-btn">
              <span class="btn-icon">✓</span>
              <span class="btn-text">Přijmout změny</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const acceptBtn = overlay.querySelector('.accept-btn');
      const rejectBtn = overlay.querySelector('.reject-btn');

      const cleanup = () => {
        overlay.remove();
      };

      acceptBtn.onclick = () => {
        cleanup();
        toast.show('✅ Změny přijaty', 'success');
        resolve(true);
      };

      rejectBtn.onclick = () => {
        cleanup();
        toast.show('❌ Změny odmítnuty', 'info');
        resolve(false);
      };

      // ESC key closes dialog
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          document.removeEventListener('keydown', handleEsc);
          resolve(false);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }

  /**
   * Calculate diff statistics
   */
  calculateDiffStats(oldLines, newLines) {
    let added = 0;
    let removed = 0;
    let changed = 0;

    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        added++;
      } else if (newLine === undefined) {
        removed++;
      } else if (oldLine !== newLine) {
        changed++;
      }
    }

    return { added, removed, changed };
  }

  /**
   * Escape HTML for safe display
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
