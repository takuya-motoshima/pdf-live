import Modal from '~/components/Modal';
/**
 * Error modal.
 */
export default class extends Modal {
    /** @type {HTMLDivElement} */
    private readonly message;
    /**
     * Construct modal.
     *
     * @param {HTMLElement} context
     */
    constructor(context: HTMLElement);
    /**
     * Render the content of this component.
     *
     * @returns {string} Modal HTML.
     */
    protected render(): string;
    /**
     * Show modal.
     *
     * @param {string} message
     */
    show(message?: string): void;
}
