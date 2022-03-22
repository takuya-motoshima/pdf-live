/**
 * Left panel controller.
 */
export default class LeftPanel {
  /**
   * Controls opening and closing of the left panel and rendering of page thumbnails.
   */
  constructor(pages) {
    // Find dependent nodes.
    this.leftPanelToggle = document.querySelector('[data-element="leftPanelToggle"]');
    this.leftPanel = document.querySelector('[data-element="leftPanel"]');
    this.pagegContainer = document.querySelector('[data-element="pagegContainer"]');
    this.thumbnailsPanel = document.querySelector('[data-element="thumbnailsPanel"]');
    this.thumbnailNodes = [];
    this.activeThumbnailNode = null;

    // Thumbnail selection event handler.
    this.selectThumbnailHandler = pageNum => {};

    // Toggle the opening and closing of the left panel.
    this.leftPanelToggle.addEventListener('click', () => {
      if (this.leftPanel.classList.contains('pl-left-panel-closed'))
        this.open();
      else
        this.close();
    }, {passive: true});

    // Render thumbnail images.
    this.renderThumbnails(pages).then(thumbnailNodes => {
      // Keep currently active thumbnail node.
      this.activeThumbnailNode = thumbnailNodes.find(
        thumbnailNode => thumbnailNode.classList.contains('pl-thumbnail-active'));

      // Add click event for thumbnail node.
      for (let thumbnailNode of thumbnailNodes) {
        thumbnailNode.addEventListener('click', evnt => {
          // Deactivate currently active thumbnails.
          this.activeThumbnailNode.classList.remove('pl-thumbnail-active');

          // Activate the selected thumbnail.
          evnt.currentTarget.classList.add('pl-thumbnail-active');
          this.activeThumbnailNode = evnt.currentTarget;

          // Invoke thumbnail selection event.
          const pageNum = parseInt(this.activeThumbnailNode.dataset.pageNumber, 10);
          this.selectThumbnailHandler(pageNum);
        }, {passive: true});
      }

      // Keep thumbnail nodes.
      this.thumbnailNodes = thumbnailNodes;
    });
  }

  /**
   * Open the left panel.
   */
  open() {
    this.leftPanel.classList.remove('pl-left-panel-closed')
    this.pagegContainer.classList.add('pl-page-container-open')
  }

  /**
   * Close left panel.
   */
  close() {
    this.leftPanel.classList.add('pl-left-panel-closed')
    this.pagegContainer.classList.remove('pl-page-container-open')
  }

  /**
   * Activate thumbnails.
   *
   * @param {number} pageNum
   */
  activateThumbnailPage(pageNum) {
    // Deactivate currently active thumbnails.
    if (this.activeThumbnailNode)
      this.activeThumbnailNode.classList.remove('pl-thumbnail-active');
 
    // Activates the thumbnail corresponding to the specified page number.
    const targetThumbnailNode = this.thumbnailNodes.find(thumbnailNode => thumbnailNode.dataset.pageNumber == pageNum);
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
   */
  async renderThumbnails(pages) {
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
      thumbnailNode.dataset.pageNumber = num;

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
      label.textContent = num;
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
   * Thumbnail selection event.
   * Returns the page number of the selected thumbnail to the handler.
   *
   * @param {(pageNum: number): void => {}}
   * @returns {LeftPanel} The instance on which this method was called.
   */
  onSelectThumbnail(handler) {
    this.selectThumbnailHandler = handler;
    return this;
  }
}