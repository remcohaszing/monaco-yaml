import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import { registerMarkerDataProvider } from 'monaco-marker-data-provider';
import { createWorkerManager } from 'monaco-worker-manager';
import { LanguageServiceDefaults } from 'monaco-yaml';

import { languageId } from './constants';
import {
  createCodeActionProvider,
  createCompletionItemProvider,
  createDefinitionProvider,
  createDocumentFormattingEditProvider,
  createDocumentSymbolProvider,
  createHoverProvider,
  createLinkProvider,
  createMarkerDataProvider,
} from './languageFeatures';
import { CreateData, YAMLWorker } from './yaml.worker';

const richEditConfiguration: monaco.languages.LanguageConfiguration = {
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
      action: { indentAction: monaco.languages.IndentAction.Indent },
    },
  ],
};

export function setupMode(defaults: LanguageServiceDefaults): void {
  const worker = createWorkerManager<YAMLWorker, CreateData>(monaco, {
    label: 'yaml',
    moduleId: 'monaco-yaml/yaml.worker',
    createData: {
      languageSettings: defaults.diagnosticsOptions,
      enableSchemaRequest: defaults.diagnosticsOptions.enableSchemaRequest,
    },
  });

  defaults.onDidChange(() => {
    worker.updateCreateData({
      languageSettings: defaults.diagnosticsOptions,
      enableSchemaRequest: defaults.diagnosticsOptions.enableSchemaRequest,
    });
  });

  monaco.languages.registerCompletionItemProvider(
    languageId,
    createCompletionItemProvider(worker.getWorker),
  );
  const hooks = defaults.diagnosticsOptions.hooks ?? {};
  let hoverProvider = monaco.languages.registerHoverProvider(
    languageId,
    createHoverProvider(hooks, worker.getWorker),
  );
  monaco.languages.registerDefinitionProvider(
    languageId,
    createDefinitionProvider(worker.getWorker),
  );
  monaco.languages.registerDocumentSymbolProvider(
    languageId,
    createDocumentSymbolProvider(worker.getWorker),
  );
  monaco.languages.registerDocumentFormattingEditProvider(
    languageId,
    createDocumentFormattingEditProvider(worker.getWorker),
  );
  monaco.languages.registerLinkProvider(languageId, createLinkProvider(worker.getWorker));
  let codeActionProvider = monaco.languages.registerCodeActionProvider(
    languageId,
    createCodeActionProvider(hooks, worker.getWorker),
  );
  monaco.languages.setLanguageConfiguration(languageId, richEditConfiguration);

  let markerDataProvider = registerMarkerDataProvider(
    monaco,
    languageId,
    createMarkerDataProvider(hooks, worker.getWorker),
  );
  defaults.onDidChange(() => {
    const hooks = defaults.diagnosticsOptions.hooks ?? {};
    hoverProvider.dispose();
    hoverProvider = monaco.languages.registerHoverProvider(
      languageId,
      createHoverProvider(hooks, worker.getWorker),
    );

    codeActionProvider.dispose();
    codeActionProvider = monaco.languages.registerCodeActionProvider(
      languageId,
      createCodeActionProvider(hooks, worker.getWorker),
    );

    markerDataProvider.dispose();
    markerDataProvider = registerMarkerDataProvider(
      monaco,
      languageId,
      createMarkerDataProvider(hooks, worker.getWorker),
    );
  });
}
