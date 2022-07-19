import Modal from '~/components/Modal.js';

/**
 * Warning modal.
 */
export default class WarningModal extends Modal {
  /**
   * Render the content of this component.
   *
   * @returns {string} Modal HTML.
   */
  protected render(): string {
    return `<div class="pl-modal">
              <div class="pl-modal-dialog">
                <div class="pl-modal-content">
                  <div class="pl-modal-header">
                    <h2>Title</h2>
                  </div>
                  <div class="pl-modal-body">Message</div>
                  <div class="pl-modal-footer">
                    <button class="pl-btn pl-btn-cancel pl-btn-modal" data-element="WarningModalClearButton"><span>Cancel</span></button>
                    <button class="pl-btn pl-btn-confirm pl-btn-modal" data-element="WarningModalSignButton"><span>OK</span></button>
                  </div>
                </div>
              </div>
            </div>`;
  }
}