import { type ValidateFunction } from 'ajv'

export default class AJVStub {
  // eslint-disable-next-line class-methods-use-this
  compile(): ValidateFunction {
    return () => true
  }
}
