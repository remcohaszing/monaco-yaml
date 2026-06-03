import AJVStub from '../../ajv.js'

export default class AJV2020Stub extends AJVStub {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  override defaultMeta(): string {
    return "https://json-schema.org/draft/2020-12/schema"
  }
}
