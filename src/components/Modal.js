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
   * Open modal.
   */
  open() {
    this.modalNode.classList.replace('closed', 'open');
  }

  /**
   * Close modal.
   */
  close() {
    this.modalNode.classList.replace('open', 'closed');
  }
}