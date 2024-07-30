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
     * @param _d A hack to force typescript to typecheck D in {@link BaseNode.Class.as} method.
     * @param _sd A hack to force typescript to typecheck S in {@link BaseNode.Class.as} method.
     * @deprecated
     */
    constructor(
        graph: BaseGraph.Class,
        nodeClass: Node.Class<D, S, N>,
        nodes: cytoscape.NodeCollection,
        _d: D = {} as any,
        _sd: S = {} as any,
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
     * 
     * @todo
     * @deprecated
     * Checks if this node's data and scratch data are compatible
     * with a specific type. This is effectively a type guard function.
     *
     * @param NodeType The node type to check compatibility with.
     * @returns Whether the node is compatible with the given type.
     */
    allAre<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(NodeType: Node<D2, S2, N2>): this is NodeCollection<D2, S2, BaseNode.Class<D2, S2>> {
        return false;
        // const data = this.data;
        // const scratchData = this.scratchData;
        // const result =
        //     NodeType.TypeGuard.isDataCompatible(data) &&
        //     NodeType.TypeGuard.isScratchDataCompatible(scratchData);

        // // Have typescript statically check that the types are correct
        // // in the implementation of this function.
        // result && (data satisfies D2) && (scratchData satisfies S2);

        // return result;
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
     * @todo
     * @deprecated
     * Changes the functionality class of the current node. Should only be used
     * when it is known (but not statically provable) that the node is compatible
     * with the new class. If not, an error will be thrown.
     *
     * It is bad practice to try and catch the error thrown by this function. For
     * such cases, combine {@link BaseNode.Class.is} with {@link BaseNode.Class.as},
     * or use {@link BaseNode.Class.switch} instead.
     *
     * @param NodeType The node type to change the functionality class into.
     * @param message The message to throw if the node is not compatible with the type.
     * @returns The node, wrapped in the new functionality class.
     * @throws LaraFlowError if the node is not compatible with the type.
     * This error should be seen as a logic error and not catched.
     */
    expectAll<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        N2 extends BaseNode.Class<D2, S2>,
    >(NodeType: Node<D2, S2, N2>, message?: string): NodeCollection<D2, S2, N2> {
        if (!this.allAre(NodeType)) {
            if (message === undefined) {
                message = "Graph type mismatch"; // @todo put the index
            }
            throw new LaraFlowError(message);
        }

        return this.allAs(NodeType);
    }

    /**
     * @todo
     * @deprecated
     */
    forEach() {
        // https://js.cytoscape.org/#eles.forEach
        //     eles.forEach( function(ele, i, eles) [, thisArg] )
        //          function(ele, i, eles) The function executed each iteration.
        //          ele The current element.
        //          i The index of the current element.
        //          eles The collection of elements being iterated.
        //          thisArg [optional] The value for this within the iterating function
        // forEach(each: (ele: TIn, i: number, eles: this) => void | boolean, thisArg?: any): this;
        // return this.#nodes.forEach(each);
        //         This function behaves like Array.prototype.forEach() with minor changes for convenience:
        // You can exit the iteration early by returning false in the iterating function. The Array.prototype.forEach() implementation does not support this, but it is included anyway on account of its utility.
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

    // is()
    // map(), filter(), forEach()~
    // union(), difference(), intersection(), ...
    // [_node_ .total|min|maxdegree() et al https://js.cytoscape.org/#node.degree] degree()-like
    // something like map-flat
    // search()?
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
    //     cy.filter( _selector_ ); cy.filter( _function(ele, i, eles)_ );
    //          Probably also applies to Graph
    // - cytoscape dijkstra search (involves passing a collection of nodes) (maybe has a method to return the last result)
}
