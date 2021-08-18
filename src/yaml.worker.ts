import { initialize } from 'monaco-editor/esm/vs/editor/editor.worker';

import { createYAMLWorker } from './yamlWorker';

self.onmessage = () => {
  initialize((ctx, createData) => Object.create(createYAMLWorker(ctx, createData)));
};
