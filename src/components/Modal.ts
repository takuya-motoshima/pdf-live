/**
 * Modal base class.
 */
export default class {
  /** @type {HTMLDivElement} */
  protected readonly modalNode: HTMLDivElement;

  /**
   * Construct modal. Add modal node defined in subclass to context.
   *
   * @param {HTMLElement} context
   */
  constructor(context: HTMLElement) {
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
   */
  protected render(): string {
    return '';
  }

  /**
   * Show modal.
   */
  public show(): void {
    this.modalNode.classList.replace('pl-modal-hide', 'pl-modal-show');
  }

  /**
   * Hide modal.
   */
  public hide(): void {
    this.modalNode.classList.replace('pl-modal-show', 'pl-modal-hide');
  }
}