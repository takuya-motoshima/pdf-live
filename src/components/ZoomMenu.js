import pointInRectangle from '../shared/pointInRectangle.js';
import isNumber from '../shared/isNumber.js';

const ZOOM_OUT = 0;
const ZOOM_IN = 1;

/**
 * Page zoom control.
 */
export default class ZoomMenu {
  /**
   * Control the zoom factor change event of a page.
   */
  constructor(standardViewport) {
    // Keep page width and height for zoom factor calculation to fit by page or width.
    this.standardViewport = standardViewport;
    // console.log(`Page width and height: ${this.standardViewport.width}/${this.standardViewport.height}`);

    // Find dependent nodes.
    this.zoomToggle = document.querySelector('[data-element="zoomToggle"]');
    this.zoomMenu = document.querySelector('[data-element="zoomMenu"]');
    this.zoomSelects = document.querySelectorAll('[data-element="zoomSelect"]');
    this.zoomOutButton = document.querySelector('[data-element="zoomOutButton"]');
    this.zoomInButton = document.querySelector('[data-element="zoomInButton"]');
    this.zoomInputForm = document.querySelector('[data-element="zoomInputForm"]');
    this.zoomInput = document.querySelector('[data-element="zoomInput"]');
    this.pageView = document.querySelector('[data-element="pageView"]');

    // Preventing multiple launches of resizing events.
    this.resizeTimeout = null;

    // Last input zoom.
    this.lastZoomValue = this.zoomInput.value;

    // All zooms that can be selected from the screen.
    this.zoomList = [...this.zoomSelects].flatMap(zoomSelect => {
      const zoom = parseInt(zoomSelect.dataset.value, 10);
      return isNumber(zoom) ? zoom : [];
    });

    // Minimum zoom.
    this.minZoomValue = Math.min(...this.zoomList);

    // Maximum zoom.
    this.maxZoomValue = Math.max(...this.zoomList);

    // Zoom change event handler.
    this.changeZoomHandler = zoomFactor => {};

    // Toggle the opening and closing of the zoom overlay.
    this.zoomToggle.addEventListener('click', (evnt) => {
      if (this.zoomMenu.classList.contains('pl-zoom-menu-closed')) {
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
        evnt.target.classList.add('pl-zoom-menu-item-selected');

        // Calculate zoom factor.
        const zoomFactor = this.calcZoomFactor(evnt.target.dataset.value);

        // Set the zoom percentage to the text node.
        this.zoomInput.value = Math.floor(zoomFactor * 100);

        // Keep the last input value.
        this.lastZoomValue = this.zoomInput.value;

        // Invoke zoom change event.
        this.changeZoomHandler(zoomFactor);
      }, {passive: true});

    // When the window is resized.
    window.addEventListener('resize', () => {
      // Preventing multiple launches of resizing events.
      if (this.resizeTimeout)
        clearTimeout(this.resizeTimeout);

      this.resizeTimeout = setTimeout(() => {
        // Recalculates the position of the zoom overlay node.
        this.layout();

        // If the zoom mode is "page fit" or "width fit", resize the page.
        const zoomValue = document.querySelector('[data-element="zoomSelect"].pl-zoom-menu-item-selected').dataset.value;
        if (zoomValue === 'pageFit' || zoomValue === 'pageWidth') {
          // Calculate zoom factor.
          const zoomFactor = this.calcZoomFactor(zoomValue);

          // Invoke zoom change event.
          this.changeZoomHandler(zoomFactor);
        }
      }, 100);
    }, {passive: true});

    // When the screen is clicked.
    document.body.addEventListener('click', evnt => {
      // Close if zoom overlay is open.
      if (!this.zoomMenu.classList.contains('pl-zoom-menu-closed')
        && !pointInRectangle({x: evnt.pageX, y: evnt.pageY}, this.zoomMenu.getBoundingClientRect()))
        this.close();
    }, {passive: true});

    // Zoom out the page.
    this.zoomOutButton.addEventListener('click', () => {
      // Calculate zoom step.
      this.calcZoomStep(ZOOM_OUT);
    }, {passive: true});

    // Zoom in on the page.
    this.zoomInButton.addEventListener('click', () => {
      // Calculate zoom step.
      this.calcZoomStep(ZOOM_IN);
    }, {passive: true});

    // Hold down the Ctrl key and rotate the mouse wheel to zoom. 
    window.addEventListener('wheel', evnt => {
      // Do nothing if the Ctrl key is not pressed.
      if (!evnt.ctrlKey)
        return;

      // Stop existing mouse wheel action.
      evnt.preventDefault();

      // Calculate the next zoom factor.
      const zoomValue = parseInt(this.lastZoomValue, 10);
      let newZoom = zoomValue;
      if (evnt.deltaY < 0) {
        // Rotate the mouse wheel upwards to zoom in.

        // Activate the zoom out button.
        this.zoomOutButton.disabled = false;

        // Do nothing if the current zoom factor is maximum.
        if (zoomValue >= this.maxZoomValue)
          return;

        // Calculate new zoom factor.
        const multiple = 1.25;
        newZoom = Math.min(Math.floor(zoomValue * multiple), this.maxZoomValue);
        
        // When the zoom factor reaches the maximum, disable the zoom-in button.
        this.zoomInButton.disabled = newZoom >= this.maxZoomValue;
      } else if (evnt.deltaY > 0) {
        // Rotate the mouse wheel downwards to zoom out.
        // Activate the zoom-in button.
        this.zoomInButton.disabled = false;

        // Do nothing if the current zoom factor is minimum.
        if (zoomValue <= this.minZoomValue)
          return;

        // Calculate new zoom factor.
        const multiple = .8;
        newZoom = Math.max(Math.floor(zoomValue * multiple), this.minZoomValue);

        // When the zoom factor reaches the minimum, disable the zoom out button.
        this.zoomOutButton.disabled = newZoom <= this.minZoomValue;
      }

      // Set the new zoom factor to the zoom input value.
      this.zoomInput.value = newZoom;

      // Keep the last input value.
      this.lastZoomValue = this.zoomInput.value;

      // Activate the zoom menu that matches the current zoom factor.
      this.activateZoomMenuFromValue(this.zoomInput.value);

      // Calculate zoom factor.
      const zoomFactor = this.calcZoomFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(zoomFactor);
    }, {passive: false});

    // Focus out zoom input.
    this.zoomInput.addEventListener('blur', () => {
      // Zoom page according to the zoom you enter.
      this.enterZoom();
    }, {passive: true});

    // Submit page input form.
    this.zoomInputForm.addEventListener('submit', evnt => {
      evnt.preventDefault();

      // Zoom page according to the zoom you enter.
      this.enterZoom();
    }, {passive: false});
    // // Press Enter key with input zoom.
    // this.zoomInput.addEventListener('keydown', evnt => {
    //   // Ignore other than enter key.
    //   if (evnt.key !== 'Enter' && evnt.keyCode !== 13)
    //     return;
    //   // Zoom page according to the zoom you enter.
    //   this.enterZoom();
    // }, {passive: true});
  }

  /**
   * Open zoom overlay.
   */
  open() {
    this.zoomMenu.classList.remove('pl-zoom-menu-closed');
  }

  /**
   * Close zoom overlay.
   */
  close() {
    this.zoomMenu.classList.add('pl-zoom-menu-closed');
  }

  /**
   * Recalculates the position of the zoom overlay node.
   */
  layout() {
    const toogleRect =  this.zoomToggle.getBoundingClientRect();
    this.zoomMenu.style.top = `${toogleRect.bottom}px`;
    this.zoomMenu.style.left = `${toogleRect.left}px`;
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
    const selectedZoom = document.querySelector('[data-element="zoomSelect"].pl-zoom-menu-item-selected');
    if (selectedZoom)
      selectedZoom.classList.remove('pl-zoom-menu-item-selected');
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
      zoomSelect.classList.add('pl-zoom-menu-item-selected');
  }

  /**
   * Zoom page according to the zoom you enter.
   */
  enterZoom() {
    // Converts the entered zoom to a numerical value.
    let zoomValue = parseInt(this.zoomInput.value, 10);

    // Check if the input value is a valid number.
    if (!isNaN(zoomValue)) {
      if (zoomValue < this.minZoomValue)
        // If the input is less than the minimum value, set the minimum value to the input.
        zoomValue = this.minZoomValue;
      else if (zoomValue > this.maxZoomValue)
        // If the input exceeds the maximum value, set the maximum value to the input.
        zoomValue = this.maxZoomValue;

      // Set the adjustment value to the input node.
      this.zoomInput.value = zoomValue;

      // Keep the last input value.
      this.lastZoomValue = this.zoomInput.value;

      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoomValue;

      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoomValue;

      // Calculate zoom factor.
      const zoomFactor = this.calcZoomFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeZoomHandler(zoomFactor);
    } else
      // If the input zoom is an invalid number, set the previous value to the input zoom.
      this.zoomInput.value = this.lastZoomValue;
  }

  /**
   * Calculate zoom step.
   *
   * @param {number} zoomDirection Zoom direction. 0: Zoom out, 1: Zoom in
   */
  calcZoomStep(zoomDirection) {
    // Current zoom factor.
    const zoomValue = parseInt(this.lastZoomValue, 10);

    // Calculate the next zoom.
    if (zoomDirection === ZOOM_OUT)
      // Set a zoom factor one step smaller than the current one.
      this.zoomInput.value = this.zoomList.sort((a, b) => b - a).find(zoom => zoom < zoomValue) ?? this.minZoomValue;
    else    
      // Set a zoom factor one step larger than the current one.
      this.zoomInput.value = this.zoomList.sort((a, b) => a - b).find(zoom => zoom > zoomValue) ?? this.maxZoomValue;

    // Keep the last input value.
    this.lastZoomValue = this.zoomInput.value;

    // Controlling the activation of zoom-in and zoom-out buttons.
    if (zoomDirection === ZOOM_OUT) {
      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoomValue;

      // Activate the zoom-in button.
      this.zoomInButton.disabled = false;
    } else {
      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoomValue;

      // Activate the zoom out button.
      this.zoomOutButton.disabled = false;
    }

    // Activate the zoom menu that matches the current zoom factor.
    this.activateZoomMenuFromValue(this.zoomInput.value);

    // Calculate zoom factor.
    const zoomFactor = this.calcZoomFactor(this.zoomInput.value);

    // Invoke zoom change event.
    this.changeZoomHandler(zoomFactor);
  }

  /**
   * Zoom change event.
   * Returns the zoom factor to the event handler.
   *
   * @param {(zoomFactor: number): void => {}}
   * @returns {ZoomMenu} The instance on which this method was called.
   */
  onChangeZoom(handler) {
    this.changeZoomHandler = handler;
    return this;
  }
}