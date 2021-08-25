import { IDisposable, languages, Uri } from 'monaco-editor/esm/vs/editor/editor.api';

import {
  createCompletionItemProvider,
  createDiagnosticsAdapter,
  createDocumentFormattingEditProvider,
  createDocumentSymbolProvider,
  createHoverProvider,
  createLinkProvider,
  WorkerAccessor,
} from './languageFeatures';
import { createWorkerManager } from './workerManager';
import { YAMLWorker } from './yamlWorker';

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
  const disposables: IDisposable[] = [];

  const client = createWorkerManager(defaults);
  disposables.push(client);

  const worker: WorkerAccessor = (...uris: Uri[]): Promise<YAMLWorker> =>
    client.getLanguageServiceWorker(...uris);

  const { languageId } = defaults;

  disposables.push(
    languages.registerCompletionItemProvider(languageId, createCompletionItemProvider(worker)),
    languages.registerHoverProvider(languageId, createHoverProvider(worker)),
    languages.registerDocumentSymbolProvider(languageId, createDocumentSymbolProvider(worker)),
    languages.registerDocumentFormattingEditProvider(
      languageId,
      createDocumentFormattingEditProvider(worker),
    ),
    languages.registerLinkProvider(languageId, createLinkProvider(worker)),
    createDiagnosticsAdapter(languageId, worker, defaults),
    languages.setLanguageConfiguration(languageId, richEditConfiguration),
  );
}
