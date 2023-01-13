/**
 * Show loading.
 */
export default class Loading {
    /** @type {HTMLDivElement} */
    protected readonly loadingNode: HTMLDivElement;
    /**
     * Construct loading.
     */
    constructor(context: HTMLElement);
    /**
     * Render the content of this component.
     */
    protected render(): string;
    /**
     * Show loading.
     */
    show(): Loading;
    /**
     * Hide loading.
     */
    hide(): Loading;
    /**
     * Destroy loading.
     */
    destroy(): void;
}
