/**
 * Modal base class.
 */
export default class {
  /**
   * Add modal node defined in subclass to body node.
   */
  constructor() {
    const appNode = document.querySelector('#app');
    appNode.insertAdjacentHTML('beforeend', this.render());
    this.modalNode = appNode.lastChild;
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