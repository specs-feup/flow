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
     * Returns the union of this collection with another other collection.
     * You may chain this method to union multiple collections.
     *
     * If the rhs collection is a subtype of the lhs collection, the resulting
     * collection will have the lhs type. Otherwise, the resulting collection
     * is downgraded to a BaseNode and must be casted to the desired type
     * explicitly with {@link NodeCollection.allAs}.
     *
     * @param other The other collection to union with.
     * @returns A new collection containing the union of all nodes.
     * @throws LaraFlowError if the other collection is from a different graph.
     */
    union<D2 extends D, S2 extends S>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D, S, N>;
    union<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D | D2, S | S2, BaseNode.Class<D | D2, S | S2>>;
    union<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<any, any, any> {
        if (other.graph.toCy() !== this.graph.toCy()) {
            throw new LaraFlowError("Cannot union nodes from different graphs");
        }

        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.graph,
            this.#nodeClass,
            this.toCy().union(other.toCy()),
        );
    }

    /**
     * Returns the intersection of this collection with another collection.
     * You may chain this method to intersect multiple collections.
     *
     * @param other The other collection to union with.
     * @returns A new collection containing the union of all nodes.
     */
    intersection<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D, S, N> {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.graph,
            this.#nodeClass,
            this.toCy().intersection(other.toCy()),
        );
    }

    /**
     * Returns the set difference of this collection with another collection.
     *
     * @param other The other collection.
     * @returns A new collection that consists of the nodes in this collection
     * that are not in the other collection.
     */
    difference<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D, S, N> {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.graph,
            this.#nodeClass,
            this.toCy().difference(other.toCy()),
        );
    }

    /**
     * Returns a collection with the elements sorted according to the
     * given comparison function.
     *
     * @todo confirm that the behavior (which is from cytoscape) and
     * document it
     *
     * @param f The comparison function to use for sorting.
     * @returns A new collection with the elements sorted.
     */
    sort(f: (a: N, b: N) => number): NodeCollection<D, S, N> {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            this.#nodeClass,
            this.#nodes.sort((a, b) =>
                f(new this.#nodeClass(this.graph, a), new this.#nodeClass(this.graph, b)),
            ),
        );
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
    forEach<T>(f: (ele: N, i: number, eles: this) => void, thisArg?: T) {
        for (let i = 0; i < this.length; i++) {
            if (thisArg === undefined) {
                f(this[i], i, this);
            } else {
                f.call(thisArg, this[i], i, this);
            }
        }
    }

    /**
     * Find the minimum value in a collection.
     *
     * @param f The function that returns the value to compare. ele - The current
     * element, i - The index of the current element, eles - The collection of
     * elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns An object with the minimum element and its value, or undefined if
     * the collection is empty.
     */
    min(
        f: (ele: N, i: number, eles: this) => number,
    ): { element: N; value: number } | undefined;
    min<T>(
        f: (this: T, ele: N, i: number, eles: this) => number,
        thisArg: T,
    ): { element: N; value: number } | undefined;
    min<T>(
        f: (ele: N, i: number, eles: this) => number,
        thisArg?: T,
    ): { element: N; value: number } | undefined {
        if (this.isEmpty) {
            return undefined;
        }
        const m = this.#nodes.min((ele, i) => {
            if (thisArg === undefined) {
                return f(this[i], i, this);
            } else {
                return f.call(thisArg, new this.#nodeClass(this.graph, ele), i, this);
            }
        });
        return {
            element: new this.#nodeClass(this.graph, m.ele),
            value: m.value,
        };
    }

    /**
     * Find the maximum value in a collection.
     *
     * @param f The function that returns the value to compare. ele - The current
     * element, i - The index of the current element, eles - The collection of
     * elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns An object with the maximum element and its value, or undefined if
     * the collection is empty.
     */
    max(
        f: (ele: N, i: number, eles: this) => number,
    ): { element: N; value: number } | undefined;
    max<T>(
        f: (this: T, ele: N, i: number, eles: this) => number,
        thisArg: T,
    ): { element: N; value: number } | undefined;
    max<T>(
        f: (ele: N, i: number, eles: this) => number,
        thisArg?: T,
    ): { element: N; value: number } | undefined {
        if (this.isEmpty) {
            return undefined;
        }
        const m = this.#nodes.max((ele, i) => {
            if (thisArg === undefined) {
                return f(this[i], i, this);
            } else {
                return f.call(thisArg, new this.#nodeClass(this.graph, ele), i, this);
            }
        });
        return {
            element: new this.#nodeClass(this.graph, m.ele),
            value: m.value,
        };
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
     * @returns the graph that this collection is a part of.
     */
    get graph(): BaseGraph.Class {
        return this.#graph;
    }

    /**
     * @returns The underlying cytoscape collection object.
     */
    toCy(): cytoscape.NodeCollection {
        return this.#nodes;
    }

    // Absolute complement
    // symmetricDifference
    // diff
    // cy|eles.filter( _function(ele, i, eles)_ );
    // _nodes_ .commonAncestors

    // _eles_ .same() -> not equals because of sorting
    // _eles_ .anySame() -> in
    // _eles_ .contains() (and maybe .has())
    // _eles_ .some
    // _eles_ .every

    // In singulars:
    // _nodes_ .ancestors
    // _nodes_ .children
    // _nodes_ .descendants
    // _edges_ .paralelEdges()
    // _edges_ .codirectedEdges()
    // _nodes_ .successors()
    // _nodes_ .predecessors()
    // _nodes_ .connectedEdges()
    // _nodes_ .edgesWith
    // _nodes_ .edgesTo (maybe edgesFrom?)

    // _eles_ .clone() - Get a new collection containing clones (i.e. copies) of the elements in the calling collection.
    //      This can probably be also used in singulars

    // _eles_ .components et al

    // map()
    //   - Para algo como o cytoscape, provavelmente não vale a pena, porque
    //   bastaria fazer .toArray().map()
    //   - Para algo que retorna outro nó, pode ser interessante
    //   - mais interessante ainda seria um flatMap(), que retorna uma coleção
    //   que é flattened. Ex. .flatMap((n) => n.outgoers.targets) podia retornar
    //   uma coleção com todos os outgoers
    // De um modo geral, independentemente dos três pontos, acho que só valem
    // a pena explorar quando aparecer um caso de uso que os justifique.

    // - cytoscape dijkstra search (involves passing a collection of nodes) (maybe has a method to return the last result)
}
