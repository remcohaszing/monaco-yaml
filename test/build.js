import { fileURLToPath } from 'url';

import { build } from 'esbuild';

await build({
  entryPoints: {
    'editor.worker.js': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'yaml.worker.js': fileURLToPath(new URL('../yaml.worker.js', import.meta.url)),
    'index.js': fileURLToPath(new URL('index.ts', import.meta.url)),
  },
  bundle: true,
  format: 'iife',
  outdir: fileURLToPath(new URL('out/', import.meta.url)),
  loader: {
    '.ttf': 'file',
  },
});
