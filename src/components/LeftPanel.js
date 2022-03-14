/**
 * Left panel controller.
 */
export default class {
  /**
   * Controls opening and closing of the left panel and rendering of PDF page thumbnails.
   */
  constructor(pages) {
    // Find dependent elements.
    this.leftPanelToggle = document.querySelector('[data-element="leftPanelToggle"]');
    this.leftPanel = document.querySelector('[data-element="leftPanel"]');
    this.pagegContainer = document.querySelector('[data-element="pagegContainer"]');
    this.thumbnailsPanel = document.querySelector('[data-element="thumbnailsPanel"]');

    // Toggle the opening and closing of the left panel.
    this.leftPanelToggle.addEventListener('click', () => {
      if (this.leftPanel.classList.contains('closed'))
        this.open();
      else
        this.close();
    }, {passive: true});

    // Render thumbnail images.
    this.renderThumbnails(pages);
  }

  /**
   * Open the left panel.
   */
  open() {
    this.leftPanel.classList.remove('closed')
    this.pagegContainer.classList.add('open')
  }

  /**
   * Close left panel.
   */
  close() {
    this.leftPanel.classList.add('closed')
    this.pagegContainer.classList.remove('open')
  }

  /**
   * Render thumbnail images.
   */
  async renderThumbnails(pages) {
    // console.log('Start rendering thumbnails, pages=', pages);
    for (let num=1; num<=pages.length; num++) {
      // Fetch page.
      const page = pages[num - 1];

      // Calculate the display area of the page.
      const viewport = page.getViewport({scale: 1.5});

      // Create a thumbnail container node.
      const thumbnailNode = document.createElement('div');
      thumbnailNode.classList.add('pl-thumbnail');

      // Create a thumbnail image node.
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

      // Draw contents of a PDF file to a Canvas.
      page.render({canvasContext: canvas.getContext('2d'), viewport});
    }
  }
}