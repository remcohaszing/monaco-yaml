function getTrue(): boolean {
  return true
}

export default class AJVStub {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  compile(): () => boolean {
    return getTrue
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  defaultMeta(): string {
    return 'http://json-schema.org/draft-07/schema'
  }
}
