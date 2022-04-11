import Modal from '~/components/Modal.js';
import Language from '~/interfaces/Language';
/**
 * Password input modal.
 */
export default class PasswordModal extends Modal {
    /** @type {(password: string) => void} */
    private enterListener;
    /** @type {(() => void) | undefined} */
    private rslv;
    /** @type {((err: Error) => void) | undefined} */
    private rej;
    /** @type {Loading} */
    private loading;
    /** @type {HTMLInputElement} */
    private passwordInput;
    /** @type {HTMLDivElement} */
    private incorrect;
    /** @type {HTMLButtonElement} */
    private submitButton;
    /**
     * Construct modal.
     *
     * @param {HTMLElement} context
     * @param {Language}    language
     */
    constructor(context: HTMLElement, language: Language);
    /**
     * Render the content of this component.
     *
     * @returns {string} Modal HTML.
     */
    render(): string;
    /**
     * Show modal.
     */
    show(): Promise<void>;
    /**
     * Destroy modal
     */
    destroy(): void;
    /**
     * Password enter event. Returns the password entered to the event listener.
     *
     * @param   {(password: string) => boolean|Promise<boolean>}
     * @returns {PasswordModal} The instance on which this method was called.
     */
    onEnter(listener: (password: string) => boolean | Promise<boolean>): PasswordModal;
}
