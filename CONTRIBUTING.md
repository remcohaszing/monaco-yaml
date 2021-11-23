# Contributing

## Prerequisites

The following are required to start working on this project:

- [Git](https://git-scm.com)
- [NodeJS](https://nodejs.org) 16 or higher
- [npm](https://github.com/npm/cli) 8.1.2 or higher

## Getting started

To get started with contributing, clone the repository and install its dependencies.

```sh
git clone https://github.com/remcohaszing/monaco-yaml
cd monaco-yaml
npm ci
```

## Building

To build the repository, run:

```sh
npm run prepack
```

## Running

To test it, run one of the
[examples](https://github.com/remcohaszing/monaco-yaml/tree/main/examples).

```sh
npm --workspace demo start
```
