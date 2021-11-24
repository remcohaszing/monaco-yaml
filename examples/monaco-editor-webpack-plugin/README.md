# Monaco Editor Webpack Loader Plugin Example

This demo demonstrates how bundle `monaco-editor` and `monaco-yaml` with
[monaco-editor-webpack-plugin](https://github.com/microsoft/monaco-editor/tree/main/webpack-plugin).
The build output is
[esm library](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). Example is
based on
[link](https://github.com/microsoft/monaco-editor/tree/main/samples/browser-esm-webpack-monaco-plugin).
To start it, simply run:

## Prerequisites

- [NodeJS](https://nodejs.org) 16 or higher
- [npm](https://github.com/npm/cli) 8.1.2 or higher

## Setup

To run the project locally, clone the repository and set it up:

```sh
git clone https://github.com/remcohaszing/monaco-yaml
cd monaco-yaml
npm ci
npm run prepack
```

## Running

To start it, simply run:

```sh
npm --workspace monaco-editor-webpack-plugin-example start
```

The demo will open in your browser.
