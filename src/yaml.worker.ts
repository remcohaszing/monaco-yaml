import * as worker from 'monaco-editor/esm/vs/editor/editor.worker';

import { YAMLWorker } from './yamlWorker';

self.onmessage = () => {
  // Ignore the first message
  worker.initialize((ctx, createData) => new YAMLWorker(ctx, createData));
};
