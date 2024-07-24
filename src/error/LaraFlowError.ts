export default class LaraFlowError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LaraFlowError";
    }
}
