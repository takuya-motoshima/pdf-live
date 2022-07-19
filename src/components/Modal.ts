import Language from '~/interfaces/Language';

/**
 * Modal base class.
 */
export default class Modal {
  /** @type {HTMLDivElement} */
  protected readonly modalNode: HTMLDivElement;

  /** @type {Language} */
  protected language: Language | undefined;

  /**
   * Construct modal. Add modal node defined in subclass to context.
   *
   * @param {HTMLElement} context
   * @param {Language}    language
   */
  constructor(context: HTMLElement, language?: Language) {
    // Set language.
    this.language = language;

    // Append modal node to #app node.
    context.insertAdjacentHTML('beforeend', this.render());

    // Keep the added modal node.
    this.modalNode = context.lastChild as HTMLDivElement;

    // Find and keep the data-element element.
    for (let node of Array.from(this.modalNode.querySelectorAll<HTMLElement>('[data-element]')))
      (this as any)[node.dataset.element as string] = node;
  }

  /**
   * Returns modal node HTML.
   *
   * @returns {string} Modal HTML.
   */
  protected render(): string {
    return '';
  }

  /**
   * Show modal.
   *
   * @returns {Modal} The instance on which this method was called.
   */
  public show(): Modal | Promise<void> {
    this.modalNode.classList.add('pl-modal-show');
    return this;
  }

  /**
   * Hide modal.
   *
   * @returns {Modal} The instance on which this method was called.
   */
  public hide(): Modal {
    this.modalNode.classList.remove('pl-modal-show');
    return this;
  }

  /**
   * Destroy modal 
   */
  public destroy(): void {
    this.modalNode.remove();
  }
}