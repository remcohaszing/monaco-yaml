const { promises: fs } = require('fs');
const { join } = require('path');

const { build } = require('esbuild');

const { dependencies, peerDependencies } = require('./package.json');

fs.rm(join(__dirname, 'lib'), { force: true, recursive: true })
  .then(() =>
    build({
      entryPoints: ['src/monaco.contribution.ts', 'src/yaml.worker.ts'],
      bundle: true,
      external: Object.keys({ ...dependencies, ...peerDependencies }),
      logLevel: 'info',
      outdir: 'lib/esm',
      sourcemap: true,
      format: 'esm',
      target: ['es2019'],
      plugins: [
        {
          name: 'alias',
          setup({ onResolve }) {
            onResolve({ filter: /^prettier$/ }, () => ({
              path: 'prettier/standalone',
              external: true,
            }));
            onResolve({ filter: /vscode-nls/ }, () => ({
              path: require.resolve('./src/fillers/vscode-nls.ts'),
            }));
            onResolve({ filter: /\/umd\// }, (args) => ({
              path: require.resolve(args.path.replace(/\/umd\//, '/esm/'), {
                paths: [args.resolveDir],
              }),
            }));
          },
        },
      ],
    }),
  )
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
