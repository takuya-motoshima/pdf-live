/**
 * Control page navigation.
 */
export default class PageNav {
    /** @type {HTMLInputElement} */
    private readonly pageInput;
    /** @type {HTMLSpanElement} */
    private readonly totalPage;
    /** @type {HTMLButtonElement} */
    private readonly prevPageButton;
    /** @type {HTMLButtonElement} */
    private readonly nextPageButton;
    /** @type {HTMLDivElement} */
    private readonly pageView;
    /** @type {HTMLDivElement[]} */
    private readonly pageNodes;
    /** @type {HTMLFormElement} */
    private readonly pageForm;
    /** @type {number} */
    private readonly minPage;
    /** @type {number} */
    private readonly maxPage;
    /** @type {number} */
    private lastPage;
    /** @type {(pageNum: number) => void} */
    private changeListener;
    /**
     * Construct page navigation.
     */
    constructor(context: HTMLElement, pageNumber: number);
    /**
     * Activate the specified page.
     */
    activatePage(pageNum: number): void;
    /**
     * Update page number.
     */
    private updatePage;
    /**
     * Display the page corresponding to the entered page number.
     */
    private enterPage;
    /**
     * Browsing page change event. Returns the number of the page being viewed to the event listener.
     */
    onChange(listener: (pageNum: number) => void): PageNav;
    /**
     * Returns the current page number.
     */
    getCurrentPageNumber(): number;
}
