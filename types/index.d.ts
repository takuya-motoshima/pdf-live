import './index.css';
/**
 * PDFLiveElement.
 */
declare class PDFLiveElement extends HTMLElement {
    /** @type {Loading} */
    private readonly loading;
    /** @type {ErrorModal} */
    private readonly errorModal;
    /** @type {PasswordModal} */
    private readonly passwordModal;
    /** @type {Language} */
    private readonly language;
    /** @type {boolean} */
    private loaded;
    /** @type {boolean} */
    private calledLoadListener;
    /** @type {boolean} */
    private pageNav;
    /** @type {HTMLDivElement} */
    private readonly documentTitle;
    /** @type {HTMLButtonElement} */
    private readonly printButton;
    /** @type {HTMLButtonElement} */
    private readonly downloadButton;
    /** @type {HTMLButtonElement} */
    private readonly themeChangeButton;
    /** @type {{[key: string]: Function}} */
    private readonly listeners;
    /** @type {string|undefined} */
    private documentUrl;
    /** @type {any|undefined} */
    private documentObject;
    /**
     * constructor
     */
    constructor();
    /**
     * Called every time the element is inserted into the DOM.
     *
     * @return {void}
     */
    protected connectedCallback(): Promise<void>;
    /**
     * Define elements
     *
     * @return {PDFLiveElement}
     */
    static define(): typeof PDFLiveElement;
    /**
     * Generate elements
     *
     * @return {PDFLiveElement}
     */
    static createElement(): PDFLiveElement;
    /**
     * Add event listener
     *
     * @param  {'pageChange'|'documentLoaded'|'passwordEnter'}  type
     * @param  {Function}                                       listener
     * @return {PDFLiveElement}
     */
    on(type: 'pageChange' | 'documentLoaded' | 'passwordEnter', listener: Function): PDFLiveElement;
    /**
     * Returns the current page number.
     *
     * @return {number}
     */
    getCurrentPageNumber(): number;
    /**
     * Render viewer.
     */
    private render;
    /**
     * Print Documentation.
     */
    print(): Promise<void>;
    /**
     * Download Documentation.
     */
    download(): Promise<void>;
}
export default PDFLiveElement;
