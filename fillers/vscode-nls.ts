import { type LoadFunc, type LocalizeFunc } from 'vscode-nls'

const localize: LocalizeFunc = (key, message, ...args) =>
  args.length === 0
    ? message
    : message.replace(/{(\d+)}/g, (match, [index]) => (index in args ? String(args[index]) : match))

export function loadMessageBundle(): LocalizeFunc {
  return localize
}

export function config(): LoadFunc {
  return loadMessageBundle
}
