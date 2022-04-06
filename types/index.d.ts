import './index.css';
/**
 * PDFLiveElement.
 */
declare class PDFLiveElement extends HTMLElement {
    /** @type {LoadingModal} */
    private loadingModal;
    /** @type {ErrorModal} */
    private errorModal;
    /** @type {Language} */
    private language;
    /** @type {boolean} */
    private loaded;
    /** @type {boolean} */
    private calledLoadHandler;
    /** @type {boolean} */
    private pageNav;
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
     * @param  {'pageChange'|'documentLoaded'}  type
     * @param  {() => void}                     listener
     * @param  {{once: boolen}}                 options.once
     * @return {PDFLiveElement}
     */
    on(type: 'pageChange' | 'documentLoaded', listener: (evnt?: Event) => void, options?: {
        once: boolean;
    }): PDFLiveElement;
    /**
     * Remove event listener
     *
     * @param  {string}     type
     * @param  {() => void} listener
     * @return {PDFLiveElement}
     */
    off(type: string, listener: (evnt?: Event) => void): PDFLiveElement;
    /**
     * Returns the current page number.
     *
     * @return {number}
     */
    getCurrentPageNumber(): number;
    /**
     * Call event listener
     *
     * @param  {string} type
     * @param  {Object} detail
     * @return {void}
     */
    private invoke;
    /**
     * Render viewer.
     */
    private render;
}
export default PDFLiveElement;
