import Viewport from '~/interfaces/Viewport';
/**
 * Page zoom control.
 */
export default class ZoomNav {
    /** @type {Viewport} */
    private readonly standardViewport;
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
    private lastZoom;
    /** @type {number[]} */
    private readonly zoomList;
    /** @type {number} */
    private readonly minZoom;
    /** @type {number} */
    private readonly maxZoom;
    /** @type {(zoomFactor: number) => void} */
    private changeHandler;
    /**
     * Control the zoom factor change event of a page.
     *
     * @param {HTMLDivElement}  context
     * @param {Viewport}        standardViewport
     */
    constructor(context: HTMLElement, standardViewport: Viewport);
    /**
     * Open zoom overlay.
     */
    open(): void;
    /**
     * Close zoom overlay.
     */
    close(): void;
    /**
     * Recalculates the position of the zoom overlay node.
     */
    private layout;
    /**
     * Calculate zoom factor.
     *
     * @param   {string} zoom
     * @returns {number}
     */
    private calcFactor;
    /**
     * Returns the current zoom factor.
     *
     * @returns {number}
     */
    getZoomFactor(): number;
    /**
     * Deselect a zoom item that was already selected.
     */
    private deselectMenu;
    /**
     * Activate the zoom menu.
     *
     * @param {string} value
     */
    private activateMenu;
    /**
     * Zoom page according to the zoom you enter.
     */
    private enterZoom;
    /**
     * Calculate zoom step.
     *
     * @param {number} zoomDir Zoom direction. 0: Zoom out, 1: Zoom in
     */
    private calcStep;
    /**
     * Zoom change event. Returns the zoom factor to the event handler.
     *
     * @param {(zoomFactor: number) => void}
     * @returns {ZoomNav} The instance on which this method was called.
     */
    onChange(handler: (zoomFactor: number) => void): this;
}
