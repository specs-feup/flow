/**
 * Represents a generic error that occurs in the LaraFlow library.
 * This error should be thrown when a logic error occurs that should not be caught.
 * 
 * It only serves to inform the developer that an invariant has been broken, thus
 * highlighting a bug in the code.
 */
export default class LaraFlowError extends Error {
    /**
     * Creates a new LaraFlowError.
     * 
     * @param message The error message.
     */
    constructor(message: string) {
        super(message);
        this.name = "LaraFlowError";
    }
}
