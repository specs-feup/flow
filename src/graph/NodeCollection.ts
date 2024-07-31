import LaraFlowError from "lara-flow/error/LaraFlowError";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import Node from "lara-flow/graph/Node";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

export class NodeCollection<
    D extends BaseNode.Data = BaseNode.Data,
    S extends BaseNode.ScratchData = BaseNode.ScratchData,
    N extends BaseNode.Class<D, S> = BaseNode.Class<D, S>,
> {
    /**
     * The graph that this node is a part of.
     */
    #graph: BaseGraph.Class;
    /**
     * The class produced for elements of this collection.
     * This collection may only contain nodes that extend this class.
     */
    #nodeClass: Node.Class<D, S, N>;
    /**
     * Underlying cytoscape node object.
     */
    #nodes: cytoscape.NodeCollection;

    /**
     * This constructor is for internal use only.
     *
     * It is not possible to make the constructor private or protected as it is used
     * in other parts of this framework outside of this class (for instance,
     * {@link BaseNode.Class}). However, it should not be used directly by user code.
     *
     * @param graph The graph that this collection is a part of.
     * @param nodeClass The underlying cytoscape node object.
     * @param nodes The underlying cytoscape collection object.
     * @deprecated
     */
    constructor(
        graph: BaseGraph.Class,
        nodeClass: Node.Class<D, S, N>,
        nodes: cytoscape.NodeCollection,
    ) {
        this.#graph = graph;
        this.#nodeClass = nodeClass;
        this.#nodes = nodes;

        // This proxy will make the collection behave like an array of nodes.
        // It does this by deferring numeric properties to the underlying cytoscape collection,
        // which also behaves like an array.
        return new Proxy(this, {
            get(target, prop) {
                if (Number(prop) == (prop as any)) {
                    // Wraps the cytoscape node object in the node class.
                    const value = nodes[prop as any];
                    if (value === undefined) {
                        return undefined;
                    }
                    return new nodeClass(graph, value);
                }

                const value = (target as any)[prop];
                if (value instanceof Function) {
                    // Binding to target is necessary for accessing private fields.
                    return value.bind(target);
                }

                return value;
            },
            has(target, prop): boolean {
                if (Number(prop) == (prop as any)) {
                    return prop in nodes;
                }
                return prop in target;
            },
            deleteProperty(target, prop): boolean {
                if (Number(prop) == (prop as any)) {
                    delete nodes[prop as any];
                    return true;
                }
                delete target[prop as any];
                return true;
            },

            set(target, prop, newValue): boolean {
                if (Number(prop) == (prop as any)) {
                    nodes[prop as any] = newValue;
                    return true;
                }
                target[prop as any] = newValue;
                return true;
            },
        });
    }

    /**
     * Access the node at the given index.
     * Indexing cannot be implemented directly in the class,
     * so it is implemented by proxy.
     */
    [index: number]: N;

    /**
     * Access the node at the given index.
     * This is similar to doing `collection[index]`, but has
     * undefined in the return type.
     *
     * @param index The index of the node to access.
     * @returns The node at the given index, or undefined if it does not exist.
     */
    at(index: number): N | undefined {
        return this[index];
    }

    /**
     * Get the first node in the collection.
     */
    first(): N | undefined {
        return this.at(0);
    }

    /**
     * Get the last node in the collection.
     */
    last(): N | undefined {
        return this.at(this.length - 1);
    }

    /**
     * @returns The number of nodes in this collection.
     */
    get length(): number {
        return this.#nodes.length;
    }

    /**
     * @returns Whether this collection is empty.
     */
    get isEmpty(): boolean {
        return this.#nodes.empty();
    }

    /**
     * Get the node with the given id, or undefined if it is not
     * in this collection.
     */
    getElementById(id: string): N | undefined {
        const node = this.#nodes.getElementById(id);
        if (node === undefined) {
            return undefined;
        }
        return new this.#nodeClass(this.#graph, node);
    }

    /**
     * Checks if all nodes in this collection are compatible
     * with a specific type. This is effectively a type guard function.
     *
     * @param NodeType The node type to check compatibility with.
     * @returns Whether the node is compatible with the given type.
     */
    allAre<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(
        NodeType: Node<D2, S2, N2>,
    ): this is NodeCollection<D2, S2, BaseNode.Class<D2, S2>> {
        for (let i = 0; i < this.length; i++) {
            if (!this[i].is(NodeType)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Filters the collection, keeping only the nodes that are compatible with
     * the given type. The collection automatically becomes a collection of that
     * type.
     *
     * @param NodeType The node type to test compatibility with.
     * @returns The collection, with the new node type.
     */
    filterIs<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(NodeType: Node<D2, S2, N2>): NodeCollection<D2, S2, N2> {
        const filtered = this.#nodes.filter((node) =>
            new this.#nodeClass(this.#graph, node).is(NodeType),
        );
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, NodeType.Class, filtered);
    }

    /**
     * Changes the functionality class of the nodes. This is only
     * possible if the data and scratch data are compatible with the new class.
     *
     * This is analogous to {@link BaseNode.Class.as} but for a collection of nodes.
     *
     * @param NodeType The node type to change the functionality class into.
     * @returns The same collection, with the new functionality class.
     */
    allAs<N extends BaseNode.Class<D, S>>(NodeType: {
        Class: Node.Class<D, S, N>;
    }): NodeCollection<D, S, N> {
        // The following signature does not work
        // as<N extends BaseNode.Class<D, S>>(NodeType: Node<D, S, N>): NodeCollection<D, S, N> {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, NodeType.Class, this.#nodes);
    }

    /**
     * Changes the functionality class of the nodes. Should only be used
     * when it is known (but not statically provable) that all nodes are compatible
     * with the new class. If not, an error will be thrown.
     *
     * It is bad practice to try and catch the error thrown by this function. For
     * such cases, combine {@link NodeCollection.allAre} with {@link NodeCollection.allAs}.
     *
     * @param NodeType The node type to change the functionality class into.
     * @param message The message to throw if the node is not compatible with the type.
     * May also be a function that takes the index of the first incompatible node and
     * returns a message.
     * @returns The node collection, wrapped in the new functionality class.
     * @throws LaraFlowError if any node is not compatible with the type.
     * This error should be seen as a logic error and not catched.
     */
    expectAll<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(
        NodeType: Node<D2, S2, N2>,
        message?: string | ((i: number) => string),
    ): NodeCollection<D2, S2, N2> {
        for (let i = 0; i < this.length; i++) {
            if (!this[i].is(NodeType)) {
                if (message === undefined) {
                    message = (i) => `Graph type mismatch on node ${i}`;
                } else if (typeof message === "string") {
                    // Some weird typescript inference problem prevents message from being
                    // used directly inside the lambda.
                    const _message = message;
                    message = () => _message;
                }
                throw new LaraFlowError(message(i));
            }
        }

        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, NodeType.Class, this.#nodes);
    }

    /**
     * Returns the union of this collection with other collections.
     * 
     * @todo Variance does not work very well when multiple arguments have different
     * data and scratch data types. Trying to come up with a better signature would be
     * desirable. For any user running into this limitation, simply run the union one
     * argument at a time (which is how you would do in cytoscape anyway).
     * 
     * @param others The other collections to union with.
     * @returns A new collection containing the union of all nodes.
     */
    union<
        D2 extends D,
        S2 extends S,
    >(...others: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>[]): NodeCollection<D, S, N> {
        let result = this.#nodes;
        for (const other of others) {
            // @todo guarantee that this tests the graph properly
            if (other.#graph !== this.#graph) {
                throw new LaraFlowError("Cannot union nodes from different graphs");
            }
            result = result.union(other.#nodes);
        }

        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, this.#nodeClass, result);
    }


    /**
     * Returns the total degree of all nodes in the collection.
     * Loop edges are counted twice.
     *
     * @returns the total degree of this collection.
     */
    get totalDegree(): number {
        return this.#nodes.totalDegree(true);
    }

    /**
     * Returns the total degree of all nodes in the collection.
     * Loop edges are not counted.
     *
     * @returns the total degree of this collection, excluding loop edges.
     */
    get totalDegreeWithoutLoops(): number {
        return this.#nodes.totalDegree(false);
    }

    /**
     * Returns the minimum degree of all nodes in the collection.
     * Loop edges are counted twice.
     *
     * @returns the minimum degree of this collection.
     */
    get minDegree(): number {
        return this.#nodes.minDegree(true);
    }

    /**
     * Returns the minimum degree of all nodes in the collection.
     * Loop edges are not counted.
     *
     * @returns the minimum degree of this collection, excluding loop edges.
     */
    get minDegreeWithoutLoops(): number {
        return this.#nodes.minDegree(false);
    }

    /**
     * Returns the maximum degree of all nodes in the collection.
     * Loop edges are counted twice.
     *
     * @returns the maximum degree of this collection.
     */
    get maxDegree(): number {
        return this.#nodes.maxDegree(true);
    }

    /**
     * Returns the maximum degree of all nodes in the collection.
     * Loop edges are not counted.
     *
     * @returns the maximum degree of this collection, excluding loop edges.
     */
    get maxDegreeWithoutLoops(): number {
        return this.#nodes.maxDegree(false);
    }

    /**
     * Returns the minimum indegree of all nodes in the collection.
     * Loop edges are counted twice.
     * 
     * @returns the minimum indegree of this collection.
     */
    get minIndegree(): number {
        return this.#nodes.minIndegree(true);
    }
    
    /**
     * Returns the minimum indegree of all nodes in the collection.
     * Loop edges are not counted.
     * 
     * @returns the minimum indegree of this collection, excluding loop edges.
     */
    get minIndegreeWithoutLoops(): number {
        return this.#nodes.minIndegree(false);
    }

    /**
     * Returns the maximum indegree of all nodes in the collection.
     * Loop edges are counted twice.
     * 
     * @returns the maximum indegree of this collection.
     */
    get maxIndegree(): number {
        return this.#nodes.maxIndegree(true);
    }

    /**
     * Returns the maximum indegree of all nodes in the collection.
     * Loop edges are not counted.
     * 
     * @returns the maximum indegree of this collection, excluding loop edges.
     */
    get maxIndegreeWithoutLoops(): number {
        return this.#nodes.maxIndegree(false);
    }

    /**
     * Returns the minimum outdegree of all nodes in the collection.
     * Loop edges are counted twice.
     * 
     * @returns the minimum outdegree of this collection.
     */
    get minOutdegree(): number {
        return this.#nodes.minOutdegree(true);
    }

    /**
     * Returns the minimum outdegree of all nodes in the collection.
     * Loop edges are not counted.
     * 
     * @returns the minimum outdegree of this collection, excluding loop edges.
     */
    get minOutdegreeWithoutLoops(): number {
        return this.#nodes.minOutdegree(false);
    }

    /**
     * Executes the provided function once for each node in the collection.
     *
     * Unline the analogous cytoscape method, this method does not support
     * exiting early by returning false, due to the fact that a `return false;`
     * would not be clear and intuitive for someone reading the code. As such,
     * this function follows the behavior of the Array.prototype.forEach method.
     *
     * In the future, if that feature is really desirable, instead of returning false,
     * the function could return an enum value that represents a control flow instruction.
     * Until then, a for loop may be used.
     *
     * @param f The function to execute for each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     */
    forEach(f: (ele: N, i: number, eles: this) => void): void;
    forEach<T>(f: (this: T, ele: N, i: number, eles: this) => void, thisArg: T): void;
    forEach<T>(
        f: (this: T | undefined, ele: N, i: number, eles: this) => void,
        thisArg?: T,
    ) {
        for (let i = 0; i < this.length; i++) {
            f.call(thisArg, this[i], i, this);
        }
    }

    /**
     * Get a subset of the elements in the collection based on specified indices.
     *
     * @param start An integer that specifies where to start the selection.
     *              If omitted, the first element, with an index of 0, will be selected.
     *              Use negative numbers to select from the end of an array.
     * @param end An integer that specifies where to end the selection.
     *            If omitted, all elements from the start position and to the end of the array will be selected.
     *            Use negative numbers to select from the end of an array.
     * @returns A new collection containing the selected elements.
     */
    slice(start?: number, end?: number): NodeCollection<D, S, N> {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            this.#nodeClass,
            this.#nodes.slice(start, end),
        );
    }

    /**
     * Makes this class behave like an iterable object.
     */
    [Symbol.iterator]() {
        return this.#nodes[Symbol.iterator]();
    }

    /**
     * @returns This collection as an array of nodes.
     */
    toArray(): N[] {
        return this.#nodes.map((node) => new this.#nodeClass(this.#graph, node));
    }

    /**
     * @returns The underlying cytoscape collection object.
     */
    toCy(): cytoscape.NodeCollection {
        return this.#nodes;
    }

    // map(),
    // something like map-flat (instead of outgoers, etc)

    // remove/restore

    // https://js.cytoscape.org/#collection/comparison
    // https://js.cytoscape.org/#collection/building--filtering
    // https://js.cytoscape.org/#collection/traversing
    // _nodes_ .ancestors
    // _nodes_ .commonAncestors
    // _nodes_ .children
    // _nodes_ .descendants
    // _eles_ .clone() - Get a new collection containing clones (i.e. copies) of the elements in the calling collection.
    //      This can probably be also used in singulars
    // - selector support
    //     https://js.cytoscape.org/#selectors
    //     cy.collection(); // Empty collection
    //     cy|eles.filter( _selector_ ); cy|eles.filter( _function(ele, i, eles)_ );
    //          Probably also applies to Graph
    //     .union( _selector_ ) et al.
    // - cytoscape dijkstra search (involves passing a collection of nodes) (maybe has a method to return the last result)
}
