import esbuild from 'esbuild';

const entryPoints = [
  'monaco-editor/esm/vs/editor/editor.worker.js',
  './yaml.worker.js',
  './test/index.ts',
];

for (const entryPoint of entryPoints) {
  esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: 'iife',
    outdir: 'test/out',
    loader: {
      '.ttf': 'file',
    },
  });
}
