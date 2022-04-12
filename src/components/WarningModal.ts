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
    return `<div class="modal">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">Warning modal header</div>
                  <div class="modal-body">Warning modal body</div>
                  <div class="modal-footer">
                    <button class="button button-cancel button-modal" data-element="WarningModalClearButton"><span>Cancel</span></button>
                    <button class="button button-confirm button-modal" data-element="WarningModalSignButton"><span>OK</span></button>
                  </div>
                </div>
              </div>
            </div>`;
  }
}