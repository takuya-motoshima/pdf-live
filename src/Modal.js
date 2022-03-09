/**
 * Modal base class.
 */
export default class {
  /**
   * Add modal element defined in subclass to body element.
   */
  constructor() {
    const appNode = document.querySelector('#app');
    appNode.insertAdjacentHTML('beforeend', this.render());
    this.modalNode = appNode.lastChild;
  }

  /**
   * Returns modal element HTML.
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