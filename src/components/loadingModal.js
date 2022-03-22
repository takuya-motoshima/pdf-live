import Modal from './Modal.js';

/**
 * Show loading.
 */
export default new (class extends Modal {
  /**
   * Render the content of this component.
   */
  render() {
    return `<div class="pl-modal pl-loading-modal pl-modal-hide">
              <div class="pl-modal-container">
                <div class="pl-loading-modal-spinner"></div>
              </div>
            </div>`;
  }
})()