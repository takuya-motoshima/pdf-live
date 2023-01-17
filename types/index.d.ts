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
    private pdfDocument;
    /**
     * constructor
     */
    constructor();
    /**
     * Called every time the element is inserted into the DOM.
     */
    protected connectedCallback(): Promise<void>;
    /**
     * Define elements
     */
    static define(): typeof PDFLiveElement;
    /**
     * Generate elements
     */
    static createElement(): PDFLiveElement;
    /**
     * Add event listener
     */
    on(type: 'pageChange' | 'documentLoaded' | 'passwordEnter', listener: Function): PDFLiveElement;
    /**
     * Returns the current page number.
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
