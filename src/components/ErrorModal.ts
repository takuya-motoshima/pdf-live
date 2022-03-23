import Modal from '~/components/Modal';

/**
 * Error modal.
 */
export default class extends Modal {
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
    return `<div class="pl-modal pl-error-modal pl-modal-hide" data-element="errorModal">
              <div data-element="message" class="pl-modal-container">This is an error</div>
            </div>`;
  }

  /**
   * Show modal.
   *
   * @param {string} message
   */
  public show(message?: string): void {
    this.message.textContent = message as string;
    super.show();
  }
}