import Language from '~/interfaces/Language';
/**
 * Modal base class.
 */
export default class Modal {
    /** @type {HTMLDivElement} */
    protected readonly modalNode: HTMLDivElement;
    /** @type {Language} */
    protected language: Language | undefined;
    /**
     * Construct modal. Add modal node defined in subclass to context.
     *
     * @param {HTMLElement} context
     * @param {Language}    language
     */
    constructor(context: HTMLElement, language?: Language);
    /**
     * Returns modal node HTML.
     *
     * @returns {string} Modal HTML.
     */
    protected render(): string;
    /**
     * Show modal.
     *
     * @returns {Modal} The instance on which this method was called.
     */
    show(): Modal | Promise<void>;
    /**
     * Hide modal.
     *
     * @returns {Modal} The instance on which this method was called.
     */
    hide(): Modal;
    /**
     * Destroy modal
     */
    destroy(): void;
}
