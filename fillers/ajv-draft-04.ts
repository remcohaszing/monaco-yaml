import AJVStub from './ajv.js'

export default class AJVDraft04Stub extends AJVStub {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  override defaultMeta(): string {
    return 'http://json-schema.org/draft-04/schema'
  }
}
