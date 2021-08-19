import { editor, IDisposable, languages, Uri } from 'monaco-editor/esm/vs/editor/editor.api';

import { YAMLWorker } from './yamlWorker';

export interface WorkerManager extends IDisposable {
  getLanguageServiceWorker: (...resources: Uri[]) => Promise<YAMLWorker>;
}

// 2min
const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000;

export function createWorkerManager(
  defaults: languages.yaml.LanguageServiceDefaults,
): WorkerManager {
  let worker: editor.MonacoWebWorker<YAMLWorker>;
  let client: Promise<YAMLWorker>;
  let lastUsedTime = 0;

  const stopWorker = (): void => {
    if (worker) {
      worker.dispose();
      worker = null;
    }
    client = null;
  };

  const idleCheckInterval = setInterval(() => {
    if (!worker) {
      return;
    }
    const timePassedSinceLastUsed = Date.now() - lastUsedTime;
    if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
      stopWorker();
    }
  }, 30 * 1000);

  const configChangeListener = defaults.onDidChange(() => stopWorker());

  const getClient = (): Promise<YAMLWorker> => {
    lastUsedTime = Date.now();

    if (!client) {
      worker = editor.createWebWorker<YAMLWorker>({
        // Module that exports the create() method and returns a `YAMLWorker` instance
        moduleId: 'vs/language/yaml/yamlWorker',

        label: defaults.languageId,

        // Passed in to the create() method
        createData: {
          languageSettings: defaults.diagnosticsOptions,
          languageId: defaults.languageId,
          enableSchemaRequest: defaults.diagnosticsOptions.enableSchemaRequest,
          prefix: defaults.diagnosticsOptions.prefix,
          isKubernetes: defaults.diagnosticsOptions.isKubernetes,
        },
      });

      client = worker.getProxy();
    }

    return client;
  };

  return {
    dispose() {
      clearInterval(idleCheckInterval);
      configChangeListener.dispose();
      stopWorker();
    },

    async getLanguageServiceWorker(...resources) {
      const client = await getClient();
      await worker.withSyncedResources(resources);
      return client;
    },
  };
}
