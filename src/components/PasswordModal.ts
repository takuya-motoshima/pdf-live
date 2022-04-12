import Modal from '~/components/Modal.js';
import Loading from '~/components/Loading';
import isAsyncFunction from '~/shared/isAsyncFunction';
import sleep from '~/shared/sleep';
import hbs from 'handlebars-extd';
import Language from '~/interfaces/Language';

/**
 * Password input modal.
 */
export default class PasswordModal extends Modal {
  /** @type {(password: string) => void} */
  private enterListener: (password: string) => boolean|Promise<boolean> = (password: string): boolean => false;

  /** @type {(() => void) | undefined} */
  private rslv: (() => void) | undefined;

  /** @type {((err: Error) => void) | undefined} */
  private rej: ((err: Error) => void) | undefined;

  /** @type {Loading} */
  private loading: Loading;

  /** @type {HTMLInputElement} */
  private passwordInput: HTMLInputElement;

  /** @type {HTMLDivElement} */
  private incorrect: HTMLDivElement;

  /** @type {HTMLButtonElement} */
  private submitButton: HTMLButtonElement;

  /**
   * Construct modal.
   *
   * @param {HTMLElement} context
   * @param {Language}    language
   */
  constructor(context: HTMLElement, language: Language) {
    super(context, language);

    // Password entry element.
    this.passwordInput = this.modalNode.querySelector('[data-element="passwordInput"]') as HTMLInputElement;

    // Error message.
    this.incorrect = this.modalNode.querySelector('[data-element="incorrect"]') as HTMLDivElement;

    // Submit button.
    this.submitButton = this.modalNode.querySelector('[type="submit"]') as HTMLButtonElement;

    // Loading.
    this.loading = new Loading(context);

    // Submit button is active only if the password is not blank.
    this.passwordInput.addEventListener('input', evnt => {
      // Deactivate submit button if password is blank.
      this.submitButton.disabled = (evnt.currentTarget as HTMLInputElement).value === '';
    });

    // Submit password form.
    this.modalNode.querySelector('[data-element="form"]')?.addEventListener('submit', async evnt => {
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
        let isCorrect: boolean;
        if (isAsyncFunction(this.enterListener))
          isCorrect = await this.enterListener(this.passwordInput.value);
        else
          isCorrect = this.enterListener(this.passwordInput.value) as boolean;

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
        this.rslv!();
      } catch (err) {
        // Destroy this.
        this.destroy();

        // Returns an error to the client.
        this.rej!(err as Error);
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
  render(): string {
    return hbs.compile(   
      `<div class="modal password-modal">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">{{language.message.passwordRequired}}</div>
            <div class="modal-body">
              <form data-element="form">
                <div class="enter">
                  <div>{{language.message.enterPassword}}</div>
                  <input data-element="passwordInput" type="password" autocomplete="current-password" aria-label="Password required">
                </div>
                <div data-element="incorrect" class="incorrect-password"></div>
              </form>
            </div>
            <div class="modal-footer">
              <!-- <button class="button button-cancel button-modal" data-element="passwordCancelButton"><span>Cancel</span></button> -->
              <button type="submit" class="button button-confirm button-modal" data-element="passwordSubmitButton" disabled><span>Submit</span></button>
            </div>
          </div>
        </div>
      </div>`)({language: this.language});
  }

  /**
   * Show modal.
   */
  public async show(): Promise<void> {
    super.show();

    // Focus on password entry field.
    this.passwordInput.focus();

    // The caller waits until the password is answered correctly.
    return new Promise((rslv, rej) => {
      this.rslv = rslv as () => void;
      this.rej = rej;
    });
  }

  /**
   * Destroy modal 
   */
  public destroy(): void {
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
  public onEnter(listener: (password: string) => boolean|Promise<boolean>): PasswordModal {
    this.enterListener = listener;
    return this;
  }
}