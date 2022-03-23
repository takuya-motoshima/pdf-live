/**
 * Left panel controller.
 */
export default class LeftPanel {
  /** @type {HTMLButtonElement} */
  private readonly leftPanelToggle: HTMLButtonElement;

  /** @type {HTMLDivElement} */
  private readonly leftPanel: HTMLDivElement;

  /** @type {HTMLDivElement} */
  private readonly pagegContainer: HTMLDivElement;

  /** @type {HTMLDivElement} */
  private readonly thumbnailsPanel: HTMLDivElement;

  /** @type {HTMLDivElement[]} */
  private readonly thumbnailNodes: HTMLDivElement[] = [];

  /** @type {HTMLDivElement|null} */
  private activeThumbnailNode: HTMLDivElement|undefined = undefined;

  /** @type {(pageNum: number) => void} */
  private selectHandler: (pageNum: number) => void = (pageNum: number): void => {};

  /**
   * Controls opening and closing of the left panel and rendering of page thumbnails.
   * 
   * @param {HTMLElement} context
   * @param {any[]}       pages
   */
  constructor(context: HTMLElement, pages: any[]) {
    // Find dependent nodes.
    this.leftPanelToggle = context.querySelector('[data-element="leftPanelToggle"]') as HTMLButtonElement;
    this.leftPanel = context.querySelector('[data-element="leftPanel"]') as HTMLDivElement;
    this.pagegContainer = context.querySelector('[data-element="pagegContainer"]') as HTMLDivElement;
    this.thumbnailsPanel = context.querySelector('[data-element="thumbnailsPanel"]') as HTMLDivElement;

    // Toggle the opening and closing of the left panel.
    this.leftPanelToggle.addEventListener('click', () => {
      if (this.leftPanel.classList.contains('pl-left-panel-closed'))
        this.open();
      else
        this.close();
    }, {passive: true});

    // Render thumbnail images.
    this.thumbnailNodes = this.render(pages);

    // Keep currently active thumbnail node.
    this.activeThumbnailNode = this.thumbnailNodes.find(
      thumbnailNode => thumbnailNode.classList.contains('pl-thumbnail-active'));

    // Add click event for thumbnail node.
    for (let thumbnailNode of this.thumbnailNodes) {
      thumbnailNode.addEventListener('click', evnt => {
        // Deactivate currently active thumbnails.
        this.activeThumbnailNode!.classList.remove('pl-thumbnail-active');

        // Activate the selected thumbnail.
        (evnt.currentTarget! as HTMLDivElement).classList.add('pl-thumbnail-active');
        this.activeThumbnailNode = evnt.currentTarget as HTMLDivElement;

        // Invoke thumbnail selection event.
        const pageNum = parseInt(this.activeThumbnailNode.dataset.pageNumber as string, 10);
        this.selectHandler(pageNum);
      }, {passive: true});
    }
  }

  /**
   * Open the left panel.
   */
  public open(): void {
    this.leftPanel.classList.remove('pl-left-panel-closed')
    this.pagegContainer.classList.add('pl-page-container-open')
  }

  /**
   * Close left panel.
   */
  public close(): void {
    this.leftPanel.classList.add('pl-left-panel-closed')
    this.pagegContainer.classList.remove('pl-page-container-open')
  }

  /**
   * Activate thumbnails.
   *
   * @param {number} pageNum
   */
  public activatePage(pageNum: number): void {
    // Deactivate currently active thumbnails.
    if (this.activeThumbnailNode)
      this.activeThumbnailNode.classList.remove('pl-thumbnail-active');
 
    // Activates the thumbnail corresponding to the specified page number.
    const targetThumbnailNode = this.thumbnailNodes.find(thumbnailNode => thumbnailNode.dataset.pageNumber == pageNum.toString());
    if (targetThumbnailNode) {
      // Activate the target thumbnail.
      targetThumbnailNode.classList.add('pl-thumbnail-active');
      this.activeThumbnailNode = targetThumbnailNode;

      // Change the scroll position of the thumbnail viewer to a position where the active thumbnail node can be displayed.
      const panelRect = this.thumbnailsPanel.getBoundingClientRect();
      const thumbnailRect = this.activeThumbnailNode.getBoundingClientRect();
      const isViewable = thumbnailRect.top >= panelRect.top && thumbnailRect.top <= panelRect.top + this.thumbnailsPanel.clientHeight;
      if (!isViewable)
        this.thumbnailsPanel.scrollTop = thumbnailRect.top + this.thumbnailsPanel.scrollTop - panelRect.top;
    }
  }

  /**
   * Render thumbnail images.
   *
   * @param   {any[]} pages
   * @returns {HTMLDivElement[]}
   */
  private render(pages: any[]): HTMLDivElement[] {
    // console.log('Start rendering thumbnails, pages=', pages);
    const thumbnailNodes = [];
    for (let num=1; num<=pages.length; num++) {
      // Fetch page.
      const page = pages[num - 1];

      // Calculate the display area of the page.
      const viewport = page.getViewport({scale: 1.5});

      // Create a thumbnail container node.
      const thumbnailNode = document.createElement('div');
      thumbnailNode.classList.add('pl-thumbnail');
      thumbnailNode.dataset.pageNumber = num.toString();

      // Activate the thumbnail on the first page.
      if (num === 1)
        thumbnailNode.classList.add('pl-thumbnail-active');    

      // Create a canvas node.
      const canvas = document.createElement('canvas');
      canvas.classList.add('pl-thumbnail-image');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      thumbnailNode.appendChild(canvas);

      // Create a thumbnail number label node.
      const label = document.createElement('div');
      label.classList.add('pl-thumbnail-label');
      label.textContent = num.toString();
      thumbnailNode.appendChild(label);

      // Append Thumbnail Container Node.
      this.thumbnailsPanel.appendChild(thumbnailNode)

      // Render page content on canvas.
      page.render({canvasContext: canvas.getContext('2d'), viewport});

      // Set the created thumbnail node as the return value.
      thumbnailNodes.push(thumbnailNode);
    }
    return thumbnailNodes;
  }

  /**
   * Thumbnail selection event. Returns the page number of the selected thumbnail to the handler.
   *
   * @param   {(pageNum: number) => void}
   * @returns {LeftPanel} The instance on which this method was called.
   */
  onSelect(handler: (pageNum: number) => void) {
    this.selectHandler = handler;
    return this;
  }
}