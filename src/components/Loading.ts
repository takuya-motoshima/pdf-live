/**
 * Show loading.
 */
export default class Loading {
  /** @type {HTMLDivElement} */
  protected readonly loadingNode: HTMLDivElement;

  /**
   * Construct loading.
   *
   * @param {HTMLElement} context
   */
  constructor(context: HTMLElement) {
    // Append loading node to #app node.
    context.insertAdjacentHTML('beforeend', this.render());

    // Keep the added loading node.
    this.loadingNode = context.lastChild as HTMLDivElement;
  }

  /**
   * Render the content of this component.
   *
   * @returns {string} Loading HTML.
   */
  protected render(): string {
    return `<div class="loading">
              <div class="loading-content">
                <div class="loading-spinner"></div>
              </div>
            </div>`;
  }

  /**
   * Show loading.
   *
   * @returns {Loading} The instance on which this method was called.
   */
  public show(): Loading {
    this.loadingNode.classList.add('loading-show');
    return this;
  }

  /**
   * Hide loading.
   *
   * @returns {Loading} The instance on which this method was called.
   */
  public hide(): Loading {
    this.loadingNode.classList.remove('loading-show');
    return this;
  }


  /**
   * Destroy loading.
   */
  public destroy(): void {
    this.loadingNode.remove();
  }
}