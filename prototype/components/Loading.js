/**
 * Show loading.
 */
export default class Loading {
  /**
   * Construct loading.
   *
   * @param {HTMLElement} context
   */
  constructor(context) {
    // Append loading node to #app node.
    context.insertAdjacentHTML('beforeend', this.render());

    // Keep the added loading node.
    this.loadingNode = context.lastChild;
  }

  /**
   * Render the content of this component.
   *
   * @returns {string} Loading HTML.
   */
  render() {
    return `<div class="pl-loading">
              <div class="pl-loading-content">
                <div class="pl-loading-spinner"></div>
              </div>
            </div>`;
  }

  /**
   * Show loading.
   *
   * @returns {Loading} The instance on which this method was called.
   */
  show() {
    this.loadingNode.classList.add('pl-loading-show');
    return this;
  }

  /**
   * Hide loading.
   *
   * @returns {Loading} The instance on which this method was called.
   */
  hide() {
    this.loadingNode.classList.remove('pl-loading-show');
    return this;
  }


  /**
   * Destroy loading.
   */
  destroy() {
    this.loadingNode.remove();
  }
}