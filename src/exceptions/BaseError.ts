export default class BaseError extends Error {
  /**
   * Base error class.
   *
   * @param {string} message 
   */
  constructor(message?: string) {
    // Pass the message to the parent constructor.
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, this.constructor);
  }
}
