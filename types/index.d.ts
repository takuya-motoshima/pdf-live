import './index.css';
/**
 * PDF LIVE component class.
 */
declare class PdfLive extends HTMLElement {
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
     * @return {PdfLive}
     */
    static define(): typeof PdfLive;
    /**
     * Generate elements
     *
     * @return {PdfLive}
     */
    static createElement(): PdfLive;
    /**
     * Add event listener
     *
     * @param  {'pageChange'|'documentLoaded'}  type
     * @param  {() => void}                     listener
     * @param  {{once: boolen}}                 options.once
     * @return {PdfLive}
     */
    on(type: 'pageChange' | 'documentLoaded', listener: (evnt?: Event) => void, options?: {
        once: boolean;
    }): PdfLive;
    /**
     * Remove event listener
     *
     * @param  {string}     type
     * @param  {() => void} listener
     * @return {PdfLive}
     */
    off(type: string, listener: (evnt?: Event) => void): PdfLive;
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
export default PdfLive;
