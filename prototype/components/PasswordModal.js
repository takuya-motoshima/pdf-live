import Modal from './Modal.js';
import Loading from '../components/Loading.js';
import isAsyncFunction from '../shared/isAsyncFunction.js';
import sleep from '../shared/sleep.js';

/**
 * Password input modal.
 */
export default class PasswordModal extends Modal {
  /**
   * Construct modal.
   *
   * @param {HTMLElement} context
   */
  constructor(context) {
    super(context);

    // Callback to be executed if the password is correct.
    this.rslv = null;
    this.rej = null;

    // Password entry element.
    this.passwordInput = this.modalNode.querySelector('[data-element="passwordInput"]');

    // Error message.
    this.incorrect = this.modalNode.querySelector('[data-element="incorrect"]');

    // Submit button.
    this.submitButton = this.modalNode.querySelector('[type="submit"]');

    // Listener for Password Enter events.
    this.enterListener = async password => {};

    // Loading.
    this.loading = new Loading(context);

    // Submit button is active only if the password is not blank.
    this.passwordInput.addEventListener('input', evnt => {
      // Deactivate submit button if password is blank.
      this.submitButton.disabled = evnt.currentTarget.value === '';
    });

    // Submit password form.
    this.modalNode.querySelector('[data-element="form"]').addEventListener('submit', async evnt => {
      evnt.preventDefault();

      // Submit Start Time.
      const startTime = +new Date();

      // Minimum Loading Seconds.
      const minLoadingSeconds = 1;

      try {
        // Deactivate the submit button.
        this.submitButton.disabled = true;

        // Show loading.
        this.loading.show();

        // Listen for password change events. Password checking is done by the client program.
        let isCorrect;
        if (isAsyncFunction(this.enterListener))
          isCorrect = await this.enterListener(this.passwordInput.value);
        else
          isCorrect = this.enterListener(this.passwordInput.value);

        //  Display error message if password is incorrect. 
        if (!isCorrect) {
          // Show loading for at least 1 second.
          await sleep(minLoadingSeconds - ((+new Date() - startTime) / 1000));

          // Hide loading.
          this.loading.hide();

          // Show error messages.
          this.incorrect.textContent = 'Incorrect password';
          return void this.passwordInput.classList.add('wrong');
        }

        // Set the correct CSS class in the password input field.
        this.passwordInput.classList.remove('wrong');
        this.passwordInput.classList.add('correct');

        // Clear error messages.
        this.incorrect.textContent = '';

        // Show loading for at least 1 second.
        await sleep(minLoadingSeconds - ((+new Date() - startTime) / 1000));

        // Destroy this.
        this.destroy();

        // If the password is correct, resolve the Promise returned to the client when the password input form is opened.
        this.rslv();
      } catch (err) {
        // Destroy this.
        this.destroy();

        // Returns an error to the client.
        this.rej(err);
      } finally {
        // Activate submit button.
        this.submitButton.disabled = false;
      }
    }, {passive: false});
  }

  /**
   * Render the content of this component.
   *
   * @returns {string} Modal HTML.
   */
  render() {
    return `<div class="pl-modal pl-modal-password">
              <div class="pl-modal-dialog">
                <div class="pl-modal-content">
                  <div class="pl-modal-header">
                    <h2>Password required</h2>
                  </div>
                  <div class="pl-modal-body">
                    <form data-element="form" id="passwordForm">
                      <div class="enter">
                        <div>This document is password protected. Please enter a password</div>
                        <input data-element="passwordInput" type="password" autocomplete="current-password" aria-label="Password required">
                      </div>
                      <div data-element="incorrect" class="incorrect-password"></div>
                    </form>
                  </div>
                  <div class="pl-modal-footer">
                    <button form="passwordForm" type="submit" class="pl-btn pl-btn-confirm pl-btn-modal" data-element="passwordSubmitButton" disabled><span>Submit</span></button>
                  </div>
                </div>
              </div>
            </div>`;
  }

  /**
   * Show modal.
   */
  async show() {
    super.show();

    // Focus on password entry field.
    setTimeout(() => this.passwordInput.focus());

    // The caller waits until the password is answered correctly.
    return new Promise((rslv, rej) => {
      this.rslv = rslv;
      this.rej = rej;
    });
  }

  /**
   * Destroy modal 
   */
  destroy() {
    // Destroy loading.
    this.loading.destroy();

    // Destroy this.
    super.destroy();
  }

  /**
   * Password enter event. Returns the password entered to the event listener.
   *
   * @param   {(password: string) => boolean|Promise<boolean>}
   * @returns {PasswordModal} The instance on which this method was called.
   */
  onEnter(listener) {
    this.enterListener = listener;
    return this;
  }
}