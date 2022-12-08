import { fileURLToPath } from 'url';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { type PlaywrightTestConfig } from '@playwright/test';
import { serve } from 'esbuild';

const { port } = await serve(
  { servedir: fileURLToPath(new URL('test', import.meta.url)) },
  {
    entryPoints: {
      'editorWorkerService.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
      'yaml.worker': fileURLToPath(new URL('yaml.worker.js', import.meta.url)),
      index: fileURLToPath(new URL('test/index.ts', import.meta.url)),
    },
    bundle: true,
    format: 'iife',
    loader: {
      '.ttf': 'file',
    },
  },
);

const config: PlaywrightTestConfig = {
  reporter: 'html',
  timeout: 120_000,
  webServer: {
    command: '',
    port,
    reuseExistingServer: true,
  },
};
export default config;
