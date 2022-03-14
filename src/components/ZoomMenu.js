import pointInRectangle from '../shared/pointInRectangle.js';
import isNumber from '../shared/isNumber.js';

/**
 * Page zoom control.
 */
export default class {
  /**
   * Control the zoom factor change event of a PDF page.
   */
  constructor(standardViewport) {
    // Keep page width and height for zoom factor calculation to fit by page or width.
    this.standardViewport = standardViewport;
    // console.log(`Page width and height: ${this.standardViewport.width}/${this.standardViewport.height}`);

    // Find dependent elements.
    this.zoomOverlayToggle = document.querySelector('[data-element="zoomOverlayToggle"]');
    this.zoomMenu = document.querySelector('[data-element="zoomMenu"]');
    this.zoomSelects = document.querySelectorAll('[data-element="zoomSelect"]');
    this.zoomOutButton = document.querySelector('[data-element="zoomOutButton"]');
    this.zoomInButton = document.querySelector('[data-element="zoomInButton"]');
    this.zoomInput = document.querySelector('[data-element="zoomInput"]');
    this.pageView = document.querySelector('[data-element="pageView"]');

    // Preventing multiple launches of resizing events.
    this.resizeTimeout = null;

    // All zooms that can be selected from the screen.
    this.zoomList = [...this.zoomSelects].flatMap(zoomSelect => {
      const zoom = parseInt(zoomSelect.dataset.value, 10);
      return isNumber(zoom) ? zoom : [];
    });

    // Minimum zoom.
    this.minZoom = Math.min(...this.zoomList);

    // Maximum zoom.
    this.maxZoom = Math.max(...this.zoomList);

    // Zoom change event handler.
    this.changeZoomHandler = () => {};

    // Toggle the opening and closing of the zoom overlay.
    this.zoomOverlayToggle.addEventListener('click', (evnt) => {
      if (this.zoomMenu.classList.contains('closed')) {
        // Stops event propagation to the body so that the process of closing the zoom overlay for body click events does not run.
        evnt.stopPropagation();

        // Layout the zoom overlay.
        this.layout();

        // Open zoom overlay.
        this.open();
      } else
        // Close zoom overlay.
        this.close();
    }, {passive: true});

    // Change zoom factor.
    for (let zoomSelect of this.zoomSelects)
      zoomSelect.addEventListener('click', evnt => {
        // Close zoom menu.
        this.close();

        // Deselect a zoom item that was already selected.
        this.deselectZoomMenu();

        // Activate the selected zoom item.
        evnt.target.classList.add('selected');

        // Calculate zoom factor.
        const zoomFactor = this.calcZoomFactor(evnt.target.dataset.value);

        // Set the zoom percentage to the text element.
        this.zoomInput.value = Math.floor(zoomFactor * 100);

        // Invoke zoom change event.
        this.changeZoomHandler(zoomFactor);
      }, {passive: true});

    // When the window is resized.
    window.addEventListener('resize', () => {
      // Preventing multiple launches of resizing events.
      if (this.resizeTimeout)
        clearTimeout(this.resizeTimeout);

      this.resizeTimeout = setTimeout(() => {
        // Recalculates the position of the zoom overlay element.
        this.layout();

        // If the zoom mode is "page fit" or "width fit", resize the page.
        const curZoomSelect = document.querySelector('[data-element="zoomSelect"].selected').dataset.value;
        if (curZoomSelect === 'pageFit' || curZoomSelect === 'pageWidth') {
          // Calculate zoom factor.
          const zoomFactor = this.calcZoomFactor(curZoomSelect);

          // Invoke zoom change event.
          this.changeZoomHandler(zoomFactor);
        }
      }, 100);
    }, {passive: true});

    // When the screen is clicked.
    document.body.addEventListener('click', evnt => {
      // Close if zoom overlay is open.
      if (!this.zoomMenu.classList.contains('closed')
        && !pointInRectangle({x: evnt.pageX, y: evnt.pageY}, this.zoomMenu.getBoundingClientRect()))
        this.close();
    }, {passive: true});

    // Zoom out the page.
    this.zoomOutButton.addEventListener('click', () => {
      // Current zoom factor.
      const curZoom = parseInt(this.zoomInput.value, 10);

      // Set a zoom factor one step smaller than the current one.
      this.zoomInput.value = this.zoomList.sort((a, b) => b - a).find(zoom => zoom < curZoom) ?? this.minZoom;

      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoom;

      // Activate the zoom-in button.
      this.zoomInButton.disabled = false;

      // Activate the zoom menu that matches the current zoom factor.
      this.activateZoomMenuFromValue(this.zoomInput.value);

      // Calculate zoom factor.
      const zoomFactor = this.calcZoomFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(zoomFactor);
    }, {passive: true});

    // Zoom in on the page.
    this.zoomInButton.addEventListener('click', () => {
      // Current zoom factor.
      const curZoom = parseInt(this.zoomInput.value, 10);

      // Set a zoom factor one step larger than the current one.
      this.zoomInput.value = this.zoomList.sort((a, b) => a - b).find(zoom => zoom > curZoom) ?? this.maxZoom;

      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoom;

      // Activate the zoom out button.
      this.zoomOutButton.disabled = false;

      // Activate the zoom menu that matches the current zoom factor.
      this.activateZoomMenuFromValue(this.zoomInput.value);

      // Calculate zoom factor.
      const zoomFactor = this.calcZoomFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(zoomFactor);
    }, {passive: true});

    // Hold down the Ctrl key and rotate the mouse wheel to zoom. 
    window.addEventListener('wheel', evnt => {
      // Do nothing if the Ctrl key is not pressed.
      if (!evnt.ctrlKey)
        return;

      // Stop existing mouse wheel action.
      evnt.preventDefault();

      // Calculate the next zoom factor.
      const curZoom = parseInt(this.zoomInput.value, 10);
      let newZoom = curZoom;
      if (evnt.deltaY < 0) {
        // Rotate the mouse wheel upwards to zoom in.

        // Activate the zoom out button.
        this.zoomOutButton.disabled = false;

        // Do nothing if the current zoom factor is maximum.
        if (curZoom >= this.maxZoom)
          return;

        // Calculate new zoom factor.
        const multiple = 1.25;
        newZoom = Math.min(Math.floor(curZoom * multiple), this.maxZoom);
        
        // When the zoom factor reaches the maximum, disable the zoom-in button.
        this.zoomInButton.disabled = newZoom >= this.maxZoom;
      } else if (evnt.deltaY > 0) {
        // Rotate the mouse wheel downwards to zoom out.
        // Activate the zoom-in button.
        this.zoomInButton.disabled = false;

        // Do nothing if the current zoom factor is minimum.
        if (curZoom <= this.minZoom)
          return;

        // Calculate new zoom factor.
        const multiple = .8;
        newZoom = Math.max(Math.floor(curZoom * multiple), this.minZoom);

        // When the zoom factor reaches the minimum, disable the zoom out button.
        this.zoomOutButton.disabled = newZoom <= this.minZoom;
      }

      // Set the new zoom factor to the zoom input value.
      this.zoomInput.value = newZoom;

      // Activate the zoom menu that matches the current zoom factor.
      this.activateZoomMenuFromValue(this.zoomInput.value);

      // Calculate zoom factor.
      const zoomFactor = this.calcZoomFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(zoomFactor);
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
   * Recalculates the position of the zoom overlay element.
   */
  layout() {
    const rect =  this.zoomOverlayToggle.getBoundingClientRect();
    this.zoomMenu.style.top = `${rect.bottom}px`;
    this.zoomMenu.style.left = `${rect.left}px`;
  }

  /**
   * Calculate zoom factor.
   *
   * @param {string}
   * @returns {number}
   */
  calcZoomFactor(zoom) {
    let zoomFactor = 1.0;
    if (isNumber(zoom))
      // Convert specified percentage to ratio.
      zoomFactor = parseInt(zoom, 10) / 100;
    else if (zoom === 'pageFit')
      // Calculate the width and height of the page that fits the height of the container.
      zoomFactor = this.pageView.clientHeight / this.standardViewport.height;
    else if (zoom === 'pageWidth')
      // Calculate the width and height of the page that fits the width of the container.
      zoomFactor = this.pageView.clientWidth / this.standardViewport.width;
    return zoomFactor;
  }

  /**
   * Returns the current zoom factor.
   *
   * @returns {number}
   */
  getZoomFactor() {
    return this.calcZoomFactor(this.zoomInput.value);
  }

  /**
   * Deselect a zoom item that was already selected.
   */
  deselectZoomMenu() {
    const selectedZoom = document.querySelector('[data-element="zoomSelect"].selected');
    if (selectedZoom)
      selectedZoom.classList.remove('selected');
  }

  /**
  * Activate the zoom menu from values.
  */
  activateZoomMenuFromValue(value) {
    // Deselect a zoom item that was already selected.
    this.deselectZoomMenu();

    // Activate the zoom menu that matches the current zoom factor.
    const zoomSelect = document.querySelector(`[data-element="zoomSelect"][data-value="${value}"]`);
    if (zoomSelect)
      zoomSelect.classList.add('selected');
  }

  /**
   * Zoom change event.
   * Returns the zoom factor to the event handler.
   *
   * @param {(zoomFactor: number): void => {}}
   */
  onChangeZoom(handler) {
    this.changeZoomHandler = handler;
  }
}