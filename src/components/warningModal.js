import Modal from './Modal.js';

/**
 * Warning modal.
 */
export default new (class extends Modal {
  /**
   * Render the content of this component.
   */
  render() {
    return `<div class="pl-modal pl-warning-modal closed">
              <div class="pl-modal-container">
                <div class="pl-modal-header">Warning modal header</div>
                <div class="body">Warning modal body</div>
                <div class="pl-modal-footer">
                  <button class="pl-button pl-button-cancel pl-button-modal" data-element="WarningModalClearButton"><span>Cancel</span></button>
                  <button class="pl-button pl-button-confirm pl-button-modal" data-element="WarningModalSignButton"><span>OK</span></button>
                </div>
              </div>
            </div>`;
  }
})()