import Modal from './Modal.js';

/**
 * Error modal.
 */
export default class ErrorModal extends Modal {
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
    return `<div class="modal">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-body">
                    <div data-element="message">This is an error</div>
                  </div>
                </div>
              </div>
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