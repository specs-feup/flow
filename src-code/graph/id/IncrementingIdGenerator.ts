import Edge from "@specs-feup/flow/graph/Edge";
import Node from "@specs-feup/flow/graph/Node";

/**
 * An id generator that generates ids by incrementing a number. Can be used for
 * nodes and edges (the same instance can even be used for both simultaneously).
 *
 * This generator is specially useful when deterministic ids are necessary.
 * Note that some transformations may create temporary nodes or edges, which, after
 * being removed, will not be reused, and may give the impression that the ids are not
 * sequential.
 */
export default class IncrementingIdGenerator
    implements Node.IdGenerator, Edge.IdGenerator
{
    /**
     * The current id.
     */
    #id = 0;
    /**
     * A prefix to be added to the generated ids
     */
    #prefix: string;

    /**
     * Creates a new instance of the id generator.
     *
     * @param prefix An optional prefix to be added to the generated ids.
     */
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
