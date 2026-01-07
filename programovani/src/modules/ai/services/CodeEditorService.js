/**
 * Code Editor Service
 * Handles code editing operations, EDIT:LINES parsing, and applying changes
 */

import { state } from '../../../core/state.js';
import { toast } from '../../../ui/components/Toast.js';
import { Modal } from '../../../ui/components/Modal.js';
import { StringUtils } from '../utils/stringUtils.js';

export class CodeEditorService {
  constructor() {
    this.originalCode = null;
  }

  /**
   * Parse EDIT:LINES instructions from AI response
   */
  parseEditInstructions(response) {
    if (!response) return [];

    const patterns = [
      /```EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)\s*```/g,
      /\`\`\`EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)\s*\`\`\`/g,
      /EDIT:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)(?=EDIT:LINES:|$)/g,
      /:LINES:(\d+)-(\d+)\s+OLD:\s*([\s\S]*?)\s*NEW:\s*([\s\S]*?)(?::LINES:|$)/g,
      /EDIT:LINES:(\d+)-(\d+)\s*\n\s*OLD:\s*\n([\s\S]*?)\s*\n\s*NEW:\s*\n([\s\S]*?)(?=EDIT:LINES:|$)/g
    ];

    const edits = [];

    for (const editPattern of patterns) {
      const regex = new RegExp(editPattern);
      let match;
      while ((match = regex.exec(response)) !== null) {
        const oldCode = match[3].trim();
        const newCode = match[4].trim();

        if (!oldCode || oldCode === '...' || oldCode === '// ...' || oldCode === '/* ... */' ||
            (oldCode.includes('...') && oldCode.length < 10)) {
          console.warn(`⚠️ Ignoruji EDIT:LINES ${match[1]}-${match[2]}: OLD blok je prázdný nebo obsahuje zkratky`);
          continue;
        }

        edits.push({
          startLine: parseInt(match[1]),
          endLine: parseInt(match[2]),
          oldCode: oldCode,
          newCode: newCode
        });
      }

      if (edits.length > 0) {
        console.log(`✅ Detekováno ${edits.length} změn pomocí pattern #${patterns.indexOf(editPattern) + 1}`);
        break;
      }
    }

    if (edits.length === 0) {
      console.warn('⚠️ Žádné EDIT:LINES bloky nebyly detekovány.');
    }

    return edits;
  }

  /**
   * Apply line-based edits to current editor code
   */
  applyLineEdits(edits) {
    if (!edits || edits.length === 0) {
      console.warn('⚠️ Žádné EDIT:LINES bloky k aplikaci');
      return false;
    }

    const currentCode = state.get('editor.code');
    if (!currentCode) {
      toast.error('Editor je prázdný - nelze aplikovat změny');
      return false;
    }

    const lines = currentCode.split('\n');
    let appliedCount = 0;
    let failedEdits = [];

    // Sort edits by line number (descending)
    edits.sort((a, b) => b.startLine - a.startLine);

    console.log(`📝 Aplikuji ${edits.length} změn od konce k začátku:`,
      edits.map(e => `${e.startLine}-${e.endLine}`).join(', '));

    for (const edit of edits) {
      const { startLine, endLine, oldCode, newCode } = edit;

      if (startLine < 1 || endLine > lines.length || startLine > endLine) {
        failedEdits.push({ lines: `${startLine}-${endLine}`, reason: 'Neplatný rozsah' });
        continue;
      }

      const actualCode = lines.slice(startLine - 1, endLine).join('\n');
      const actualNormalized = actualCode.replace(/\s+/g, ' ').trim();
      const oldNormalized = oldCode.replace(/\s+/g, ' ').trim();

      if (actualNormalized === oldNormalized) {
        // Match - apply change
        const newLines = newCode.split('\n');
        lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);
        appliedCount++;
      } else {
        // Try fuzzy matching nearby
        const searchRange = Math.min(10, Math.floor(lines.length / 100));
        let foundMatch = false;

        for (let offset = -searchRange; offset <= searchRange; offset++) {
          if (offset === 0) continue;
          const offsetStart = startLine + offset - 1;
          const offsetEnd = endLine + offset;
          if (offsetStart < 0 || offsetEnd > lines.length) continue;

          const offsetCode = lines.slice(offsetStart, offsetEnd).join('\n');
          const offsetNormalized = offsetCode.replace(/\s+/g, ' ').trim();

          if (offsetNormalized === oldNormalized) {
            const newLines = newCode.split('\n');
            lines.splice(offsetStart, offsetEnd - offsetStart, ...newLines);
            appliedCount++;
            foundMatch = true;
            break;
          }

          const similarity = StringUtils.calculateSimilarity(offsetNormalized, oldNormalized);
          if (similarity > 0.90) {
            const newLines = newCode.split('\n');
            lines.splice(offsetStart, offsetEnd - offsetStart, ...newLines);
            appliedCount++;
            foundMatch = true;
            break;
          }
        }

        if (!foundMatch) {
          failedEdits.push({
            lines: `${startLine}-${endLine}`,
            reason: 'OLD kód nesedí',
            fullExpected: oldCode,
            fullActual: actualCode,
            newCode: newCode
          });
        }
      }
    }

    // Handle failed edits
    if (failedEdits.length > 0) {
      this.showFailedEditsModal(failedEdits, appliedCount, edits.length);
      if (appliedCount === 0) return false;
    } else if (appliedCount > 0) {
      toast.success(`✅ Aplikováno ${appliedCount} změn automaticky`, 3000);
    }

    // Update editor
    const newCode = lines.join('\n');
    this.updateEditorWithUndo(newCode);

    return appliedCount > 0;
  }

  /**
   * Update editor with undo support
   */
  updateEditorWithUndo(newCode) {
    const editor = document.querySelector('.editor-container')?.__editor;

    if (editor) {
      const currentEditorCode = editor.getCode?.() || state.get('editor.code');

      // Save to history
      if (currentEditorCode && editor.history) {
        const last = editor.history.past[editor.history.past.length - 1];
        if (currentEditorCode !== last) {
          editor.history.past.push(currentEditorCode);
          if (editor.history.past.length > editor.history.maxSize) {
            editor.history.past.shift();
          }
          editor.history.future = [];
        }
      }

      editor.isUndoRedoInProgress = true;
      editor.setCode?.(newCode, true);
      editor.isUndoRedoInProgress = false;

      state.set('editor.code', newCode);
    } else {
      state.set('editor.code', newCode);
    }
  }

  /**
   * Show modal for failed edits
   */
  showFailedEditsModal(failedEdits, appliedCount, totalCount) {
    const errorDetails = failedEdits.map((f, i) => `
      <div class="failed-edit" style="margin-bottom: 15px; padding: 10px; background: #2a2a2a; border-left: 3px solid #f59e0b; border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 8px;">❌ Změna #${i + 1} (řádky ${f.lines})</div>
        <div style="margin-bottom: 5px; font-size: 0.9em; color: #999;">
          <strong>📄 Aktuální kód:</strong>
        </div>
        <pre style="background: #1a1a1a; padding: 8px; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">${StringUtils.escapeHtml(f.fullActual)}</pre>
        <div style="margin: 10px 0 5px; font-size: 0.9em; color: #999;">
          <strong>💡 Očekávaný kód:</strong>
        </div>
        <pre style="background: #1a1a1a; padding: 8px; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">${StringUtils.escapeHtml(f.fullExpected)}</pre>
        <div style="margin: 10px 0 5px; font-size: 0.9em; color: #999;">
          <strong>✨ Nový kód:</strong>
        </div>
        <pre style="background: #1a1a1a; padding: 8px; border-radius: 3px; overflow-x: auto; font-size: 0.85em;">${StringUtils.escapeHtml(f.newCode)}</pre>
        <button class="apply-manual-btn" data-newcode="${StringUtils.escapeHtml(f.newCode)}"
                style="margin-top: 10px; padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
          📋 Zkopírovat
        </button>
      </div>
    `).join('');

    const modalContent = `
      <div style="max-height: 60vh; overflow-y: auto; padding: 10px;">
        <div style="margin-bottom: 15px; padding: 12px; background: #1a1a1a; border-radius: 6px;">
          <div style="font-size: 1.1em; margin-bottom: 8px;">
            ${appliedCount > 0
              ? `⚠️ <strong>${appliedCount}/${totalCount} změn aplikováno</strong>`
              : '❌ <strong>Nepodařilo se aplikovat změny</strong>'}
          </div>
          <div style="color: #999; font-size: 0.95em;">
            Kód v editoru se liší od očekávání AI.
          </div>
        </div>
        ${errorDetails}
      </div>
    `;

    const errorModal = new Modal({
      title: `${appliedCount > 0 ? '⚠️ Částečné selhání' : '❌ Změny nelze aplikovat'}`,
      content: modalContent,
      className: 'failed-edits-modal',
      size: 'large'
    });

    errorModal.create();
    errorModal.open();

    // Add copy button handlers
    setTimeout(() => {
      errorModal.element?.querySelectorAll('.apply-manual-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const newCode = e.target.dataset.newcode;
          const decoded = StringUtils.unescapeHtml(newCode);
          navigator.clipboard.writeText(decoded).then(() => {
            toast.success('✅ Kód zkopírován', 2000);
            e.target.textContent = '✓ Zkopírováno!';
          });
        });
      });
    }, 100);
  }

  /**
   * Detect duplicate variable declarations
   */
  detectDuplicateVariables(code) {
    const duplicates = [];
    const variableNames = new Map();
    const declarationRegex = /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;

    while ((match = declarationRegex.exec(code)) !== null) {
      const varName = match[1];
      variableNames.set(varName, (variableNames.get(varName) || 0) + 1);
    }

    variableNames.forEach((count, name) => {
      if (count > 1) {
        duplicates.push(`${name} (${count}x)`);
      }
    });

    return duplicates;
  }

  /**
   * Insert code to editor
   */
  insertCodeToEditor(code, isModification = false) {
    this.originalCode = state.get('editor.code');

    // Check for duplicates
    const duplicates = this.detectDuplicateVariables(code);
    if (duplicates.length > 0) {
      console.error('⚠️ Detekované duplicitní proměnné:', duplicates);
      toast.error(`⚠️ Kód obsahuje duplicitní proměnné: ${duplicates.join(', ')}`, 5000);
    }

    // Update editor with undo support
    const editor = document.querySelector('.editor-container')?.__editor;
    if (editor?.setCode && editor?.saveToHistory) {
      editor.saveToHistory();
      editor.setCode(code, true);
    }

    state.set('editor.code', code);

    return true;
  }
}
