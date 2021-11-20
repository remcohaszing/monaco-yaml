import { languages } from 'monaco-editor/esm/vs/editor/editor.api.js';

import { languageId } from './constants';
import {
  createCompletionItemProvider,
  createDefinitionProvider,
  createDiagnosticsAdapter,
  createDocumentFormattingEditProvider,
  createDocumentSymbolProvider,
  createHoverProvider,
  createLinkProvider,
} from './languageFeatures';
import { createWorkerManager } from './workerManager';

const richEditConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '#',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],

  onEnterRules: [
    {
      beforeText: /:\s*$/,
      action: { indentAction: languages.IndentAction.Indent },
    },
  ],
};

export function setupMode(defaults: languages.yaml.LanguageServiceDefaults): void {
  const worker = createWorkerManager(defaults);

  languages.registerCompletionItemProvider(languageId, createCompletionItemProvider(worker));
  languages.registerHoverProvider(languageId, createHoverProvider(worker));
  languages.registerDefinitionProvider(languageId, createDefinitionProvider(worker));
  languages.registerDocumentSymbolProvider(languageId, createDocumentSymbolProvider(worker));
  languages.registerDocumentFormattingEditProvider(
    languageId,
    createDocumentFormattingEditProvider(worker),
  );
  languages.registerLinkProvider(languageId, createLinkProvider(worker));
  createDiagnosticsAdapter(worker, defaults);
  languages.setLanguageConfiguration(languageId, richEditConfiguration);
}
