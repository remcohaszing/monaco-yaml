import AJVStub from '../../ajv.js'

export default class AJV2019Stub extends AJVStub {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  override defaultMeta(): string {
    return "https://json-schema.org/draft/2019-09/schema"
  }
}
