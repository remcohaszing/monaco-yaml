function getTrue(): boolean {
  return true
}

export default class AJVStub {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  compile(): () => boolean {
    return getTrue
  }
}
