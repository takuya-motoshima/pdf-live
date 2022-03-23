/**
 * Modal base class.
 */
export default class {
    /** @type {HTMLDivElement} */
    protected readonly modalNode: HTMLDivElement;
    /**
     * Construct modal. Add modal node defined in subclass to context.
     *
     * @param {HTMLElement} context
     */
    constructor(context: HTMLElement);
    /**
     * Returns modal node HTML.
     */
    protected render(): string;
    /**
     * Show modal.
     */
    show(): void;
    /**
     * Hide modal.
     */
    hide(): void;
}
