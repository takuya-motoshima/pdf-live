import Modal from '~/components/Modal';
/**
 * Error modal.
 */
export default class ErrorModal extends Modal {
    /** @type {HTMLDivElement} */
    private readonly message;
    /**
     * Construct modal.
     */
    constructor(context: HTMLElement);
    /**
     * Render the content of this component.
     */
    protected render(): string;
    /**
     * Show modal.
     */
    show(message?: string): ErrorModal;
}
