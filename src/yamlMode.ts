/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { languages, Uri, IDisposable } from 'monaco-editor';
import * as languageFeatures from './languageFeatures';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { WorkerManager } from './workerManager';
import { YAMLWorker } from './yamlWorker';

export function setupMode(defaults: LanguageServiceDefaultsImpl): void {
  const disposables: IDisposable[] = [];

  const client = new WorkerManager(defaults);
  disposables.push(client);

  const worker: languageFeatures.WorkerAccessor = (
    ...uris: Uri[]
  ): Promise<YAMLWorker> => {
    return client.getLanguageServiceWorker(...uris);
  };

  const languageId = defaults.languageId;

  disposables.push(
    languages.registerCompletionItemProvider(
      languageId,
      new languageFeatures.CompletionAdapter(worker)
    )
  );
  disposables.push(
    languages.registerHoverProvider(
      languageId,
      new languageFeatures.HoverAdapter(worker)
    )
  );
  disposables.push(
    languages.registerDocumentSymbolProvider(
      languageId,
      new languageFeatures.DocumentSymbolAdapter(worker)
    )
  );
  disposables.push(
    languages.registerDocumentFormattingEditProvider(
      languageId,
      new languageFeatures.DocumentFormattingEditProvider(worker)
    )
  );
  disposables.push(
    languages.registerDocumentRangeFormattingEditProvider(
      languageId,
      new languageFeatures.DocumentRangeFormattingEditProvider(worker)
    )
  );
  disposables.push(
    new languageFeatures.DiagnosticsAdapter(languageId, worker, defaults)
  );
  disposables.push(
    languages.setLanguageConfiguration(languageId, richEditConfiguration)
  );

  // Color adapter should be necessary most of the time:
  // disposables.push(languages.registerColorProvider(languageId, new languageFeatures.DocumentColorAdapter(worker)));
}

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
