/**
 * File Tools - Nástroje pro práci se soubory
 */

import { state } from '../../../core/state.js';

export const fileTools = {
  /**
   * Přečte obsah souboru
   */
  read_file: {
    schema: {
      description: 'Read contents of a file with optional line range',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Absolute or relative path to the file',
          },
          startLine: {
            type: 'number',
            description: 'Starting line number (1-based, optional)',
          },
          endLine: {
            type: 'number',
            description: 'Ending line number (1-based, optional)',
          },
        },
        required: ['filePath'],
      },
    },
    handler: async ({ filePath, startLine, endLine }) => {
      try {
        // Zkontroluj jestli je soubor otevřený v editoru
        const openFiles = state.get('openFiles') || [];
        const file = openFiles.find((f) => f.path === filePath || f.path.endsWith(filePath));

        if (!file) {
          return {
            success: false,
            error: `File '${filePath}' not found in open files`,
            suggestion: 'Use list_open_files tool to see available files',
          };
        }

        let content = file.content || '';
        const lines = content.split('\n');

        // Aplikuj line range pokud je specifikovaný
        if (startLine !== undefined || endLine !== undefined) {
          const start = Math.max(0, (startLine || 1) - 1);
          const end = Math.min(lines.length, endLine || lines.length);
          content = lines.slice(start, end).join('\n');

          return {
            success: true,
            filePath,
            lineRange: `${start + 1}-${end}`,
            totalLines: lines.length,
            content,
          };
        }

        return {
          success: true,
          filePath,
          totalLines: lines.length,
          content,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },

  /**
   * Seznam otevřených souborů
   */
  list_open_files: {
    schema: {
      description: 'List all currently open files in the editor',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    handler: async () => {
      try {
        const openFiles = state.get('openFiles') || [];
        const activeFile = state.get('activeFile');

        // Vytvoř pěkně formátovaný seznam
        const fileList = openFiles.map((f) => {
          const isActive = activeFile && f.path === activeFile.path;
          return `  - ${f.path}${isActive ? ' (aktivní)' : ''}`;
        }).join('\n');

        return {
          success: true,
          count: openFiles.length,
          activeFile: activeFile?.path || 'žádný',
          // Vrať pre-formátovaný text pro lepší zobrazení
          formattedList: `Máš otevřené následující soubory (${openFiles.length}):\n\n${fileList}`,
          // Zachovej i strukturovaná data pro programatické použití
          files: openFiles.map((f) => ({
            path: f.path,
            language: f.language,
            lines: (f.content || '').split('\n').length,
            modified: f.modified || false,
            isActive: activeFile && f.path === activeFile.path,
          })),
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },

  /**
   * Zapíše obsah do aktuálního editoru
   */
  write_to_editor: {
    schema: {
      description: 'Write or replace content in the current editor',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The content to write',
          },
          append: {
            type: 'boolean',
            description: 'If true, append to existing content instead of replacing',
          },
        },
        required: ['content'],
      },
    },
    handler: async ({ content, append = false }) => {
      try {
        const activeFile = state.get('activeFile');
        if (!activeFile) {
          return {
            success: false,
            error: 'No active file in editor',
          };
        }

        const editor = window.editor;
        if (!editor) {
          return {
            success: false,
            error: 'Editor not initialized',
          };
        }

        if (append) {
          const current = editor.getValue();
          editor.setValue(current + '\n' + content);
        } else {
          editor.setValue(content);
        }

        return {
          success: true,
          filePath: activeFile.path,
          action: append ? 'appended' : 'replaced',
          lines: content.split('\n').length,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },

  /**
   * Získá informace o aktuálním souboru
   */
  get_active_file: {
    schema: {
      description: 'Get information about the currently active file in editor',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    handler: async () => {
      try {
        const activeFile = state.get('activeFile');
        if (!activeFile) {
          return {
            success: false,
            error: 'No active file',
          };
        }

        const editor = window.editor;
        const content = editor ? editor.getValue() : activeFile.content || '';

        return {
          success: true,
          file: {
            path: activeFile.path,
            language: activeFile.language,
            lines: content.split('\n').length,
            characters: content.length,
            modified: activeFile.modified || false,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },
};
