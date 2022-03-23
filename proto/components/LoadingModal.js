import Modal from './Modal.js';

/**
 * Show loading.
 */
export default class LoadingModal extends Modal {
  /**
   * Render the content of this component.
   *
   * @returns {string} Modal HTML.
   */
  render() {
    return `<div class="pl-modal pl-loading-modal pl-modal-hide">
              <div class="pl-modal-container">
                <div class="pl-loading-modal-spinner"></div>
              </div>
            </div>`;
  }
}