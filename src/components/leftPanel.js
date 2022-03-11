/**
 * Left panel controller.
 */
export default new (class {
  /**
   * Controls opening and closing of the left panel and rendering of PDF page thumbnails.
   */
  constructor() {
    // Find dependent elements.
    this.leftPanelToggle = document.querySelector('[data-element="leftPanelToggle"]');
    this.leftPanel = document.querySelector('[data-element="leftPanel"]');
    this.pagegContainer = document.querySelector('[data-element="pagegContainer"]');

    // Toggle the opening and closing of the left panel.
    this.leftPanelToggle.addEventListener('click', () => {
      if (this.leftPanel.classList.contains('closed'))
        this.open();
      else
        this.close();
    }, {passive: true});
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
})()