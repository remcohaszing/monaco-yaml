export const ErrorCodes = {}

export class ResponseError extends Error {
  name = 'ResponseError'

  constructor(code: number, message: string) {
    super(message)
  }
}
