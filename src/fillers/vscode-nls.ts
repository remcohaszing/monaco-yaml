export interface Options {
  locale?: string
  cacheLanguageResolution?: boolean
}
export interface LocalizeInfo {
  key: string
  comment: string[]
}
export type LocalizeFunc = (
  info: LocalizeInfo | string,
  message: string,
  ...args: string[]
) => string
export type LoadFunc = (file?: string) => LocalizeFunc

function format(message: string, args: string[]): string {
  return args.length === 0
    ? message
    : message.replace(/{(\d+)}/g, (match, [index]: number[]) =>
        index in args ? args[index] : match
      )
}

const localize: LocalizeFunc = (key, message, ...args) => format(message, args)

export function loadMessageBundle(): LocalizeFunc {
  return localize
}

export function config(): LoadFunc {
  return loadMessageBundle
}
