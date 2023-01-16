import calcZoomFactor from '~/core/calcZoomFactor';
import pointInRectangle from '~/shared/pointInRectangle';
import isNumber from '~/shared/isNumber';
import PageViewport from '~/interfaces/PageViewport';
import * as constants from '~/constants';

/**
 * Page zoom control.
 */
export default class ZoomNav {
  /** @type {PageViewport} */
  private readonly pageViewport: PageViewport;

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
  private lastZoomFactor: number = -1;

  /** @type {string} */
  private lastZoomValue: string;

  /** @type {number[]} */
  private readonly zoomFactorList: number[];

  /** @type {number} */
  private readonly minZoomFactor: number;

  /** @type {number} */
  private readonly maxZoomFactor: number;

  /** @type {(zoomFactor: number) => void} */
  private changeListener: (zoomFactor: number) => void = (zoomFactor: number): void => {}

  /**
   * Control the zoom factor change event of a page.
   */
  constructor(context: HTMLElement, pageViewport: PageViewport) {
    // Keep page width and height for zoom factor calculation to fit by page or width.
    this.pageViewport = pageViewport;

    // Find dependent nodes.
    this.zoomToggle = context.querySelector('[data-element="zoomToggle"]') as HTMLDivElement;
    this.zoomMenu = context.querySelector('[data-element="zoomMenu"]') as HTMLDivElement;
    this.zoomSelects = Array.from(context.querySelectorAll('[data-element="zoomSelect"]'));
    this.zoomOutButton = context.querySelector('[data-element="zoomOutButton"]') as HTMLButtonElement;
    this.zoomInButton = context.querySelector('[data-element="zoomInButton"]') as HTMLButtonElement;
    this.zoomForm = context.querySelector('[data-element="zoomForm"]') as HTMLFormElement;
    this.zoomInput = context.querySelector('[data-element="zoomInput"]') as HTMLInputElement;
    this.pageView = context.querySelector('[data-element="pageView"]') as HTMLDivElement;

    // Zoom rate initially displayed.
    // If the actual width of the PDF is larger than the PDF drawing area (div.pl-page-view), the PDF will be drawn to fit within the PDF drawing area (pageWidth).  
    // Otherwise, the PDF will be drawn with its actual dimensions (100%). 
    let initialZoomValue = '100';
    if (pageViewport.width > this.pageView.clientWidth) 
      initialZoomValue = 'pageWidth';
    const zoomSelect = this.zoomSelects.find(zoomSelect => zoomSelect.dataset.value === initialZoomValue) as HTMLButtonElement;
    zoomSelect.classList.add('pl-zoom-menu-item-selected');

    // Keep zoom selection value.
    this.lastZoomValue = initialZoomValue;

    // Set the currently selected zoom to the zoom input and the last zoom.
    this.updateInputZoom(initialZoomValue);

    // All zooms that can be selected from the screen.
    this.zoomFactorList = this.zoomSelects.flatMap((zoomSelect: HTMLButtonElement) => {
      const zoomValue = parseInt(zoomSelect.dataset.value as string, 10);
      return isNumber(zoomValue) ? zoomValue : [];
    });

    // Minimum zoom.
    this.minZoomFactor = Math.min(...this.zoomFactorList);

    // Maximum zoom.
    this.maxZoomFactor = Math.max(...this.zoomFactorList);

    // Toggle the opening and closing of the zoom overlay.
    this.zoomToggle.addEventListener('click', (evnt) => {
      if (this.zoomMenu.classList.contains('pl-zoom-menu-closed')) {
        // Stops event propagation to the body so that the process of closing the zoom overlay for body click events does not run.
        evnt.stopPropagation();

        // Lay out the zoom menu item's absolute position.
        this.layoutZoomMenuLayout();

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
        this.deselectZoom();

        // Activate the selected zoom item.
        const zoomSelect = evnt.target as HTMLButtonElement;
        zoomSelect.classList.add('pl-zoom-menu-item-selected');

        // Calculate zoom factor.
        const zoomFactor = calcZoomFactor(zoomSelect.dataset.value as string, this.pageView, this.pageViewport);

        // Set the zoom percentage to the text node.
        this.zoomInput.value = Math.floor(zoomFactor * 100).toString();

        // Keep the zoom factor.
        this.lastZoomFactor = parseInt(this.zoomInput.value, 10);

        // Invoke zoom change event.
        this.changeListener(zoomFactor);
      }, {passive: true});

    // When the window is resized.
    window.addEventListener('resize', () => {
      // If there are consecutive resizing requests, only the latest request is accepted.
      if (this.resizeTimeout)
        clearTimeout(this.resizeTimeout);
      this.resizeTimeout = window.setTimeout(() => {
        // Lay out the zoom menu item's absolute position.
        this.layoutZoomMenuLayout();

        // If the zoom mode is "page fit" or "width fit", resize the page.
        const zoomValue = this.getSelectedZoomValue();
        if (zoomValue === 'pageFit' || zoomValue === 'pageWidth') {
          // Invoke zoom change event.
          this.changeListener(calcZoomFactor(zoomValue, this.pageView, this.pageViewport));
        }
      }, constants.RESIZE_DELAY_SECONDS * 1000);
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
      this.calcNextZoom(constants.ZOOM_OUT);
    }, {passive: true});

    // Zoom in on the page.
    this.zoomInButton.addEventListener('click', () => {
      this.calcNextZoom(constants.ZOOM_IN);
    }, {passive: true});

    // Hold down the Ctrl key and rotate the mouse wheel to zoom. 
    window.addEventListener('wheel', evnt => {
      // Do nothing if the Ctrl key is not pressed.
      if (!evnt.ctrlKey)
        return;

      // Stop existing mouse wheel action.
      evnt.preventDefault();

      // Calculate the next zoom factor.
      const currentZoomFactor = this.lastZoomFactor;
      let newZoomFactor = currentZoomFactor;
      if (evnt.deltaY < 0) {
        // Rotate the mouse wheel upwards to zoom in.
        // Activate the zoom out button.
        this.zoomOutButton.disabled = false;

        // Do nothing if the current zoom factor is maximum.
        if (currentZoomFactor >= this.maxZoomFactor)
          return;

        // Calculate new zoom factor.
        const multiple = 1.25;
        newZoomFactor = Math.min(Math.floor(currentZoomFactor * multiple), this.maxZoomFactor);
        
        // When the zoom factor reaches the maximum, disable the zoom-in button.
        this.zoomInButton.disabled = newZoomFactor >= this.maxZoomFactor;
      } else if (evnt.deltaY > 0) {
        // Rotate the mouse wheel downwards to zoom out.
        // Activate the zoom-in button.
        this.zoomInButton.disabled = false;

        // Do nothing if the current zoom factor is minimum.
        if (currentZoomFactor <= this.minZoomFactor)
          return;

        // Calculate new zoom factor.
        const multiple = .8;
        newZoomFactor = Math.max(Math.floor(currentZoomFactor * multiple), this.minZoomFactor);

        // When the zoom factor reaches the minimum, disable the zoom out button.
        this.zoomOutButton.disabled = newZoomFactor <= this.minZoomFactor;
      }

      // Set the new zoom factor to the zoom input value.
      this.zoomInput.value = newZoomFactor.toString();

      // Keep the zoom factor.
      this.lastZoomFactor = parseInt(this.zoomInput.value, 10);

      // Activate the zoom menu that matches the current zoom factor.
      this.activateZoom(this.zoomInput.value);

      // Invoke zoom change event.
      this.changeListener(calcZoomFactor(this.zoomInput.value, this.pageView, this.pageViewport));
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
   * Returns the current zoom factor.
   */
  public getZoomFactor(): number {
    return calcZoomFactor(this.zoomInput.value, this.pageView, this.pageViewport);
  }

  /**
   * Zoom change event. Returns the zoom factor to the event listener.
   */
  public onChange(listener: (zoomFactor: number) => void): ZoomNav {
    this.changeListener = listener;
    return this;
  }

  /**
   * Lay out the zoom menu item's absolute position.
   */
  private layoutZoomMenuLayout(): void {
    const {bottom, left} =  this.zoomToggle.getBoundingClientRect();
    this.zoomMenu.style.top = `${bottom}px`;
    this.zoomMenu.style.left = `${left}px`;
  }

  /**
   * Update input zoom.
   */
  private updateInputZoom(strZoom: number|string) {
    // Calculate zoom factor.
    const zoomFactor = calcZoomFactor(strZoom.toString(), this.pageView, this.pageViewport);

    // Set the zoom percentage to the text node.
    this.zoomInput.value = Math.floor(zoomFactor * 100).toString();

    // Keep the zoom factor.
    this.lastZoomFactor = parseInt(this.zoomInput.value, 10);
  }

  /**
   * Deselect a zoom item that was already selected.
   */
  private deselectZoom(): void {
    const zoomNode = this.getSelectedZoomNode();
    if (zoomNode)
      zoomNode.classList.remove('pl-zoom-menu-item-selected');
  }

  /**
   * Activate the zoom menu.
   */
  private activateZoom(zoomValue: string): void {
    // Deselect a zoom item that was already selected.
    this.deselectZoom();

    // Activate the zoom menu that matches the current zoom factor.
    const zoomSelect = this.zoomSelects.find(zoomSelect => zoomSelect.dataset.value == zoomValue);
    if (zoomSelect)
      zoomSelect.classList.add('pl-zoom-menu-item-selected');
  }

  /**
   * Zoom page according to the zoom you enter.
   */
  private enterZoom() {
    // Converts the entered zoom to a numerical value.
    let currentZoomFactor = parseInt(this.zoomInput.value, 10);

    // Check if the input value is a valid number.
    if (!isNaN(currentZoomFactor)) {
      if (currentZoomFactor < this.minZoomFactor)
        // If the input is less than the minimum value, set the minimum value to the input.
        currentZoomFactor = this.minZoomFactor;
      else if (currentZoomFactor > this.maxZoomFactor)
        // If the input exceeds the maximum value, set the maximum value to the input.
        currentZoomFactor = this.maxZoomFactor;

      // Set the adjustment value to the input node.
      this.zoomInput.value = currentZoomFactor.toString();

      // Keep the zoom factor.
      this.lastZoomFactor = parseInt(this.zoomInput.value, 10);

      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoomFactor.toString();

      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoomFactor.toString();

      // Invoke zoom change event.
      this.changeListener(calcZoomFactor(this.zoomInput.value, this.pageView, this.pageViewport));
    } else
      // If the input zoom is an invalid number, set the previous value to the input zoom.
      this.zoomInput.value = this.lastZoomFactor.toString();
  }

  /**
   * Calculate the next zoom when zooming out or in.
   */
  private calcNextZoom(zoomDir: number) {
    // Move one step from the currently selected zoom rate.
    this.zoomInput.value = zoomDir === constants.ZOOM_OUT ?
      (this.zoomFactorList.sort((a, b) => b - a).find(zoom => zoom < this.lastZoomFactor) ?? this.minZoomFactor).toString() :
      (this.zoomFactorList.sort((a, b) => a - b).find(zoom => zoom > this.lastZoomFactor) ?? this.maxZoomFactor).toString();

    // Keep the zoom factor.
    this.lastZoomFactor = parseInt(this.zoomInput.value, 10);

    // Controlling the activation of zoom-in and zoom-out buttons.
    if (zoomDir === constants.ZOOM_OUT) {
      // When the zoom factor reaches the minimum, disable the zoom out button.
      this.zoomOutButton.disabled = this.zoomInput.value == this.minZoomFactor.toString();

      // Activate the zoom-in button.
      this.zoomInButton.disabled = false;
    } else {
      // When the zoom factor reaches the maximum, disable the zoom-in button.
      this.zoomInButton.disabled = this.zoomInput.value == this.maxZoomFactor.toString();

      // Activate the zoom out button.
      this.zoomOutButton.disabled = false;
    }

    // Activate the zoom menu that matches the current zoom factor.
    this.activateZoom(this.zoomInput.value);

    // Invoke zoom change event.
    this.changeListener(calcZoomFactor(this.zoomInput.value, this.pageView, this.pageViewport));
  }

  /**
   * Get the currently selected zoom node.
   */
  private getSelectedZoomNode(): HTMLButtonElement|undefined {
    return this.zoomSelects.find(zoomSelect => {
      return zoomSelect.classList.contains('pl-zoom-menu-item-selected');
    }) as HTMLButtonElement;
  }

  /**
   * Get the currently selected zoom value.
   */
  private getSelectedZoomValue(): string|null {
    const zoomNode = this.getSelectedZoomNode();
    if (!zoomNode)
      return null;
    return zoomNode.dataset.value as string;
  }
}