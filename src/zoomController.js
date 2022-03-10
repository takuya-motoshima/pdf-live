import pointInRectangle from './shared/pointInRectangle.js';

/**
 * Page zoom control.
 */
export default new (class {
  /**
   * Control the zoom factor change event of a PDF page.
   */
  constructor() {
    // Find dependent elements.
    this.zoomOverlayToggle = document.querySelector('[data-element="zoomOverlayToggle"]');
    this.zoomMenu = document.querySelector('[data-element="zoomMenu"]');
    this.zoomSelects = document.querySelectorAll('[data-element="zoomSelect"]');
    this.zoomOutButton = document.querySelector('[data-element="zoomOutButton"]');
    this.zoomInButton = document.querySelector('[data-element="zoomInButton"]');
    this.zoomInput = document.querySelector('[data-element="zoomInput"]');
  
    // All zoom factors that can be selected from the screen.
    this.scales = [...this.zoomSelects].flatMap(zoomSelect => {
      const scale = parseInt(zoomSelect.dataset.value, 10);
      return !isNaN(scale) ? scale : [];
    });

    // Zoom change event handler.
    this.changeZoomHandler = () => {};

    // Toggle the opening and closing of the zoom overlay.
    this.zoomOverlayToggle.addEventListener('click', (evnt) => {
      if (this.zoomMenu.classList.contains('closed')) {
        // Stops event propagation to the body so that the process of closing the zoom overlay for body click events does not run.
        evnt.stopPropagation();

        // Open zoom overlay.
        // Layout the zoom overlay.
        this.layout();

        // Open zoom overlay.
        this.open();
      } else
        // Close zoom overlay.
        this.close();
    }, {passive: true});

    // Change page scale.
    for (let zoomSelect of this.zoomSelects)
      zoomSelect.addEventListener('click', evnt => {
        // Close zoom menu.
        this.close();

        // Deselect a zoom item that was already selected.
        const currentZoom = [...this.zoomSelects].find(zoomSelect => zoomSelect.classList.contains('selected'));
        if (currentZoom)
          currentZoom.classList.remove('selected');

        // Activate the selected zoom item.
        evnt.target.classList.add('selected');

        // Calculate zoom factor.
        const scale = this.calcZoomFactorFromInputScale(evnt.target.dataset.value);

        // Set the zoom percentage to the text element.
        this.zoomInput.value = Math.floor(scale * 100);
        // if (!isNaN(parseInt(evnt.target.dataset.value, 10)))
        //   this.zoomInput.value = evnt.target.dataset.value;

        // Invoke zoom change event.
        this.changeZoomHandler(scale);
      }, {passive: true});

    // Recalculates the position of the zoom overlay element when the window is resized.
    window.addEventListener('resize', () => {
      // Layout the zoom overlay.
      this.layout();
    }, {passive: true});

    // When the screen is clicked.
    document.body.addEventListener('click', evnt => {
      // Close if zoom overlay is open.
      if (!this.zoomMenu.classList.contains('closed')
        && !pointInRectangle({x: evnt.pageX, y: evnt.pageY}, this.zoomMenu.getBoundingClientRect()))
        this.close();
    }, {passive: true});

    // Zoom out PDF page.
    this.zoomOutButton.addEventListener('click', () => {
      // Current zoom factor.
      const currentScale = parseInt(this.zoomInput.value, 10);

      // Set a zoom factor one step smaller than the current one.
      const minScale = Math.min(...this.scales);
      this.zoomInput.value = this.scales.sort((a, b) => b - a).find(scale => scale < currentScale) ?? minScale;

      // Calculate zoom factor.
      const scale = this.calcZoomFactorFromInputScale(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(scale);
    }, {passive: true});

    // Zoom in on PDF page.
    this.zoomInButton.addEventListener('click', () => {
      // Current zoom factor.
      const currentScale = parseInt(this.zoomInput.value, 10);

      // Set a zoom factor one step larger than the current one.
      const maxScale = Math.max(...this.scales);
      this.zoomInput.value = this.scales.sort((a, b) => a - b).find(scale => scale > currentScale) ?? maxScale;

      // Calculate zoom factor.
      const scale = this.calcZoomFactorFromInputScale(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(scale);
    }, {passive: true});

    // Hold down the Ctrl key and rotate the mouse wheel to zoom. 
    window.addEventListener('wheel', evnt => {
      evnt.preventDefault();
      console.log('Mouse wheel');
    }, {passive: false});
  }

  /**
   * Open zoom overlay.
   */
  open() {
    this.zoomMenu.classList.remove('closed');
  }

  /**
   * Close zoom overlay.
   */
  close() {
    this.zoomMenu.classList.add('closed');
  }

  /**
   * Layout the zoom overlay.
   */
  layout() {
    const rect =  this.zoomOverlayToggle.getBoundingClientRect();
    this.zoomMenu.style.top = `${rect.bottom}px`;
    this.zoomMenu.style.left = `${rect.left}px`;
  }

  /**
   * Calculate zoom factor from input scale.
   *
   * @param {string}
   * @return {number}
   */
  calcZoomFactorFromInputScale(inputScale) {
    console.log('inputScale=', inputScale);
    let scale = 1.0;
    if (!isNaN(parseInt(inputScale, 10)))
      scale = parseInt(inputScale, 10) / 100;
    else {
    }
    return scale;
  }

  /**
   * Returns the current zoom factor.
   *
   * @return {number}
   */
  getZoomFactor() {
    return this.calcZoomFactorFromInputScale(this.zoomInput.value);
  }

  /**
   * Zoom change event.
   * Returns the zoom factor to the event handler.
   *
   * @param {(scale: number): void => {}}
   */
  onChangeZoom(handler) {
    this.changeZoomHandler = handler;
  }
})()