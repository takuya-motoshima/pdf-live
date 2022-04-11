import Modal from '~/components/Modal';

/**
 * Error modal.
 */
export default class ErrorModal extends Modal {
  /** @type {HTMLDivElement} */
  private readonly message: HTMLDivElement;

  /**
   * Construct modal.
   *
   * @param {HTMLElement} context
   */
  constructor(context: HTMLElement) {
    super(context);
    this.message = this.modalNode.querySelector('[data-element="message"]') as HTMLDivElement;
  }

  /**
   * Render the content of this component.
   *
   * @returns {string} Modal HTML.
   */
  protected render(): string {
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
  public show(message?: string): ErrorModal {
    this.message.textContent = message as string;
    super.show();
    return this;
  }
}