import Modal from './Modal.js';

/**
 * Error modal.
 */
export default class extends Modal {
  /**
   * Construct modal.
   */
  constructor(context) {
    super(context);
    this.message = this.modalNode.querySelector('[data-element="message"]');
  }

  /**
   * Render the content of this component.
   *
   * @returns {string} Modal HTML.
   */
  render() {
    return `<div class="pl-modal pl-error-modal pl-modal-hide" data-element="errorModal">
              <div data-element="message" class="pl-modal-container">This is an error</div>
            </div>`;
  }

  /**
   * Show modal.
   *
   * @param {string} message
   */
  show(message) {
    this.message.textContent = message;
    super.show();
  }
}