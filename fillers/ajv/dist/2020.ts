function getTrue(): boolean {
  return true
}

export default class AJV2020Stub {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  compile(): () => boolean {
    return getTrue
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  defaultMeta(): string {
    return "https://json-schema.org/draft/2020-12/schema"
  }
}
