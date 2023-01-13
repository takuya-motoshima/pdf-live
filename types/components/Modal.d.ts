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
     */
    constructor(context: HTMLElement, language?: Language);
    /**
     * Returns modal node HTML.
     */
    protected render(): string;
    /**
     * Show modal.
     */
    show(): Modal | Promise<void>;
    /**
     * Hide modal.
     */
    hide(): Modal;
    /**
     * Destroy modal
     */
    destroy(): void;
}
