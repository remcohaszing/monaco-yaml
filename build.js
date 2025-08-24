import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { build } from 'esbuild'

import pkg from './package.json' with { type: 'json' }

await build({
  entryPoints: ['src/index.ts', 'src/yaml.worker.ts'],
  bundle: true,
  external: Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }),
  logLevel: 'info',
  outdir: '.',
  sourcemap: true,
  format: 'esm',
  target: ['es2019'],
  plugins: [
    {
      name: 'alias',
      setup({ onLoad, onResolve, resolve }) {
        // The file monaco-yaml/lib/esm/schemaSelectionHandlers.js imports code from the language
        // server part that we don’t want.
        onResolve({ filter: /\/schemaSelectionHandlers$/ }, () => ({
          path: join(import.meta.dirname, 'fillers/schemaSelectionHandlers.ts')
        }))
        // The yaml language service only imports re-exports of vscode-languageserver-types from
        // vscode-languageserver.
        onResolve({ filter: /^vscode-languageserver(\/node|-protocol)?$/ }, () => ({
          path: 'vscode-languageserver-types',
          external: true,
          sideEffects: false
        }))
        // Ajv would significantly increase bundle size.
        onResolve({ filter: /^ajv$/ }, () => ({
          path: join(import.meta.dirname, 'fillers/ajv.ts')
        }))
        // We only need cloneDeep from lodash. This can be replaced with structuredClone.
        onResolve({ filter: /^lodash$/ }, () => ({
          path: join(import.meta.dirname, 'fillers/lodash.ts')
        }))
        // The yaml language service uses path. We can stub it using path-browserify.
        onResolve({ filter: /^path$/ }, () => ({
          path: 'path-browserify',
          external: true,
          sideEffects: false
        }))
        // This tiny filler implementation serves all our needs.
        onResolve({ filter: /vscode-nls/ }, () => ({
          path: join(import.meta.dirname, 'fillers/vscode-nls.ts'),
          sideEffects: false
        }))
        // The language server dependencies tend to write both ESM and UMD output alongside each
        // other, then use UMD for imports. We prefer ESM.
        onResolve({ filter: /\/umd\// }, ({ path, ...options }) =>
          resolve(path.replace(/\/umd\//, '/esm/'), options)
        )
        onResolve({ filter: /.*/, namespace: 'file' }, async ({ path, ...options }) => ({
          ...(await resolve(path, { ...options, namespace: 'side-effect-free' })),
          sideEffects: false
        }))
        onLoad({ filter: /yamlSchemaService\.js$/ }, async ({ path }) => ({
          contents: (await readFile(path, 'utf8')).replaceAll(
            "require('ajv/dist/refs/json-schema-draft-07.json')",
            'undefined'
          )
        }))
      }
    }
  ]
})
