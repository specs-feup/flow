import EdgeIdGenerator from "lara-flow/graph/id/EdgeIdGenerator";
import NodeIdGenerator from "lara-flow/graph/id/NodeIdGenerator";

export default class IncrementingIdGenerator implements NodeIdGenerator, EdgeIdGenerator {
    #id = 0;
    #prefix: string;

    constructor(prefix: string = "") {
        this.#id = 0;
        this.#prefix = prefix;
    }

    newId(): string {
        const result = `${this.#prefix}${this.#id}`;
        this.#id += 1;
        return result;
    }
}
