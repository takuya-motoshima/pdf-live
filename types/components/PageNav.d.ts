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
    private changeHandler;
    /**
     * Construct page navigation.
     *
     * @param {HTMLElement} context
     * @param {number}      numPages
     */
    constructor(context: HTMLElement, numPages: number);
    /**
     * Activate the specified page.
     *
     * @param {number} pageNum
     */
    activatePage(pageNum: number): void;
    /**
     * Update page number.
     *
     * @param {number} pageNum
     */
    private updatePage;
    /**
     * Display the page corresponding to the entered page number.
     */
    private enterPage;
    /**
     * Browsing page change event. Returns the number of the page being viewed to the event handler.
     *
     * @param   {(pageNum: number) => void}
     * @returns {PageNav} The instance on which this method was called.
     */
    onChange(handler: (pageNum: number) => void): PageNav;
}
