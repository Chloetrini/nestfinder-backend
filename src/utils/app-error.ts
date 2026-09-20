// Throw this from controllers/services for expected failures. The global
// error handler turns it into a { success: false, message } response.
export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}
