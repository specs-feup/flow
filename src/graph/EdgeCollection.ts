import LaraFlowError from "lara-flow/error/LaraFlowError";
import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import Edge from "lara-flow/graph/Edge";
import Graph from "lara-flow/graph/Graph";
import Node from "lara-flow/graph/Node";
import { NodeCollection } from "lara-flow/graph/NodeCollection";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

/**
 * A collection of edges from a given graph. All edges have a common
 * edge type. If the edges can be of any edge type, the common type
 * is {@link BaseEdge}.
 */
export class EdgeCollection<
    D extends BaseEdge.Data = BaseEdge.Data,
    S extends BaseEdge.ScratchData = BaseEdge.ScratchData,
    E extends BaseEdge.Class<D, S> = BaseEdge.Class<D, S>,
> {
    /**
     * The graph that this edge is a part of.
     */
    #graph: BaseGraph.Class;
    /**
     * The class produced for elements of this collection.
     * This collection may only contain edges that extend this class.
     *
     * Note: Edge.Class is not being used as the type to avoid
     * invariance problems.
     */
    #edgeClass: new (graph: BaseGraph.Class, edge: cytoscape.EdgeSingular) => E;
    /**
     * Underlying cytoscape edge object.
     */
    #edges: cytoscape.EdgeCollection;

    /**
     * This constructor is for internal use only.
     *
     * It is not possible to make the constructor private or protected as it is used
     * in other parts of this framework outside of this class (for instance,
     * {@link BaseEdge.Class}). However, it should not be used directly by user code.
     *
     * @param graph The graph that this collection is a part of.
     * @param edgeClass The underlying cytoscape edge object.
     * @param edges The underlying cytoscape collection object.
     * @deprecated
     */
    constructor(
        graph: BaseGraph.Class,
        edgeClass: Edge.Class<D, S, E>,
        edges: cytoscape.EdgeCollection,
    ) {
        this.#graph = graph;
        this.#edgeClass = edgeClass;
        this.#edges = edges;

        // This proxy will make the collection behave like an array of edges.
        // It does this by deferring numeric properties to the underlying cytoscape collection,
        // which also behaves like an array.
        return new Proxy(this, {
            get(target, prop) {
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    // Wraps the cytoscape edge object in the node class.
                    const value = edges[prop as any];
                    if (value === undefined) {
                        return undefined;
                    }
                    return new edgeClass(graph, value);
                }

                const value = (target as any)[prop];
                if (value instanceof Function) {
                    // Binding to target is necessary for accessing private fields.
                    return value.bind(target);
                }

                return value;
            },
            has(target, prop): boolean {
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    return prop in edges;
                }
                return prop in target;
            },
            deleteProperty(target, prop): boolean {
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    delete edges[prop as any];
                    return true;
                }
                delete target[prop as any];
                return true;
            },
            set(target, prop, newValue): boolean {
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    edges[prop as any] = newValue;
                    return true;
                }
                target[prop as any] = newValue;
                return true;
            },
        });
    }

    /**
     * Creates a new collection from the given edges.
     * At least one edge must be provided. For an empty collection, use
     * {@link BaseGraph.Class.emptyCollection}.
     *
     * @param first The first edge in the collection.
     * @param elements The rest of the edges in the collection.
     * @returns A new collection containing the given edges.
     */
    static from<
        D extends BaseEdge.Data,
        S extends BaseEdge.ScratchData,
        E extends BaseEdge.Class<D, S>,
    >(first: E, ...elements: E[]): EdgeCollection<D, S, E> {
        for (const element of elements) {
            if (element.graph.toCy() !== first.graph.toCy()) {
                throw new LaraFlowError(
                    "Cannot create collection with edges from different graphs",
                );
            }
        }

        const collection = first.graph.toCy().collection();
        collection.merge(first.toCy());
        for (const element of elements) {
            collection.merge(element.toCy());
        }

        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(first.graph, first.constructor as any, collection);
    }

    /**
     * Creates a new collection from the given cytoscape collection.
     *
     * @param edges The cytoscape collection to create the collection from.
     * @returns A new collection containing the edges from the cytoscape collection.
     */
    static fromCy(edges: cytoscape.EdgeCollection): EdgeCollection {
        if (edges.length === 0) {
            throw new LaraFlowError(
                "Cannot create collection from empty cytoscape collection",
            );
        }
        const first = edges[0];
        for (let i = 1; i < edges.length; i++) {
            if (edges[i].cy() !== first.cy()) {
                throw new LaraFlowError(
                    "Cannot create collection with edges from different graphs",
                );
            }
        }
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(Graph.fromCy(first.cy()), BaseEdge.Class, edges);
    }

    /**
     * Access the edge at the given index.
     * Indexing cannot be implemented directly in the class,
     * so it is implemented by proxy.
     *
     * Note (for implementers of lara-flow only): since this
     * indexing is implemented in the proxy and not in the class,
     * internal method implementations may not use it. Instead,
     * they should use the {@link EdgeCollection.at} method.
     */
    [index: number]: E;

    /**
     * Access the edge at the given index.
     * This is similar to doing `collection[index]`, but has
     * undefined in the return type.
     *
     * @param index The index of the edge to access.
     * @returns The edge at the given index, or undefined if it does not exist.
     */
    at(index: number): E | undefined {
        const value = this.#edges[index];
        if (value === undefined) {
            return undefined;
        }
        return new this.#edgeClass(this.graph, value);
    }

    /**
     * Get the first edge in the collection.
     */
    first(): E | undefined {
        return this.at(0);
    }

    /**
     * Get the last edge in the collection.
     */
    last(): E | undefined {
        return this.at(this.length - 1);
    }

    /**
     * @returns The number of edges in this collection.
     */
    get length(): number {
        return this.#edges.length;
    }

    /**
     * @returns Whether this collection is empty.
     */
    get isEmpty(): boolean {
        return this.#edges.empty();
    }

    /**
     * @returns The edge with the given id, or undefined if it is not
     * in this collection.
     */
    getElementById(id: string): E | undefined {
        const node = this.#edges.getElementById(id);
        if (node === undefined) {
            return undefined;
        }
        return new this.#edgeClass(this.#graph, node);
    }

    /**
     * @returns The source nodes connected to the edges in this collection.
     */
    get sources(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            BaseNode.Class,
            this.#edges.sources(),
        );
    }

    /**
     * @returns The target nodes connected to the edges in this collection.
     */
    get targets(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            BaseNode.Class,
            this.#edges.targets(),
        );
    }

    /**
     * Checks if all edges in this collection are compatible
     * with a specific type. This is effectively a type guard function.
     *
     * @param EdgeType The edge type to check compatibility with.
     * @returns Whether the edge is compatible with the given type.
     */
    allAre<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(
        EdgeType: Edge<D2, S2, E2>,
    ): this is EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>> {
        for (let i = 0; i < this.length; i++) {
            if (!this.at(i)!.is(EdgeType)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Filters the collection, keeping only the edges that are compatible with
     * the given type. The collection automatically becomes a collection of that
     * type.
     *
     * @param EdgeType The edge type to test compatibility with.
     * @returns The collection, with the new edge type.
     */
    filterIs<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(EdgeType: Edge<D2, S2, E2>): EdgeCollection<D2, S2, E2> {
        const filtered = this.#edges.filter((node) =>
            new this.#edgeClass(this.#graph, node).is(EdgeType),
        );
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(this.#graph, EdgeType.Class, filtered);
    }

    /**
     * Changes the functionality class of the edges. This is only
     * possible if the data and scratch data are compatible with the new class.
     *
     * This is analogous to {@link BaseEdge.Class.as} but for a collection of edges.
     *
     * @param EdgeType The edge type to change the functionality class into.
     * @returns The same collection, with the new functionality class.
     */
    allAs<E extends BaseEdge.Class<D, S>>(EdgeType: {
        Class: Edge.Class<D, S, E>;
    }): EdgeCollection<D, S, E> {
        // The following signature does not work
        // as<E extends BaseEdge.Class<D, S>>(EdgeType: Edge<D, S, N>): EdgeCollection<D, S, E> {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(this.#graph, EdgeType.Class, this.#edges);
    }

    /**
     * Changes the functionality class of the edges. Should only be used
     * when it is known (but not statically provable) that all edges are compatible
     * with the new class. If not, an error will be thrown.
     *
     * It is bad practice to try and catch the error thrown by this function. For
     * such cases, combine {@link EdgeCollection.allAre} with {@link EdgeCollection.allAs}.
     *
     * @param EdgeType The edge type to change the functionality class into.
     * @param message The message to throw if the edge is not compatible with the type.
     * May also be a function that takes the index of the first incompatible edge and
     * returns a message.
     * @returns The edge collection, wrapped in the new functionality class.
     * @throws LaraFlowError if any edge is not compatible with the type.
     * This error should be seen as a logic error and not catched.
     */
    expectAll<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(
        EdgeType: Edge<D2, S2, E2>,
        message?: string | ((i: number) => string),
    ): EdgeCollection<D2, S2, E2> {
        for (let i = 0; i < this.length; i++) {
            if (!this.at(i)!.is(EdgeType)) {
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
        return new EdgeCollection(this.#graph, EdgeType.Class, this.#edges);
    }

    /**
     * Returns whether the elements in the collection are the same as
     * the elements in the other collection.
     *
     * @param other The other collection to compare with.
     * @returns Whether the elements in the collection are the same as the elements in the other collection.
     */
    same<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(other: EdgeCollection<D2, S2, E2>): boolean {
        return this.#edges.same(other.toCy());
    }

    /**
     * Returns whether the collection contains the given edge or collection.
     *
     * @param elements The edge or collection to check for.
     * @returns Whether the collection contains the given edge or collection.
     */
    contains<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(elements: EdgeCollection<D2, S2, E2> | E2): boolean {
        return this.#edges.contains(elements.toCy());
    }

    /**
     * Returns whether the collection contains any of the edges in the given collection.
     *
     * @param elements The collection to check for.
     * @returns Whether the collection contains any of the edges in the given collection.
     */
    containsAny<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(elements: EdgeCollection<D2, S2, E2>): boolean {
        return this.#edges.anySame(elements.toCy());
    }

    /**
     * Returns the union of this collection with another collection.
     * You may chain this method to union multiple collections.
     *
     * If the rhs collection is a subtype of the lhs collection, the resulting
     * collection will have the lhs type. Otherwise, the resulting collection
     * is downgraded to a EdgeNode and must be casted to the desired type
     * explicitly with {@link EdgeCollection.allAs}.
     *
     * @param other The other collection to union with.
     * @returns A new collection containing the union of all edges.
     * @throws LaraFlowError if the other collection is from a different graph.
     */
    union<D2 extends D, S2 extends S>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<D, S, E>;
    union<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<D | D2, S | S2, BaseEdge.Class<D | D2, S | S2>>;
    union<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<any, any, any> {
        if (other.graph.toCy() !== this.graph.toCy()) {
            throw new LaraFlowError("Cannot union edges from different graphs");
        }

        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.graph,
            this.#edgeClass,
            this.toCy().union(other.toCy()),
        );
    }

    /**
     * Returns the intersection of this collection with another collection.
     * You may chain this method to intersect multiple collections.
     *
     * @param other The other collection to intersect with.
     * @returns A new collection containing the intersection of all edges.
     */
    intersection<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<D, S, E> {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.graph,
            this.#edgeClass,
            this.toCy().intersection(other.toCy()),
        );
    }

    /**
     * @returns The complement of this collection with respect to the universe
     * of all edges in the graph.
     */
    complement(): EdgeCollection {
        return this.graph.edges.difference(this);
    }

    /**
     * Returns the set difference of this collection with another collection.
     * You may chain this method to remove multiple collections.
     *
     * @param other The other collection.
     * @returns A new collection that consists of the edges in this collection
     * that are not in the other collection.
     */
    difference<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<D, S, E> {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.graph,
            this.#edgeClass,
            this.toCy().difference(other.toCy()),
        );
    }

    /**
     * Returns the symmetric difference of this collection with another collection.
     * This collection consists of the edges that are in either collection, but not
     * in both.
     *
     * If the rhs collection is a subtype of the lhs collection, the resulting
     * collection will have the lhs type. Otherwise, the resulting collection
     * is downgraded to a BaseEdge and must be casted to the desired type
     * explicitly with {@link EdgeCollection.allAs}.
     *
     * @param other The other collection to apply the symmetric difference with.
     * @returns A new collection containing the symmetric difference of the two
     * collections.
     * @throws LaraFlowError if the other collection is from a different graph.
     */
    symmetricDifference<D2 extends D, S2 extends S>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<D, S, E>;
    symmetricDifference<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<D | D2, S | S2, BaseEdge.Class<D | D2, S | S2>>;
    symmetricDifference<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
        other: EdgeCollection<D2, S2, BaseEdge.Class<D2, S2>>,
    ): EdgeCollection<any, any, any> {
        if (other.graph.toCy() !== this.graph.toCy()) {
            throw new LaraFlowError("Cannot union edges from different graphs");
        }

        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.graph,
            this.#edgeClass,
            this.toCy().symmetricDifference(other.toCy()),
        );
    }

    /**
     * Performs a diff comparison between this collection and another collection.
     * You can think of the result as the added, removed, and kept elements to go
     * from this collection to the other collection.
     *
     * @param other The other collection to compare with.
     * @returns An object with three properties:
     * - `both`: A collection with the edges that are in both collections. The type
     * of this collection is maintained.
     * - `onlyLeft`: A collection with the edges that are only in this collection. The
     * type of this collection is maintained.
     * - `onlyRight`: A collection with the edges that are only in the other collection.
     * The type of the other collection is maintained.
     */
    compareDiff<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        E2 extends BaseEdge.Class<D2, S2>,
    >(
        other: EdgeCollection<D2, S2, E2>,
    ): {
        both: EdgeCollection<D, S, E>;
        onlyLeft: EdgeCollection<D, S, E>;
        onlyRight: EdgeCollection<D2, S2, E2>;
    } {
        const diff = this.toCy().diff(other.toCy());
        // Appears as deprecated because it is for internal use only
        return {
            both: new EdgeCollection(this.graph, this.#edgeClass, diff.both),
            onlyLeft: new EdgeCollection(this.graph, this.#edgeClass, diff.left),
            onlyRight: new EdgeCollection(this.graph, other.#edgeClass, diff.right),
        };
    }

    /**
     * Returns a collection with the elements sorted according to the
     * given comparison function.
     *
     * Regarding the return value of the comparison function:
     * - A negative value indicates that a should come before b.
     * - A positive value indicates that a should come after b.
     * - Zero or NaN indicates that a and b are considered equal.
     *
     * @param f The comparison function to use for sorting.
     * @returns A new collection with the elements sorted.
     */
    sort(f: (a: E, b: E) => number): EdgeCollection<D, S, E> {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            this.#edgeClass,
            this.#edges.sort((a, b) =>
                f(new this.#edgeClass(this.graph, a), new this.#edgeClass(this.graph, b)),
            ),
        );
    }

    /**
     * Returns whether any edge in the collection satisfies the provided function.
     * Returns false for an empty collection.
     *
     * @param f The function to test each edge. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns Whether any edge in the collection satisfies the function.
     */
    some(f: (ele: E, i: number, eles: this) => boolean): boolean;
    some<T>(f: (this: T, ele: E, i: number, eles: this) => boolean, thisArg: T): boolean;
    some<T>(f: (ele: E, i: number, eles: this) => boolean, thisArg?: T): boolean {
        for (let i = 0; i < this.length; i++) {
            let result;
            if (thisArg === undefined) {
                result = f(this.at(i)!, i, this);
            } else {
                result = f.call(thisArg, this.at(i)!, i, this);
            }
            if (result) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns whether all edges in the collection satisfy the provided function.
     * Returns true for an empty collection.
     *
     * @param f The function to test each edge. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns Whether all edges in the collection satisfy the function.
     */
    every(f: (ele: E, i: number, eles: this) => boolean): boolean;
    every<T>(f: (this: T, ele: E, i: number, eles: this) => boolean, thisArg: T): boolean;
    every<T>(f: (ele: E, i: number, eles: this) => boolean, thisArg?: T): boolean {
        for (let i = 0; i < this.length; i++) {
            let result;
            if (thisArg === undefined) {
                result = f(this.at(i)!, i, this);
            } else {
                result = f.call(thisArg, this.at(i)!, i, this);
            }
            if (!result) {
                return false;
            }
        }
        return true;
    }

    /**
     * Executes the provided function once for each edge in the collection.
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
     * @param f The function to execute for each edge. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     */
    forEach(f: (ele: E, i: number, eles: this) => void): void;
    forEach<T>(f: (this: T, ele: E, i: number, eles: this) => void, thisArg: T): void;
    forEach<T>(f: (ele: E, i: number, eles: this) => void, thisArg?: T) {
        for (let i = 0; i < this.length; i++) {
            if (thisArg === undefined) {
                f(this.at(i)!, i, this);
            } else {
                f.call(thisArg, this.at(i)!, i, this);
            }
        }
    }

    /**
     * Returns a new collection containing only the edges that satisfy the
     * provided function.
     *
     * @param f The function to test each edge. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns A new collection containing only the edges that satisfy the function.
     */
    filter(f: (ele: E, i: number, eles: this) => boolean): EdgeCollection<D, S, E>;
    filter<T>(
        f: (this: T, ele: E, i: number, eles: this) => boolean,
        thisArg: T,
    ): EdgeCollection<D, S, E>;
    filter<T>(
        f: (ele: E, i: number, eles: this) => boolean,
        thisArg?: T,
    ): EdgeCollection<D, S, E> {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            this.#edgeClass,
            this.#edges.filter((_, i) => {
                if (thisArg === undefined) {
                    return f(this.at(i)!, i, this);
                } else {
                    return f.call(thisArg, this.at(i)!, i, this);
                }
            }),
        );
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
        f: (ele: E, i: number, eles: this) => number,
    ): { element: E; value: number } | undefined;
    min<T>(
        f: (this: T, ele: E, i: number, eles: this) => number,
        thisArg: T,
    ): { element: E; value: number } | undefined;
    min<T>(
        f: (ele: E, i: number, eles: this) => number,
        thisArg?: T,
    ): { element: E; value: number } | undefined {
        if (this.isEmpty) {
            return undefined;
        }

        const m = this.#edges.min((ele, i) => {
            if (thisArg === undefined) {
                return f(this.at(i)!, i, this);
            } else {
                return f.call(thisArg, new this.#edgeClass(this.graph, ele), i, this);
            }
        });
        return {
            element: new this.#edgeClass(this.graph, m.ele),
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
        f: (ele: E, i: number, eles: this) => number,
    ): { element: E; value: number } | undefined;
    max<T>(
        f: (this: T, ele: E, i: number, eles: this) => number,
        thisArg: T,
    ): { element: E; value: number } | undefined;
    max<T>(
        f: (ele: E, i: number, eles: this) => number,
        thisArg?: T,
    ): { element: E; value: number } | undefined {
        if (this.isEmpty) {
            return undefined;
        }
        const m = this.#edges.max((ele, i) => {
            if (thisArg === undefined) {
                return f(this.at(i)!, i, this);
            } else {
                return f.call(thisArg, new this.#edgeClass(this.graph, ele), i, this);
            }
        });
        return {
            element: new this.#edgeClass(this.graph, m.ele),
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
    slice(start?: number, end?: number): EdgeCollection<D, S, E> {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            this.#edgeClass,
            this.#edges.slice(start, end),
        );
    }

    /**
     * Makes this class behave like an iterable object.
     */
    *[Symbol.iterator](): Iterator<E, void> {
        for (const n of this.#edges) {
            yield new this.#edgeClass(this.#graph, n);
        }
    }

    /**
     * @returns This collection as an array of edges.
     */
    toArray(): E[] {
        return this.#edges.map((node) => new this.#edgeClass(this.#graph, node));
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
    toCy(): cytoscape.EdgeCollection {
        return this.#edges;
    }
}
