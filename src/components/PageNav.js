/**
 * Control page navigation.
 */
export default class {
  /**
   * Construct page navigation.
   */
  constructor() {
    // Find dependent elements.
    this.pageInput = document.querySelector('[data-element="pageInput"]');
    this.totalPage = document.querySelector('[data-element="totalPage"]');
    this.previousPageButton = document.querySelector('[data-element="previousPageButton"]');
    this.nextPageButton = document.querySelector('[data-element="nextPageButton"]');
  }
}