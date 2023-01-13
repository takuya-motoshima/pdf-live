import PageViewport from '~/interfaces/PageViewport';
/**
 * Page zoom control.
 */
export default class ZoomNav {
    /** @type {PageViewport} */
    private readonly pageViewport;
    /** @type {HTMLDivElement} */
    private readonly zoomToggle;
    /** @type {HTMLDivElement} */
    private readonly zoomMenu;
    /** @type {HTMLButtonElement[]} */
    private readonly zoomSelects;
    /** @type {HTMLButtonElement} */
    private readonly zoomOutButton;
    /** @type {HTMLButtonElement} */
    private readonly zoomInButton;
    /** @type {HTMLFormElement} */
    private readonly zoomForm;
    /** @type {HTMLInputElement} */
    private readonly zoomInput;
    /** @type {HTMLDivElement} */
    private readonly pageView;
    /** @type {number|null} */
    private resizeTimeout;
    /** @type {number} */
    private lastZoomFactor;
    /** @type {string} */
    private lastZoomValue;
    /** @type {number[]} */
    private readonly zoomFactorList;
    /** @type {number} */
    private readonly minZoomFactor;
    /** @type {number} */
    private readonly maxZoomFactor;
    /** @type {(zoomFactor: number) => void} */
    private changeListener;
    /**
     * Control the zoom factor change event of a page.
     */
    constructor(context: HTMLElement, pageViewport: PageViewport);
    /**
     * Open zoom overlay.
     */
    open(): void;
    /**
     * Close zoom overlay.
     */
    close(): void;
    /**
     * Returns the current zoom factor.
     */
    getZoomFactor(): number;
    /**
     * Zoom change event. Returns the zoom factor to the event listener.
     */
    onChange(listener: (zoomFactor: number) => void): ZoomNav;
    /**
     * Lay out the zoom menu item's absolute position.
     */
    private layoutZoomMenuLayout;
    /**
     * Update input zoom.
     */
    private updateInputZoom;
    /**
     * Deselect a zoom item that was already selected.
     */
    private deselectZoom;
    /**
     * Activate the zoom menu.
     */
    private activateZoom;
    /**
     * Zoom page according to the zoom you enter.
     */
    private enterZoom;
    /**
     * Calculate the next zoom when zooming out or in.
     */
    private calcNextZoom;
    /**
     * Get the currently selected zoom node.
     */
    private getSelectedZoomNode;
    /**
     * Get the currently selected zoom value.
     */
    private getSelectedZoomValue;
}
