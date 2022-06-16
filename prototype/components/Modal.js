/**
 * Modal base class.
 */
export default class Modal {
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
   *
   * @returns {Modal} The instance on which this method was called.
   */
  show() {
    this.modalNode.classList.add('modal-show');
    return this;
  }

  /**
   * Hide modal.
   *
   * @returns {Modal} The instance on which this method was called.
   */
  hide() {
    this.modalNode.classList.remove('modal-show');
    return this;
  }

  /**
   * Destroy modal.
   */
  destroy() {
    this.modalNode.remove();
  }
}