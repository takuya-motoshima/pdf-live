/**
 * Show loading.
 */
export default class Loading {
  /** @type {HTMLDivElement} */
  protected readonly loadingNode: HTMLDivElement;

  /**
   * Construct loading.
   */
  constructor(context: HTMLElement) {
    // Append loading node to #app node.
    context.insertAdjacentHTML('beforeend', this.render());

    // Keep the added loading node.
    this.loadingNode = context.lastChild as HTMLDivElement;
  }

  /**
   * Render the content of this component.
   */
  protected render(): string {
    return `<div class="pl-loading">
              <div class="pl-loading-content">
                <div class="pl-loading-spinner"></div>
              </div>
            </div>`;
  }

  /**
   * Show loading.
   */
  public show(): Loading {
    this.loadingNode.classList.add('pl-loading-show');
    return this;
  }

  /**
   * Hide loading.
   */
  public hide(): Loading {
    this.loadingNode.classList.remove('pl-loading-show');
    return this;
  }


  /**
   * Destroy loading.
   */
  public destroy(): void {
    this.loadingNode.remove();
  }
}