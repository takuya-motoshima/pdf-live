import pointInRectangle from '../shared/pointInRectangle.js';
import isNumber from '../shared/isNumber.js';
import Viewport from '~/interfaces/Viewport';

const ZOOM_OUT = 0;
const ZOOM_IN = 1;

/**
 * Page zoom control.
 */
export default class ZoomNav {
  /** @type {Viewport} */
  private readonly defaultViewport: Viewport;

  /** @type {HTMLDivElement} */
  private readonly zoomToggle: HTMLDivElement;

  /** @type {HTMLDivElement} */
  private readonly zoomMenu: HTMLDivElement;

  /** @type {HTMLButtonElement[]} */
  private readonly zoomSelects: HTMLButtonElement[];

  /** @type {HTMLButtonElement} */
  private readonly zoomOutButton: HTMLButtonElement;

  /** @type {HTMLButtonElement} */
  private readonly zoomInButton: HTMLButtonElement;

  /** @type {HTMLFormElement} */
  private readonly zoomForm: HTMLFormElement;

  /** @type {HTMLInputElement} */
  private readonly zoomInput: HTMLInputElement;

  /** @type {HTMLDivElement} */
  private readonly pageView: HTMLDivElement;

  /** @type {number|null} */
  private resizeTimeout: number|null = null;

  /** @type {number} */
  private lastZoom: number;

  /** @type {number[]} */
  private readonly zoomList: number[];

  /** @type {number} */
  private readonly minZoom: number;

  /** @type {number} */
  private readonly maxZoom: number;

  /** @type {(zoomFactor: number) => void} */
  private changeHandler: (zoomFactor: number) => void = (zoomFactor: number): void => {}

  /**
   * Control the zoom factor change event of a page.
   *
   * @param {HTMLDivElement}  context
   * @param {Viewport}        defaultViewport
   */
  constructor(context: HTMLElement, defaultViewport: Viewport) {
    // Keep page width and height for zoom factor calculation to fit by page or width.
    this.defaultViewport = defaultViewport;

    // Find dependent nodes.
    this.zoomToggle = context.querySelector('[data-element="zoomToggle"]') as HTMLDivElement;
    this.zoomMenu = context.querySelector('[data-element="zoomMenu"]') as HTMLDivElement;
    this.zoomSelects = Array.from(context.querySelectorAll('[data-element="zoomSelect"]'));
    this.zoomOutButton = context.querySelector('[data-element="zoomOutButton"]') as HTMLButtonElement;
    this.zoomInButton = context.querySelector('[data-element="zoomInButton"]') as HTMLButtonElement;
    this.zoomForm = context.querySelector('[data-element="zoomForm"]') as HTMLFormElement;
    this.zoomInput = context.querySelector('[data-element="zoomInput"]') as HTMLInputElement;
    this.pageView = context.querySelector('[data-element="pageView"]') as HTMLDivElement;

    // Last input zoom.
    this.lastZoom = parseInt(this.zoomInput.value, 10);

    // All zooms that can be selected from the screen.
    this.zoomList = this.zoomSelects.flatMap((zoomSelect: HTMLButtonElement) => {
      const zoom = parseInt(zoomSelect.dataset.value as string, 10);
      return isNumber(zoom) ? zoom : [];
    });

    // Minimum zoom.
    this.minZoom = Math.min(...this.zoomList);

    // Maximum zoom.
    this.maxZoom = Math.max(...this.zoomList);

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
        this.deselectMenu();

        // Activate the selected zoom item.
        const targetNode = evnt.target as HTMLButtonElement;
        targetNode.classList.add('pl-zoom-menu-item-selected');

        // Calculate zoom factor.
        const zoomFactor = this.calcFactor(targetNode.dataset.value as string);

        // Set the zoom percentage to the text node.
        this.zoomInput.value = Math.floor(zoomFactor * 100).toString();

        // Keep the last input value.
        this.lastZoom = parseInt(this.zoomInput.value, 10);

        // Invoke zoom change event.
        this.changeHandler(zoomFactor);
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
          zoomSelect.classList.contains('pl-zoom-menu-item-selected')) as HTMLButtonElement;
        const currentZoom = selectedZoom.dataset.value;
        if (currentZoom === 'pageFit' || currentZoom === 'pageWidth') {
          // Calculate zoom factor.
          const zoomFactor = this.calcFactor(currentZoom);

          // Invoke zoom change event.
          this.changeHandler(zoomFactor);
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
      this.changeHandler(zoomFactor);
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
  public open(): void {
    this.zoomMenu.classList.remove('pl-zoom-menu-closed');
  }

  /**
   * Close zoom overlay.
   */
  public close(): void {
    this.zoomMenu.classList.add('pl-zoom-menu-closed');
  }

  /**
   * Recalculates the position of the zoom overlay node.
   */
  private layout(): void {
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
  private calcFactor(zoom: string): number {
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
  public getZoomFactor(): number {
    return this.calcFactor(this.zoomInput.value);
  }

  /**
   * Deselect a zoom item that was already selected.
   */
  private deselectMenu(): void {
    const selectedZoom = this.zoomSelects.find(zoomSelect =>
      zoomSelect.classList.contains('pl-zoom-menu-item-selected'));
    if (selectedZoom)
      selectedZoom.classList.remove('pl-zoom-menu-item-selected');
  }

  /**
   * Activate the zoom menu.
   *
   * @param {string} value
   */
  private activateMenu(value: string): void {
    // Deselect a zoom item that was already selected.
    this.deselectMenu();

    // Activate the zoom menu that matches the current zoom factor.
    const zoomSelect = this.zoomSelects.find(zoomSelect => zoomSelect.dataset.value == value);
    if (zoomSelect)
      zoomSelect.classList.add('pl-zoom-menu-item-selected');
  }

  /**
   * Zoom page according to the zoom you enter.
   */
  private enterZoom() {
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
      this.changeHandler(zoomFactor);
    } else
      // If the input zoom is an invalid number, set the previous value to the input zoom.
      this.zoomInput.value = this.lastZoom.toString();
  }

  /**
   * Calculate zoom step.
   *
   * @param {number} zoomDir Zoom direction. 0: Zoom out, 1: Zoom in
   */
  private calcStep(zoomDir: number) {
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
    this.changeHandler(zoomFactor);
  }

  /**
   * Zoom change event. Returns the zoom factor to the event handler.
   *
   * @param {(zoomFactor: number) => void}
   * @returns {ZoomNav} The instance on which this method was called.
   */
  public onChange(handler: (zoomFactor: number) => void) {
    this.changeHandler = handler;
    return this;
  }
}