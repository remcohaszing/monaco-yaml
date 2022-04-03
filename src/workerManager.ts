import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';

import { languageId } from './constants';
import { WorkerAccessor } from './languageFeatures';
import { LanguageServiceDefaults } from './types';
import { YAMLWorker } from './yamlWorker';

// 2min
const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000;

export function createWorkerManager(defaults: LanguageServiceDefaults): WorkerAccessor {
  let worker: editor.MonacoWebWorker<YAMLWorker>;
  let client: Promise<YAMLWorker>;
  let lastUsedTime = 0;

  const stopWorker = (): void => {
    if (worker) {
      worker.dispose();
      worker = undefined;
    }
    client = undefined;
  };

  setInterval(() => {
    if (!worker) {
      return;
    }
    const timePassedSinceLastUsed = Date.now() - lastUsedTime;
    if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
      stopWorker();
    }
  }, 30 * 1000);

  // This is necessary to have updated language options take effect (e.g. schema changes)
  defaults.onDidChange(() => stopWorker());

  const getClient = (): Promise<YAMLWorker> => {
    lastUsedTime = Date.now();

    if (!client) {
      worker = editor.createWebWorker<YAMLWorker>({
        // Module that exports the create() method and returns a `YAMLWorker` instance
        moduleId: 'vs/language/yaml/yamlWorker',

        label: languageId,

        // Passed in to the create() method
        createData: {
          languageSettings: defaults.diagnosticsOptions,
          enableSchemaRequest: defaults.diagnosticsOptions.enableSchemaRequest,
          isKubernetes: defaults.diagnosticsOptions.isKubernetes,
          customTags: defaults.diagnosticsOptions.customTags,
        },
      });

      client = worker.getProxy();
    }

    return client;
  };

  return async (...resources) => {
    const client = await getClient();
    await worker.withSyncedResources(resources);
    return client;
  };
}
