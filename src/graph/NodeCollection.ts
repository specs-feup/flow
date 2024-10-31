import LaraFlowError from "@specs-feup/lara-flow/error/LaraFlowError";
import BaseEdge from "@specs-feup/lara-flow/graph/BaseEdge";
import BaseGraph from "@specs-feup/lara-flow/graph/BaseGraph";
import BaseNode from "@specs-feup/lara-flow/graph/BaseNode";
import { EdgeCollection } from "@specs-feup/lara-flow/graph/EdgeCollection";
import Graph from "@specs-feup/lara-flow/graph/Graph";
import Node from "@specs-feup/lara-flow/graph/Node";
import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";

/**
 * A collection of nodes from a given graph. All nodes have a common
 * node type. If the nodes can be of any node type, the common type
 * is {@link BaseNode}.
 */
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
     *
     * Note: Node.Class is not being used as the type to avoid
     * invariance problems.
     */
    #nodeClass: new (graph: BaseGraph.Class, node: cytoscape.NodeSingular) => N;
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
     * @deprecated @hideconstructor
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
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
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
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    return prop in nodes;
                }
                return prop in target;
            },
            deleteProperty(target, prop): boolean {
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    delete nodes[prop as any];
                    return true;
                }
                delete target[prop as any];
                return true;
            },
            set(target, prop, newValue): boolean {
                if (typeof prop === "string" && Number(prop) == (prop as any)) {
                    nodes[prop as any] = newValue;
                    return true;
                }
                target[prop as any] = newValue;
                return true;
            },
        });
    }

    /**
     * Creates a new collection from the given nodes.
     * At least one node must be provided. For an empty collection, use
     * {@link BaseGraph.Class.emptyCollection}.
     *
     * @param first The first node in the collection.
     * @param elements The rest of the nodes in the collection.
     * @returns A new collection containing the given nodes.
     */
    static from<
        D extends BaseNode.Data,
        S extends BaseNode.ScratchData,
        N extends BaseNode.Class<D, S>,
    >(first: N, ...elements: N[]): NodeCollection<D, S, N> {
        for (const element of elements) {
            if (element.graph.toCy() !== first.graph.toCy()) {
                throw new LaraFlowError(
                    "Cannot create collection with nodes from different graphs",
                );
            }
        }

        const collection = first.graph.toCy().collection();
        collection.merge(first.toCy());
        for (const element of elements) {
            collection.merge(element.toCy());
        }

        // Appears as deprecated because it is for internal use only
        return new NodeCollection(first.graph, first.constructor as any, collection);
    }

    /**
     * Creates a new collection from the given cytoscape collection.
     *
     * @param nodes The cytoscape collection to create the collection from.
     * @returns A new collection containing the nodes from the cytoscape collection.
     */
    static fromCy(nodes: cytoscape.NodeCollection): NodeCollection {
        if (nodes.length === 0) {
            throw new LaraFlowError(
                "Cannot create collection from empty cytoscape collection",
            );
        }
        const first = nodes[0];
        for (let i = 1; i < nodes.length; i++) {
            if (nodes[i].cy() !== first.cy()) {
                throw new LaraFlowError(
                    "Cannot create collection with nodes from different graphs",
                );
            }
        }
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(Graph.fromCy(first.cy()), BaseNode.Class, nodes);
    }

    /**
     * Access the node at the given index.
     *
     * @privateRemarks
     * Indexing cannot be implemented directly in the class,
     * so it is implemented by proxy. Since this
     * indexing is implemented in the proxy and not in the class,
     * internal method implementations may not use it. Instead,
     * they should use the {@link NodeCollection.at} method.
     */
    [index: number]: N;

    /**
     * Access the node at the given index.
     * This is similar to indexing, but has
     * undefined in the return type.
     *
     * @param index The index of the node to access.
     * @returns The node at the given index, or undefined if it does not exist.
     */
    at(index: number): N | undefined {
        const value = this.#nodes[index];
        if (value === undefined) {
            return undefined;
        }
        return new this.#nodeClass(this.graph, value);
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
     * @returns The node with the given id, or undefined if it is not
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
     * @returns The parents of the nodes in this collection.
     */
    get parents(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, BaseNode.Class, this.#nodes.parents());
    }

    /**
     * @returns The ancestors (parents, parents' parents, etc.) of the nodes
     * in this collection.
     */
    get ancestors(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, BaseNode.Class, this.#nodes.ancestors());
    }

    /**
     * @returns The children of the nodes in this collection.
     */
    get children(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, BaseNode.Class, this.#nodes.children());
    }

    /**
     * @returns The descendants (children, children's children, etc.) of the nodes
     * in this collection.
     */
    get descendants(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(this.#graph, BaseNode.Class, this.#nodes.descendants());
    }

    /**
     * @returns The edges coming into the nodes in this collection.
     */
    get incomers(): EdgeCollection {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            BaseEdge.Class,
            this.#nodes.incomers().edges(),
        );
    }

    /**
     * @returns The predecessors of the nodes in this collection.
     * This repeatedly follows the sources of incoming edges.
     */
    get predecessors(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            BaseNode.Class,
            this.#nodes.predecessors().nodes(),
        );
    }

    /**
     * @returns The edges coming out of the nodes in this collection.
     */
    get outgoers(): EdgeCollection {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            BaseEdge.Class,
            this.#nodes.outgoers().edges(),
        );
    }

    /**
     * @returns The successors of the nodes in this collection.
     * This repeatedly follows the targets of outgoing edges.
     */
    get successors(): NodeCollection {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            BaseNode.Class,
            this.#nodes.successors().nodes(),
        );
    }

    /**
     * @returns The edges that are adjacent to a node in this collection.
     */
    get adjacentEdges(): EdgeCollection {
        return this.incomers.union(this.outgoers);
    }

    /**
     * @returns The nodes that are adjacent to a node in this collection.
     */
    get adjacentNodes(): NodeCollection {
        return this.incomers.sources.union(this.outgoers.targets);
    }

    /**
     * Retrieves the edges that connect this collection with the given nodes.
     * Direction is not considered.
     *
     * @param nodes The node or collection of nodes to check for edges connected
     * with this collection.
     * @returns The edges that connect this collection with the given nodes.
     */
    edgesWith(nodes: NodeCollection | BaseNode.Class): EdgeCollection {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            BaseEdge.Class,
            this.#nodes.edgesWith(nodes.toCy()),
        );
    }

    /**
     * Retrieves the edges from this collection to the given nodes.
     *
     * @param nodes The node or collection of nodes to check for edges connected
     * with this collection.
     * @returns The edges from this collection to the given nodes.
     */
    edgesTo(nodes: NodeCollection | BaseNode.Class): EdgeCollection {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            BaseEdge.Class,
            this.#nodes.edgesTo(nodes.toCy()),
        );
    }

    /**
     * Retrieves the edges from the given nodes to this collection.
     *
     * @param nodes The node or collection of nodes to check for edges connected
     * with this collection.
     * @returns The edges from the given nodes to this collection.
     */
    edgesFrom(nodes: NodeCollection | BaseNode.Class): EdgeCollection {
        // Appears as deprecated because it is for internal use only
        return new EdgeCollection(
            this.#graph,
            BaseEdge.Class,
            nodes.toCy().edgesTo(this.#nodes),
        );
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
            if (!this.at(i)!.is(NodeType)) {
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
     * @throws {} {@link LaraFlowError} if any node is not compatible with the type.
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
            if (!this.at(i)!.is(NodeType)) {
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
     * Returns whether the elements in the collection are the same as
     * the elements in the other collection.
     *
     * @param other The other collection to compare with.
     * @returns Whether the elements in the collection are the same as the elements in the other collection.
     */
    same<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(other: NodeCollection<D2, S2, N2>): boolean {
        return this.#nodes.same(other.toCy());
    }

    /**
     * Returns whether the collection contains the given node or collection.
     *
     * @param elements The node or collection to check for.
     * @returns Whether the collection contains the given node or collection.
     */
    contains<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(elements: NodeCollection<D2, S2, N2> | N2): boolean {
        return this.#nodes.contains(elements.toCy());
    }

    /**
     * Returns whether the collection contains any of the nodes in the given collection.
     *
     * @param elements The collection to check for.
     * @returns Whether the collection contains any of the nodes in the given collection.
     */
    containsAny<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(elements: NodeCollection<D2, S2, N2>): boolean {
        return this.#nodes.anySame(elements.toCy());
    }

    /**
     * Returns the union of this collection with another collection.
     * You may chain this method to union multiple collections.
     *
     * If the rhs collection is a subtype of the lhs collection, the resulting
     * collection will have the lhs type.
     *
     * @param other The other collection to union with.
     * @returns A new collection containing the union of all nodes.
     * @throws {} {@link LaraFlowError} if the other collection is from a different graph.
     */
    union<D2 extends D, S2 extends S>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D, S, N>;
    /**
     * Returns the union of this collection with another collection.
     * You may chain this method to union multiple collections.
     *
     * If the rhs collection is not a subtype of the lhs collection, the resulting
     * collection will be downgraded to a {@link BaseNode} and must be casted to the
     * desired type explicitly with {@link NodeCollection.allAs}.
     *
     * @param other The other collection to union with.
     * @returns A new collection containing the union of all nodes.
     * @throws {} {@link LaraFlowError} if the other collection is from a different graph.
     */
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
     * @param other The other collection to intersect with.
     * @returns A new collection containing the intersection of all nodes.
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
     * @returns The complement of this collection with respect to the universe
     * of all nodes in the graph.
     */
    complement(): NodeCollection {
        return this.graph.nodes.difference(this);
    }

    /**
     * Returns the set difference of this collection with another collection.
     * You may chain this method to remove multiple collections.
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
     * Returns the symmetric difference of this collection with another collection.
     * This collection consists of the nodes that are in either collection, but not
     * in both.
     *
     * If the rhs collection is a subtype of the lhs collection, the resulting
     * collection will have the lhs type.
     *
     * @param other The other collection to apply the symmetric difference with.
     * @returns A new collection containing the symmetric difference of the two
     * collections.
     * @throws {} {@link LaraFlowError} if the other collection is from a different graph.
     */
    symmetricDifference<D2 extends D, S2 extends S>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D, S, N>;
    /**
     * Returns the symmetric difference of this collection with another collection.
     * This collection consists of the nodes that are in either collection, but not
     * in both.
     *
     * If the rhs collection is not a subtype of the lhs collection, the resulting
     * collection will be downgraded to a {@link BaseNode} and must be casted to the
     * desired type explicitly with {@link NodeCollection.allAs}.
     *
     * @param other The other collection to apply the symmetric difference with.
     * @returns A new collection containing the symmetric difference of the two
     * collections.
     * @throws {} {@link LaraFlowError} if the other collection is from a different graph.
     */
    symmetricDifference<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<D | D2, S | S2, BaseNode.Class<D | D2, S | S2>>;
    symmetricDifference<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
        other: NodeCollection<D2, S2, BaseNode.Class<D2, S2>>,
    ): NodeCollection<any, any, any> {
        if (other.graph.toCy() !== this.graph.toCy()) {
            throw new LaraFlowError("Cannot union nodes from different graphs");
        }

        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.graph,
            this.#nodeClass,
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
     * - `both`: A collection with the nodes that are in both collections. The type
     * of this collection is maintained.
     * - `onlyLeft`: A collection with the nodes that are only in this collection. The
     * type of this collection is maintained.
     * - `onlyRight`: A collection with the nodes that are only in the other collection.
     * The type of the other collection is maintained.
     */
    compareDiff<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(
        other: NodeCollection<D2, S2, N2>,
    ): {
        both: NodeCollection<D, S, N>;
        onlyLeft: NodeCollection<D, S, N>;
        onlyRight: NodeCollection<D2, S2, N2>;
    } {
        const diff = this.toCy().diff(other.toCy());
        // Appears as deprecated because it is for internal use only
        return {
            both: new NodeCollection(this.graph, this.#nodeClass, diff.both),
            onlyLeft: new NodeCollection(this.graph, this.#nodeClass, diff.left),
            onlyRight: new NodeCollection(this.graph, other.#nodeClass, diff.right),
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
     * @returns The common ancestors of all nodes in the collection,
     * starting with the closest and getting progressively farther.
     */
    commonAncestors(): NodeCollection<
        BaseNode.Data,
        BaseNode.ScratchData,
        BaseNode.Class
    > {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            BaseNode.Class,
            this.#nodes.commonAncestors(),
        );
    }

    /**
     * Returns whether any node in the collection satisfies the provided function.
     * Returns false for an empty collection.
     *
     * @param f The function to test each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @returns Whether any node in the collection satisfies the function.
     */
    some(f: (ele: N, i: number, eles: this) => boolean): boolean;
    /**
     * Returns whether any node in the collection satisfies the provided function.
     * Returns false for an empty collection.
     *
     * @param f The function to test each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns Whether any node in the collection satisfies the function.
     */
    some<T>(f: (this: T, ele: N, i: number, eles: this) => boolean, thisArg: T): boolean;
    some<T>(f: (ele: N, i: number, eles: this) => boolean, thisArg?: T): boolean {
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
     * Returns whether all nodes in the collection satisfy the provided function.
     * Returns true for an empty collection.
     *
     * @param f The function to test each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @returns Whether all nodes in the collection satisfy the function.
     */
    every(f: (ele: N, i: number, eles: this) => boolean): boolean;
    /**
     * Returns whether all nodes in the collection satisfy the provided function.
     * Returns true for an empty collection.
     *
     * @param f The function to test each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns Whether all nodes in the collection satisfy the function.
     */
    every<T>(f: (this: T, ele: N, i: number, eles: this) => boolean, thisArg: T): boolean;
    every<T>(f: (ele: N, i: number, eles: this) => boolean, thisArg?: T): boolean {
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
     */
    forEach(f: (ele: N, i: number, eles: this) => void): void;
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
    forEach<T>(f: (this: T, ele: N, i: number, eles: this) => void, thisArg: T): void;
    forEach<T>(f: (ele: N, i: number, eles: this) => void, thisArg?: T) {
        for (let i = 0; i < this.length; i++) {
            if (thisArg === undefined) {
                f(this.at(i)!, i, this);
            } else {
                f.call(thisArg, this.at(i)!, i, this);
            }
        }
    }

    /**
     * Returns a new collection containing only the nodes that satisfy the
     * provided function.
     *
     * @param f The function to test each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @returns A new collection containing only the nodes that satisfy the function.
     */
    filter(f: (ele: N, i: number, eles: this) => boolean): NodeCollection<D, S, N>;
    /**
     * Returns a new collection containing only the nodes that satisfy the
     * provided function.
     *
     * @param f The function to test each node. ele - The current element, i - The
     * index of the current element, eles - The collection of elements being iterated.
     * @param thisArg The value to use as `this` when executing the function.
     * @returns A new collection containing only the nodes that satisfy the function.
     */
    filter<T>(
        f: (this: T, ele: N, i: number, eles: this) => boolean,
        thisArg: T,
    ): NodeCollection<D, S, N>;
    filter<T>(
        f: (ele: N, i: number, eles: this) => boolean,
        thisArg?: T,
    ): NodeCollection<D, S, N> {
        // Appears as deprecated because it is for internal use only
        return new NodeCollection(
            this.#graph,
            this.#nodeClass,
            this.#nodes.filter((_, i) => {
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
     * @returns An object with the minimum element and its value, or undefined if
     * the collection is empty.
     */
    min(
        f: (ele: N, i: number, eles: this) => number,
    ): { element: N; value: number } | undefined;
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
                return f(this.at(i)!, i, this);
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
     * @returns An object with the maximum element and its value, or undefined if
     * the collection is empty.
     */
    max(
        f: (ele: N, i: number, eles: this) => number,
    ): { element: N; value: number } | undefined;
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
                return f(this.at(i)!, i, this);
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
    *[Symbol.iterator](): Iterator<N, void> {
        for (const n of this.#nodes) {
            yield new this.#nodeClass(this.#graph, n);
        }
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
}
