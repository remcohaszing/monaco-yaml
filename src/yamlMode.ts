import { IDisposable, languages, Uri } from 'monaco-editor/esm/vs/editor/editor.api';

import * as languageFeatures from './languageFeatures';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { WorkerManager } from './workerManager';
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

export function setupMode(defaults: LanguageServiceDefaultsImpl): void {
  const disposables: IDisposable[] = [];

  const client = new WorkerManager(defaults);
  disposables.push(client);

  const worker: languageFeatures.WorkerAccessor = (...uris: Uri[]): Promise<YAMLWorker> =>
    client.getLanguageServiceWorker(...uris);

  const { languageId } = defaults;

  disposables.push(
    languages.registerCompletionItemProvider(
      languageId,
      new languageFeatures.CompletionAdapter(worker),
    ),
    languages.registerHoverProvider(languageId, new languageFeatures.HoverAdapter(worker)),
    languages.registerDocumentSymbolProvider(
      languageId,
      new languageFeatures.DocumentSymbolAdapter(worker),
    ),
    languages.registerDocumentFormattingEditProvider(
      languageId,
      new languageFeatures.DocumentFormattingEditProvider(worker),
    ),
    languages.registerDocumentRangeFormattingEditProvider(
      languageId,
      new languageFeatures.DocumentRangeFormattingEditProvider(worker),
    ),
    new languageFeatures.DiagnosticsAdapter(languageId, worker, defaults),
    languages.setLanguageConfiguration(languageId, richEditConfiguration),
  );
}
