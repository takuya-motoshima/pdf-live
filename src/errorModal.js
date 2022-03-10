import Modal from './Modal.js';

/**
 * Error modal.
 */
export default new (class extends Modal {
  /**
   * Render the content of this component.
   */
  render() {
    return `<div class="pl-modal pl-error-modal closed" data-element="errorModal">
              <div class="pl-modal-container">This is an error</div>
            </div>`;
  }
})()