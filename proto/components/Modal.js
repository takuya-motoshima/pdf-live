/**
 * Modal base class.
 */
export default class {
  /**
   * Construct modal. Add modal node defined in subclass to context.
   *
   * @param {HTMLElement} context
   */
  constructor(context) {
    // Append modal node to #app node.
    context.insertAdjacentHTML('beforeend', this.render());

    // Keep the added modal node.
    this.modalNode = context.lastChild;

    // Find and keep the data-element element.
    for (let node of Array.from(this.modalNode.querySelectorAll<HTMLElement>('[data-element]')))
      this[node.dataset.element] = node;
  }

  /**
   * Returns modal node HTML.
   */
  render() {}

  /**
   * Show modal.
   */
  show() {
    this.modalNode.classList.replace('pl-modal-hide', 'pl-modal-show');
  }

  /**
   * Hide modal.
   */
  hide() {
    this.modalNode.classList.replace('pl-modal-show', 'pl-modal-hide');
  }
}