/**
 * Left panel controller.
 */
export default class ThumbnailPanel {
    /** @type {HTMLButtonElement} */
    private readonly thumbnailPanelToggle;
    /** @type {HTMLDivElement} */
    private readonly thumbnailPanel;
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
     */
    activatePage(pageNum: number): void;
    /**
     * Render thumbnail images.
     */
    private render;
    /**
     * Thumbnail selection event. Returns the page number of the selected thumbnail to the listener.
     */
    onSelect(listener: (pageNum: number) => void): ThumbnailPanel;
}
