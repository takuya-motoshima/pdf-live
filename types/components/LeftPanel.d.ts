/**
 * Left panel controller.
 */
export default class LeftPanel {
    /** @type {HTMLButtonElement} */
    private readonly leftPanelToggle;
    /** @type {HTMLDivElement} */
    private readonly leftPanel;
    /** @type {HTMLDivElement} */
    private readonly pagegContainer;
    /** @type {HTMLDivElement} */
    private readonly thumbnailsPanel;
    /** @type {HTMLDivElement[]} */
    private readonly thumbnailNodes;
    /** @type {HTMLDivElement|null} */
    private activeThumbnailNode;
    /** @type {(pageNum: number) => void} */
    private selectListener;
    /**
     * Controls opening and closing of the left panel and rendering of page thumbnails.
     *
     * @param {HTMLElement} context
     * @param {any[]}       pages
     */
    constructor(context: HTMLElement, pages: any[]);
    /**
     * Open the left panel.
     */
    open(): void;
    /**
     * Close left panel.
     */
    close(): void;
    /**
     * Activate thumbnails.
     *
     * @param {number} pageNum
     */
    activatePage(pageNum: number): void;
    /**
     * Render thumbnail images.
     *
     * @param   {any[]} pages
     * @returns {HTMLDivElement[]}
     */
    private render;
    /**
     * Thumbnail selection event. Returns the page number of the selected thumbnail to the listener.
     *
     * @param   {(pageNum: number) => void}
     * @returns {LeftPanel} The instance on which this method was called.
     */
    onSelect(listener: (pageNum: number) => void): LeftPanel;
}
