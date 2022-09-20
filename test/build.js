import { fileURLToPath } from 'url';

import { build } from 'esbuild';

await build({
  entryPoints: {
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'yaml.worker': fileURLToPath(new URL('../yaml.worker.js', import.meta.url)),
    index: fileURLToPath(new URL('index.ts', import.meta.url)),
  },
  bundle: true,
  format: 'iife',
  outdir: fileURLToPath(new URL('out/', import.meta.url)),
  loader: {
    '.ttf': 'file',
  },
});
