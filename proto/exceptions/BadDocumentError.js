import BaseError from './BaseError.js'

export default class BadDocumentError extends BaseError {
  /**
   * PDF document loading failure error.
   *
   * @param {string} message 
   */
  constructor(message) {
    // Pass the message to the parent constructor.
    super(message);
    this.name = 'BadDocumentError';
  }
}
