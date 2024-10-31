import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";
import Graph from "@specs-feup/lara-flow/graph/Graph";
import Node from "@specs-feup/lara-flow/graph/Node";
import BaseGraph from "@specs-feup/lara-flow/graph/BaseGraph";
import BaseEdge from "@specs-feup/lara-flow/graph/BaseEdge";
import LaraFlowError from "@specs-feup/lara-flow/error/LaraFlowError";
import BreadthFirstSearch from "@specs-feup/lara-flow/graph/search/BreadthFirstSearch";
import DepthFirstSearch from "@specs-feup/lara-flow/graph/search/DepthFirstSearch";
import { NodeCollection } from "@specs-feup/lara-flow/graph/NodeCollection";
import { EdgeCollection } from "@specs-feup/lara-flow/graph/EdgeCollection";

/**
 * The base {@link Node | node type}. All node types must be subtypes of this type.
 */
namespace BaseNode {
    /**
     * The class with functionality for the base node type.
     */
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        /**
         * The graph that this node is a part of.
         */
        #graph: BaseGraph.Class;
        /**
         * Underlying cytoscape node object.
         */
        #node: cytoscape.NodeSingular;

        /**
         * This constructor is for internal use only. Use {@link BaseGraph.Class.addNode} to create a new node instead.
         *
         * It is not possible to make the constructor private or protected as it is used
         * in other parts of this framework outside of this class (for instance,
         * {@link Node.Class}). However, it should not be used directly by user code.
         *
         * @param graph The graph that this node is a part of.
         * @param node The underlying cytoscape node object.
         * @param _d A hack to force typescript to typecheck D in {@link BaseNode.Class.as} method.
         * @param _sd A hack to force typescript to typecheck S in {@link BaseNode.Class.as} method.
         * @deprecated @hideconstructor
         */
        constructor(
            graph: BaseGraph.Class,
            node: cytoscape.NodeSingular,
            _d: D = {} as any,
            _sd: S = {} as any,
        ) {
            this.#graph = graph;
            this.#node = node;
        }

        /**
         * Use the data object for JSON serializable data.
         * For temporary or non-serializable data, use {@link BaseNode.Class.scratchData}.
         *
         * @returns the data object associated with this node.
         */
        get data(): D {
            return this.#node.data();
        }

        /**
         * Use the scratch data object for temporary or non-serializable data.
         * For JSON serializable data, use {@link BaseEdge.Class.data}.
         *
         * The scratch data is stored under the {@link Graph.scratchNamespace | @specs-feup/lara-flow namespace}.
         *
         * @returns the scratch data object associated with this node.
         */
        get scratchData(): S {
            if (this.#node.scratch(Graph.scratchNamespace) === undefined) {
                this.#node.scratch(Graph.scratchNamespace, {});
            }
            return this.#node.scratch(Graph.scratchNamespace);
        }

        /**
         * @returns the unique identifier of this node.
         */
        get id(): string {
            return this.#node.id();
        }

        /**
         * @returns the parent node of this node.
         */
        get parent(): BaseNode.Class | undefined {
            const p = this.#node.parent();
            if (p.empty()) {
                return undefined;
            }
            // Appears as deprecated because it is for internal use only
            return new BaseNode.Class(this.#graph, p.first());
        }

        /**
         * Changes the parent node of this node.
         *
         * @param node The new parent node. If undefined, the node becomes orphan.
         */
        set parent(node: BaseNode.Class | undefined) {
            this.#node.move({ parent: node === undefined ? null : node.id });
        }

        /**
         * @returns The ancestors (parents, parents' parents, etc.) of this node.
         */
        get ancestors(): NodeCollection {
            // Appears as deprecated because it is for internal use only
            return new NodeCollection(
                this.#graph,
                BaseNode.Class,
                this.#node.ancestors(),
            );
        }

        /**
         * @return The children of this node.
         */
        get children(): NodeCollection {
            return new NodeCollection(this.#graph, BaseNode.Class, this.#node.children());
        }

        /**
         * @returns The descendants (children, children's children, etc.) of this node.
         */
        get descendants(): NodeCollection {
            // Appears as deprecated because it is for internal use only
            return new NodeCollection(
                this.#graph,
                BaseNode.Class,
                this.#node.descendants(),
            );
        }

        /**
         * @returns whether this node is a parent node.
         */
        get isParent(): boolean {
            return this.#node.isParent();
        }

        /**
         * @returns whether this node is a child node.
         */
        get isChild(): boolean {
            return this.#node.isChild();
        }

        /**
         * Initializes the node with the information of a builder. This is effectively
         * extends the type of the node to include the data and scratch data of the builder.
         *
         * The same node may simultaneously be of multiple types, as long as the data and
         * scratch data are compatible with the types. The builder methods may overwrite
         * data and scratch data fields with names that collide with its type's fields.
         *
         * @param builder The builder to use to initialize the node.
         * @returns The same node, with the data and scratch data of the builder.
         * The node is downcasted to {@link BaseNode.Class} because the builder may
         * overwrite the data and scratch data fields, invalidating the current type.
         */
        init<D2 extends BaseNode.Data, S2 extends BaseNode.ScratchData>(
            builder: Node.Builder<D2, S2, D, S>,
        ): BaseNode.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#node.data(initedData);
            this.#node.scratch(Graph.scratchNamespace, initedScratchData);
            // Appears as deprecated because it is for internal use only
            return new BaseNode.Class(
                this.#graph,
                this.#node,
                initedData,
                initedScratchData,
            );
        }

        /**
         * Checks if this node's data and scratch data are compatible
         * with a specific type. This is effectively a type guard function.
         *
         * @param NodeType The node type to check compatibility with.
         * @returns Whether the node is compatible with the given type.
         */
        is<
            D2 extends BaseNode.Data,
            S2 extends BaseNode.ScratchData,
            N2 extends BaseNode.Class<D2, S2>,
        >(NodeType: Node<D2, S2, N2>): this is BaseNode.Class<D2, S2> {
            const data = this.data;
            const scratchData = this.scratchData;
            const result =
                NodeType.TypeGuard.isDataCompatible(data) &&
                NodeType.TypeGuard.isScratchDataCompatible(scratchData);

            // Have typescript statically check that the types are correct
            // in the implementation of this function.
            result && (data satisfies D2) && (scratchData satisfies S2);

            return result;
        }

        /**
         * Changes the functionality class of the current node. This is only
         * possible if the data and scratch data are compatible with the new class.
         * To assert that, use {@link BaseNode.Class.is}.
         *
         * @param NodeType The node type to change the functionality class into.
         * @returns The same node, wrapped in the new functionality class.
         */
        as<N2 extends BaseNode.Class<D, S>>(NodeType: {
            Class: Node.Class<D, S, N2>;
        }): N2 {
            // The following signature does not work
            // as<N extends BaseNode.Class<D, S>>(NodeType: Node<D, S, N>): N {
            return new NodeType.Class(
                this.#graph,
                this.#node,
                this.data,
                this.scratchData,
            );
        }

        /**
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
         * @throws {} {@link LaraFlowError} if the node is not compatible with the type.
         * This error should be seen as a logic error and not catched.
         */
        expect<
            D2 extends BaseNode.Data,
            S2 extends BaseNode.ScratchData,
            N2 extends BaseNode.Class<D2, S2>,
        >(NodeType: Node<D2, S2, N2>, message?: string): N2 {
            if (!this.is(NodeType)) {
                if (message === undefined) {
                    message = "Graph type mismatch";
                }
                throw new LaraFlowError(message);
            }

            return this.as(NodeType);
        }

        /**
         * Tries to change the functionality class of the current node. If the node
         * is not compatible with the new class, undefined is returned.
         *
         * @example
         * ```typescript
         * if (node === undefined || !node.is(ControlFlowNode)) {
         *     return undefined;
         * }
         * return node.as(ControlFlowNode);
         * ```
         *
         * Can be simplified to:
         * ```typescript
         * return node?.tryAs(ControlFlowNode);
         * ```
         *
         * @param NodeType The node type to change the functionality class into.
         * @returns The node, wrapped in the new functionality class, or undefined if
         * the node is not compatible with the type.
         */
        tryAs<
            D2 extends BaseNode.Data,
            S2 extends BaseNode.ScratchData,
            N2 extends BaseNode.Class<D2, S2>,
        >(NodeType: Node<D2, S2, N2>): N2 | undefined {
            if (!this.is(NodeType)) {
                return undefined;
            }
            return this.as(NodeType);
        }

        /**
         *  Checks if the type of the node is compatible with several
         *  types, calling a callback for the first match. See
         *  {@link Node.Case} for the syntax of each case.
         *
         *  For a default case, match with {@link BaseNode},
         *  which will always be compatible with any node type.
         *
         *  @param cases The cases to match against.
         */
        switch(...cases: ReturnType<typeof Node.Case>[]) {
            for (const { NodeType, callback } of cases) {
                if (this.is(NodeType)) {
                    callback(this.as(NodeType));
                    return;
                }
            }
        }

        /**
         * Returns the number of edges connected to this node.
         * Loop edges are counted twice.
         *
         * @returns the degree of this node.
         */
        get degree(): number {
            return this.#node.degree(true);
        }

        /**
         * Returns the number of edges connected to this node.
         * Loop edges are not counted.
         *
         * @returns the degree of this node, excluding loop edges.
         */
        get degreeWithoutLoops(): number {
            return this.#node.degree(false);
        }

        /**
         * Returns the number of edges that are directed towards this node.
         *
         * @returns the indegree of this node.
         */
        get indegree(): number {
            return this.#node.indegree(true);
        }

        /**
         * Returns the number of edges that are directed towards this node.
         * Loop edges are not counted.
         *
         * @returns the indegree of this node, excluding loop edges.
         */
        get indegreeWithoutLoops(): number {
            return this.#node.indegree(false);
        }

        /**
         * Returns the number of edges that are directed away from this node.
         *
         * @returns the outdegree of this node.
         */
        get outdegree(): number {
            return this.#node.outdegree(true);
        }

        /**
         * Returns the number of edges that are directed away from this node.
         * Loop edges are not counted.
         *
         * @returns the outdegree of this node, excluding loop edges.
         */
        get outdegreeWithoutLoops(): number {
            return this.#node.outdegree(false);
        }

        /**
         * @returns The edges that connect to this node.
         */
        get incomers(): EdgeCollection {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                BaseEdge.Class,
                this.#node.incomers().edges(),
            );
        }

        /**
         * @returns The predecessors of this node.
         * This repeatedly follows the sources of incoming edges.
         */
        get predecessors(): NodeCollection {
            // Appears as deprecated because it is for internal use only
            return new NodeCollection(
                this.#graph,
                BaseNode.Class,
                this.#node.predecessors().nodes(),
            );
        }

        /**
         * @returns The edges that connect from this node.
         */
        get outgoers(): EdgeCollection {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                BaseEdge.Class,
                this.#node.outgoers().edges(),
            );
        }

        /**
         * @returns The successors of this node.
         * This repeatedly follows the targets of outgoing edges.
         */
        get successors(): NodeCollection {
            // Appears as deprecated because it is for internal use only
            return new NodeCollection(
                this.#graph,
                BaseNode.Class,
                this.#node.successors().nodes(),
            );
        }

        /**
         * @returns The edges that are adjacent to this node.
         */
        get adjacentEdges(): EdgeCollection {
            return this.incomers.union(this.outgoers);
        }

        /**
         * @returns The nodes that are adjacent to this node.
         */
        get adjacentNodes(): NodeCollection {
            return this.incomers.sources.union(this.outgoers.targets);
        }

        /**
         * Retrieves the edges that connect this node with the given nodes.
         * Direction is not considered.
         *
         * @param nodes The node or collection of nodes to check for edges connected
         * with this node.
         * @returns The edges that connect this node with the given nodes.
         */
        edgesWith(nodes: NodeCollection | BaseNode.Class): EdgeCollection {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                BaseEdge.Class,
                this.#node.edgesWith(nodes.toCy()),
            );
        }

        /**
         * Retrieves the edges from this node to the given nodes.
         *
         * @param nodes The node or collection of nodes to check for edges connected
         * with this node.
         * @returns The edges from this node to the given nodes.
         */
        edgesTo(nodes: NodeCollection | BaseNode.Class): EdgeCollection {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                BaseEdge.Class,
                this.#node.edgesTo(nodes.toCy()),
            );
        }

        /**
         * Retrieves the edges from the given nodes to this node.
         *
         * @param nodes The node or collection of nodes to check for edges connected
         * with this node.
         * @returns The edges from the given nodes to this node.
         */
        edgesFrom(nodes: NodeCollection | BaseNode.Class): EdgeCollection {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                BaseEdge.Class,
                nodes.toCy().edgesTo(this.#node),
            );
        }

        // /**
        //  * Searches the graph starting from this node.
        //  *
        //  * Example:
        //  *
        //  * ```typescript
        //  * for (const {node, path, index} of node.search(new BreadthFirstSearch())) {
        //  *     // Your code here
        //  * }
        //  * ```
        //  *
        //  * @param algorithm The search algorithm to use.
        //  * @returns A generator that yields each visit, so that it can be lazily iterated over.
        //  */
        search<V extends Node.SearchVisit>(
            algorithm: Node.Search<V, this>,
        ): Generator<V> {
            return algorithm.search(this);
        }

        // /**
        //  * Depth-first search starting from this node.
        //  * Shorthand for `this.search(new DepthFirstSearch(...))`.
        //  *
        //  * Example:
        //  *
        //  * ```typescript
        //  * for (const {node, path, index} of node.dfs()) {
        //  *     // Your code here
        //  * }
        //  * ```
        //  *
        //  * @param propagate A function that determines whether to propagate through an edge.
        //  * @returns A generator that yields each visit, so that it can be lazily iterated over.
        //  */
        dfs(propagate?: (edge: BaseEdge.Class) => boolean): Generator<Node.SearchVisit> {
            return this.search(new DepthFirstSearch(propagate));
        }

        // /**
        //  * Breadth-first search starting from this node.
        //  * Shorthand for `this.search(new BreadthFirstSearch(...))`.
        //  *
        //  * Example:
        //  *
        //  * ```typescript
        //  * for (const {node, path, index} of node.bfs()) {
        //  *     // Your code here
        //  * }
        //  * ```
        //  *
        //  * @param propagate A function that determines whether to propagate through an edge.
        //  * @returns A generator that yields each visit, so that it can be lazily iterated over.
        //  */
        bfs(propagate?: (edge: BaseEdge.Class) => boolean): Generator<Node.SearchVisit> {
            return this.search(new BreadthFirstSearch(propagate));
        }

        /**
         * Removes this node from the graph.
         */
        remove() {
            this.#node.remove();
        }

        /**
         * @returns whether this node has been removed from the graph.
         */
        get isRemoved(): boolean {
            return this.#node.removed();
        }

        /**
         * Restores this node if it has been removed. See {@link BaseNode.Class.remove}.
         */
        restore() {
            this.#node.restore();
        }

        /**
         * @returns A collection containing only this node.
         */
        toCollection(): NodeCollection<D, S, this> {
            // Appears as deprecated because it is for internal use only
            return new NodeCollection(
                this.#graph,
                Object.getPrototypeOf(this).constructor,
                this.#node,
            );
        }

        /**
         * @returns the graph that this node is a part of.
         */
        get graph(): BaseGraph.Class {
            return this.#graph;
        }

        /**
         * @returns the underlying cytoscape node object.
         */
        toCy(): cytoscape.NodeSingular {
            return this.#node;
        }
    }

    /**
     * Type guards for {@link BaseNode}. Since this is the base class, data and scratch
     * are always assumed to be compatible.
     */
    export const TypeGuard: Node.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is ScratchData {
            return true;
        },
    };

    /**
     * Data contained in this node type.
     */
    export interface Data {
        /**
         * The unique identifier of this node.
         */
        id: string;
        /**
         * The parent node of this node, if any.
         */
        parent?: string;
    }

    /**
     * Scratch data contained in this node type.
     */
    export interface ScratchData {}
}

export default BaseNode;
