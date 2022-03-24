import BaseError from '~/exceptions/BaseError';
export default class BadDocumentError extends BaseError {
    /**
     * PDF document loading failure error.
     *
     * @param {string} message
     */
    constructor(message?: string);
}
