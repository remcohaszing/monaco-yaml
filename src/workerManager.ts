import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api';

import { WorkerAccessor } from './languageFeatures';
import { YAMLWorker } from './yamlWorker';

// 2min
const STOP_WHEN_IDLE_FOR = 2 * 60 * 1000;

export function createWorkerManager(
  defaults: languages.yaml.LanguageServiceDefaults,
): WorkerAccessor {
  let worker: editor.MonacoWebWorker<YAMLWorker>;
  let client: Promise<YAMLWorker>;
  let lastUsedTime = 0;

  setInterval(() => {
    if (!worker) {
      return;
    }
    const timePassedSinceLastUsed = Date.now() - lastUsedTime;
    if (timePassedSinceLastUsed > STOP_WHEN_IDLE_FOR) {
      worker.dispose();
      worker = undefined;
      client = undefined;
    }
  }, 30 * 1000);

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

  return async (...resources) => {
    const client = await getClient();
    await worker.withSyncedResources(resources);
    return client;
  };
}
