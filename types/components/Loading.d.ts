/**
 * Show loading.
 */
export default class Loading {
    /** @type {HTMLDivElement} */
    protected readonly loadingNode: HTMLDivElement;
    /**
     * Construct loading.
     *
     * @param {HTMLElement} context
     */
    constructor(context: HTMLElement);
    /**
     * Render the content of this component.
     *
     * @returns {string} Loading HTML.
     */
    protected render(): string;
    /**
     * Show loading.
     *
     * @returns {Loading} The instance on which this method was called.
     */
    show(): Loading;
    /**
     * Hide loading.
     *
     * @returns {Loading} The instance on which this method was called.
     */
    hide(): Loading;
    /**
     * Destroy loading.
     */
    destroy(): void;
}
