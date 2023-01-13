import Modal from '~/components/Modal';

/**
 * Error modal.
 */
export default class ErrorModal extends Modal {
  /** @type {HTMLDivElement} */
  private readonly message: HTMLDivElement;

  /**
   * Construct modal.
   */
  constructor(context: HTMLElement) {
    super(context);
    this.message = this.modalNode.querySelector('[data-element="message"]') as HTMLDivElement;
  }

  /**
   * Render the content of this component.
   */
  protected render(): string {
    return `<div class="pl-modal">
              <div class="pl-modal-dialog">
                <div class="pl-modal-content">
                  <div class="pl-modal-body">
                    <div data-element="message">This is an error</div>
                  </div>
                </div>
              </div>
            </div>`;
  }

  /**
   * Show modal.
   */
  public show(message?: string): ErrorModal {
    this.message.textContent = message as string;
    super.show();
    return this;
  }
}