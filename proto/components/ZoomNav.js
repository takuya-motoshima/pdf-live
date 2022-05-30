import pointInRectangle from '../shared/pointInRectangle.js';
import isNumber from '../shared/isNumber.js';

const ZOOM_OUT = 0;
const ZOOM_IN = 1;

/**
 * Page zoom control.
 */
export default class ZoomNav {
  /**
   * Control the zoom factor change event of a page.
   *
   * @param {{width: number, height: number}} defaultViewport
   */
  constructor(defaultViewport) {
    // Keep page width and height for zoom factor calculation to fit by page or width.
    this.defaultViewport = defaultViewport;

    // Find dependent nodes.
    this.zoomToggle = document.querySelector('[data-element="zoomToggle"]');
    this.zoomMenu = document.querySelector('[data-element="zoomMenu"]');
    this.zoomSelects = Array.from(document.querySelectorAll('[data-element="zoomSelect"]'));
    this.zoomOutButton = document.querySelector('[data-element="zoomOutButton"]');
    this.zoomInButton = document.querySelector('[data-element="zoomInButton"]');
    this.zoomForm = document.querySelector('[data-element="zoomForm"]');
    this.zoomInput = document.querySelector('[data-element="zoomInput"]');
    this.pageView = document.querySelector('[data-element="pageView"]');

    // Preventing multiple launches of resizing events.
    this.resizeTimeout = null;

    // Set the currently selected zoom to the zoom input and the last zoom.
    const currentZoom = (this.zoomSelects.find(zoomSelect => zoomSelect.classList.contains('zoom-menu-item-selected'))).dataset.value;
    this.updateInputZoom(currentZoom);

    // All zooms that can be selected from the screen.
    this.zoomList = this.zoomSelects.flatMap(zoomSelect => {
      const zoom = parseInt(zoomSelect.dataset.value, 10);
      return isNumber(zoom) ? zoom : [];
    });

    // Minimum zoom.
    this.minZoom = Math.min(...this.zoomList);

    // Maximum zoom.
    this.maxZoom = Math.max(...this.zoomList);

    // Zoom change event listener.
    this.changeListener = zoomFactor => {};

    // Toggle the opening and closing of the zoom overlay.
    this.zoomToggle.addEventListener('click', (evnt) => {
      if (this.zoomMenu.classList.contains('zoom-menu-closed')) {
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
        this.deselectMenu();

        // Activate the selected zoom item.
        const targetNode = evnt.target;
        targetNode.classList.add('zoom-menu-item-selected');

        // Calculate zoom factor.
        const zoomFactor = this.calcFactor(targetNode.dataset.value);

        // Set the zoom percentage to the text node.
        this.zoomInput.value = Math.floor(zoomFactor * 100);

        // Keep the last input value.
        this.lastZoom = parseInt(this.zoomInput.value, 10);

        // Invoke zoom change event.
        this.changeListener(zoomFactor);
      }, {passive: true});

    // When the window is resized.
    window.addEventListener('resize', () => {
      // Preventing multiple launches of resizing events.
      if (this.resizeTimeout)
        clearTimeout(this.resizeTimeout);

      this.resizeTimeout = window.setTimeout(() => {
        // Recalculates the position of the zoom overlay node.
        this.layout();

        // If the zoom mode is "page fit" or "width fit", resize the page.
        const selectedZoom = this.zoomSelects.find(zoomSelect =>
          zoomSelect.classList.contains('zoom-menu-item-selected'));
        const currentZoom = selectedZoom.dataset.value;
        if (currentZoom === 'pageFit' || currentZoom === 'pageWidth') {
          // Calculate zoom factor.
          const zoomFactor = this.calcFactor(currentZoom);

          // Invoke zoom change event.
          this.changeListener(zoomFactor);
        }
      }, 100);
    }, {passive: true});

    // When the screen is clicked.
    document.body.addEventListener('click', evnt => {
      // Close if zoom overlay is open.
      if (!this.zoomMenu.classList.contains('zoom-menu-closed')
        && !pointInRectangle({x: evnt.pageX, y: evnt.pageY}, this.zoomMenu.getBoundingClientRect()))
        this.close();
    }, {passive: true});

    // Zoom out the page.
    this.zoomOutButton.addEventListener('click', () => {
      // Calculate zoom step.
      this.calcStep(ZOOM_OUT);
    }, {passive: true});

    // Zoom in on the page.
    this.zoomInButton.addEventListener('click', () => {
      // Calculate zoom step.
      this.calcStep(ZOOM_IN);
    }, {passive: true});

    // Hold down the Ctrl key and rotate the mouse wheel to zoom. 
    window.addEventListener('wheel', evnt => {
      // Do nothing if the Ctrl key is not pressed.
      if (!evnt.ctrlKey)
        return;

      // Stop existing mouse wheel action.
      evnt.preventDefault();

      // Calculate the next zoom factor.
      const currentZoom = this.lastZoom;
      let newZoom = currentZoom;
      if (evnt.deltaY < 0) {
        // Rotate the mouse wheel upwards to zoom in.

        // Activate the zoom out button.
        this.zoomOutButton.disabled = false;

        // Do nothing if the current zoom factor is maximum.
        if (currentZoom >= this.maxZoom)
          return;

        // Calculate new zoom factor.
        const multiple = 1.25;
        newZoom = Math.min(Math.floor(currentZoom * multiple), this.maxZoom);
        
        // When the zoom factor reaches the maximum, disable the zoom-in button.
        this.zoomInButton.disabled = newZoom >= this.maxZoom;
      } else if (evnt.deltaY > 0) {
        // Rotate the mouse wheel downwards to zoom out.
        // Activate the zoom-in button.
        this.zoomInButton.disabled = false;

        // Do nothing if the current zoom factor is minimum.
        if (currentZoom <= this.minZoom)
          return;

        // Calculate new zoom factor.
        const multiple = .8;
        newZoom = Math.max(Math.floor(currentZoom * multiple), this.minZoom);

        // When the zoom factor reaches the minimum, disable the zoom out button.
        this.zoomOutButton.disabled = newZoom <= this.minZoom;
      }

      // Set the new zoom factor to the zoom input value.
      this.zoomInput.value = newZoom.toString();

      // Keep the last input value.
      this.lastZoom = parseInt(this.zoomInput.value, 10);

      // Activate the zoom menu that matches the current zoom factor.
      this.activateMenu(this.zoomInput.value);

      // Calculate zoom factor.
      const zoomFactor = this.calcFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeListener(zoomFactor);
    }, {passive: false});

    // Focus out zoom input.
    this.zoomInput.addEventListener('blur', () => {
      // Zoom page according to the zoom you enter.
      this.enterZoom();
    }, {passive: true});

    // Submit page input form.
    this.zoomForm.addEventListener('submit', evnt => {
      evnt.preventDefault();

      // Zoom page according to the zoom you enter.
      this.enterZoom();
    }, {passive: false});
  }

  /**
   * Open zoom overlay.
   */
  open() {
    this.zoomMenu.classList.remove('zoom-menu-closed');
  }

  /**
   * Close zoom overlay.
   */
  close() {
    this.zoomMenu.classList.add('zoom-menu-closed');
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
   * @param   {string} zoom
   * @returns {number}
   */
  calcFactor(zoom) {
    let zoomFactor = 1.0;
    if (isNumber(zoom))
      // Convert specified percentage to ratio.
      zoomFactor = parseInt(zoom, 10) / 100;
    else if (zoom === 'pageFit')
      // Calculate the width and height of the page that fits the height of the container.
      zoomFactor = this.pageView.clientHeight / this.defaultViewport.height;
    else if (zoom === 'pageWidth')
      // Calculate the width and height of the page that fits the width of the container.
      zoomFactor = this.pageView.clientWidth / this.defaultViewport.width;
    return zoomFactor;
  }

  /**
   * Returns the current zoom factor.
   *
   * @returns {number}
   */
  getZoomFactor() {
    return this.calcFactor(this.zoomInput.value);
  }

  /**
   * Update input zoom.
   *
   * @param {number|string} strZoom percentage, pageWidth, or pageFit.
   */
  updateInputZoom(strZoom) {
    // Calculate zoom factor.
    const zoomFactor = this.calcFactor(strZoom.toString());

    // Set the zoom percentage to the text node.
    this.zoomInput.value = Math.floor(zoomFactor * 100).toString();

    // Keep the last input value.
    this.lastZoom = parseInt(this.zoomInput.value, 10);
  }

  /**
   * Deselect a zoom item that was already selected.
   */
  deselectMenu() {
    const selectedZoom = this.zoomSelects.find(zoomSelect =>
      zoomSelect.classList.contains('zoom-menu-item-selected'));
    if (selectedZoom)
      selectedZoom.classList.remove('zoom-menu-item-selected');
  }

  /**
   * Activate the zoom menu.
   *
   * @param {string} value
   */
  activateMenu(value) {
    // Deselect a zoom item that was already selected.
    this.deselectMenu();

    // Activate the zoom menu that matches the current zoom factor.
    const zoomSelect = this.zoomSelects.find(zoomSelect => zoomSelect.dataset.value == value);
    if (zoomSelect)
      zoomSelect.classList.add('zoom-menu-item-selected');
  }

  /**
   * Zoom page according to the zoom you enter.
   */
  enterZoom() {
    // Converts the entered zoom to a numerical value.
    let currentZoom = parseInt(this.zoomInput.value, 10);

    // Check if the input value is a valid number.
    if (!isNaN(currentZoom)) {
      if (currentZoom < this.minZoom)
        // If the input is less than the minimum value, set the minimum value to the input.
        currentZoom = this.minZoom;
      else if (currentZoom > this.maxZoom)
        // If the input exceeds the maximum value, set the maximum value to the input.
        currentZoom = this.maxZoom;

      // Set the adjustment value to the input node.
      this.zoomInput.value = currentZoom.toString();

      // Keep the last input value.
      this.lastZoom = parseInt(this.zoomInput.value, 10);

      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoom.toString();

      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoom.toString();

      // Calculate zoom factor.
      const zoomFactor = this.calcFactor(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeListener(zoomFactor);
    } else
      // If the input zoom is an invalid number, set the previous value to the input zoom.
      this.zoomInput.value = this.lastZoom.toString();
  }

  /**
   * Calculate zoom step.
   *
   * @param {number} zoomDir Zoom direction. 0: Zoom out, 1: Zoom in
   */
  calcStep(zoomDir) {
    // Calculate the next zoom.
    if (zoomDir === ZOOM_OUT)
      // Set a zoom factor one step smaller than the current one.
      this.zoomInput.value = (this.zoomList.sort((a, b) => b - a).find(zoom => zoom < this.lastZoom) ?? this.minZoom).toString();
    else    
      // Set a zoom factor one step larger than the current one.
      this.zoomInput.value = (this.zoomList.sort((a, b) => a - b).find(zoom => zoom > this.lastZoom) ?? this.maxZoom).toString();

    // Keep the last input value.
    this.lastZoom = parseInt(this.zoomInput.value, 10);

    // Controlling the activation of zoom-in and zoom-out buttons.
    if (zoomDir === ZOOM_OUT) {
      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoom.toString();

      // Activate the zoom-in button.
      this.zoomInButton.disabled = false;
    } else {
      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoom.toString();

      // Activate the zoom out button.
      this.zoomOutButton.disabled = false;
    }

    // Activate the zoom menu that matches the current zoom factor.
    this.activateMenu(this.zoomInput.value);

    // Calculate zoom factor.
    const zoomFactor = this.calcFactor(this.zoomInput.value);

    // Invoke zoom change event.
    this.changeListener(zoomFactor);
  }

  /**
   * Zoom change event. Returns the zoom factor to the event listener.
   *
   * @param {(zoomFactor: number) => void}
   * @returns {ZoomNav} The instance on which this method was called.
   */
  onChange(listener) {
    this.changeListener = listener;
    return this;
  }
}