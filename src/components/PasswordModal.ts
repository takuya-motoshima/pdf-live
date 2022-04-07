import Modal from './Modal.js';

/**
 * Password input modal.
 */
export default new (class extends Modal {
  /**
   * Render the content of this component.
   *
   * @returns {string} Modal HTML.
   */
  render() {
    return `<div class="pl-modal pl-password-modal pl-modal-hide" data-element="passwordModal">
              <div class="pl-modal-container">
                <div class="pl-modal-wrapper">
                  <div class="pl-modal-header">Password required</div>
                  <form>
                    <div class="enter">
                      <div>This document is password protected. Please enter a password</div>
                      <input class="wrong" type="password" autocomplete="current-password" aria-label="Password required" value="">
                    </div>
                    <div class="incorrect-password">Incorrect password, attempts left: 4</div>
                    <div class="pl-modal-footer">
                      <button class="pl-button pl-button-cancel pl-button-modal" data-element="passwordCancelButton"><span>Cancel</span></button>
                      <button class="pl-button pl-button-confirm pl-button-modal" data-element="passwordSubmitButton"><span>Submit</span></button>
                    </div>
                  </form>
                </div>
              </div>
            </div>`;
  }
})()