import cytoscape from "@specs-feup/lara/api/libs/cytoscape-3.26.0.js";
import { JavaClasses } from "@specs-feup/lara/api/lara/util/JavaTypes.js";
import Graph from "lara-flow/graph/Graph";
import BaseNode from "lara-flow/graph/BaseNode";
import BaseEdge from "lara-flow/graph/BaseEdge";
import Io from "@specs-feup/lara/api/lara/Io.js";
import LaraFlowError from "lara-flow/error/LaraFlowError";
import Edge from "lara-flow/graph/Edge";
import Node from "lara-flow/graph/Node";
import { NodeCollection } from "lara-flow/graph/NodeCollection";
import { EdgeCollection } from "lara-flow/graph/EdgeCollection";

/**
 * The base {@link Graph | graph type}. All graph types must be subtypes of this type.
 */
namespace BaseGraph {
    /**
     * The class with functionality for the base graph type.
     */
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        /**
         * Underlying cytoscape graph object.
         */
        #graph: cytoscape.Core;

        /**
         * This constructor is for internal use only. Use {@link Graph.create} or
         * {@link Graph.fromCy} to create a new graph instead.
         *
         * It is not possible to make the constructor private or protected as it is used
         * in other parts of this framework outside of this class (for instance,
         * {@link Graph.Class}). However, it should not be used directly by user code.
         *
         * @param graph The underlying cytoscape graph object.
         * @param _d A hack to force typescript to typecheck D in {@link BaseGraph.Class.as} method.
         * @param _sd A hack to force typescript to typecheck S in {@link BaseGraph.Class.as} method.
         * @deprecated @hideconstructor
         */
        constructor(graph: cytoscape.Core, _d: D = {} as any, _sd: S = {} as any) {
            this.#graph = graph;
        }

        /**
         * Use the data object for JSON serializable data.
         * For temporary or non-serializable data, use {@link BaseGraph.Class.scratchData}.
         *
         * @returns the data object associated with this graph.
         */
        get data(): D {
            return this.#graph.data();
        }

        /**
         * Use the scratch data object for temporary or non-serializable data.
         * For JSON serializable data, use {@link BaseGraph.Class.data}.
         *
         * The scratch data is stored under the {@link Graph.scratchNamespace | lara-flow namespace}.
         *
         * @returns the scratch data object associated with this graph.
         */
        get scratchData(): S {
            if (this.#graph.scratch(Graph.scratchNamespace) === undefined) {
                this.#graph.scratch(Graph.scratchNamespace, {});
            }
            return this.#graph.scratch(Graph.scratchNamespace);
        }

        /**
         * Initializes the graph with the information of a builder. This is effectively
         * extends the type of the graph to include the data and scratch data of the builder.
         *
         * The same graph may simultaneously be of multiple types, as long as the data and
         * scratch data are compatible with the types. The builder methods may overwrite
         * data and scratch data fields with names that collide with its type's fields.
         *
         * @param builder The builder to use to initialize the graph.
         * @returns The same graph, with the data and scratch data of the builder.
         * The graph is downcasted to {@link BaseGraph.Class} because the builder may
         * overwrite the data and scratch data fields, invalidating the current type.
         */
        init<D2 extends BaseGraph.Data, S2 extends BaseGraph.ScratchData>(
            builder: Graph.Builder<D2, S2, D, S>,
        ): BaseGraph.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#graph.data(initedData);
            this.#graph.scratch(Graph.scratchNamespace, initedScratchData);
            // Appears as deprecated because it is for internal use only
            return new BaseGraph.Class(this.#graph, initedData, initedScratchData);
        }

        /**
         * Checks if this graph's data and scratch data are compatible
         * with a specific type. This is effectively a type guard function.
         *
         * @param GraphType The graph type to check compatibility with.
         * @returns Whether the graph is compatible with the given type.
         */
        is<
            D2 extends BaseGraph.Data,
            S2 extends BaseGraph.ScratchData,
            G2 extends BaseGraph.Class<D2, S2>,
        >(GraphType: Graph<D2, S2, G2>): this is BaseGraph.Class<D2, S2> {
            const data = this.data;
            const scratchData = this.scratchData;
            const result =
                GraphType.TypeGuard.isDataCompatible(data) &&
                GraphType.TypeGuard.isScratchDataCompatible(scratchData);

            // Have typescript statically check that the types are correct
            // in the implementation of this function.
            result && (data satisfies D2) && (scratchData satisfies S2);

            return result;
        }

        /**
         * Changes the functionality class of the current graph. This is only
         * possible if the data and scratch data are compatible with the new class.
         * To assert that, use {@link BaseGraph.Class.is}.
         *
         * @param GraphType The graph type to change the functionality class into.
         * @returns The same graph, wrapped in the new functionality class.
         */
        as<G extends BaseGraph.Class<D, S>>(GraphType: {
            Class: Graph.Class<D, S, G>;
        }): G {
            // The following signature does not work
            // as<G extends BaseGraph.Class<D, S>>(GraphType: Graph<D, S, G>): G {
            return new GraphType.Class(this.#graph, this.data, this.scratchData);
        }

        /**
         * Changes the functionality class of the current graph. Should only be used
         * when it is known (but not statically provable) that the graph is compatible
         * with the new class. If not, an error will be thrown.
         *
         * It is bad practice to try and catch the error thrown by this function. For
         * such cases, combine {@link BaseGraph.Class.is} with {@link BaseGraph.Class.as},
         * or use {@link BaseGraph.Class.switch} instead.
         *
         * @param GraphType The graph type to change the functionality class into.
         * @param message The message to throw if the graph is not compatible with the type.
         * @returns The graph, wrapped in the new functionality class.
         * @throws {} {@link LaraFlowError} if the graph is not compatible with the type.
         * This error should be seen as a logic error and not catched.
         */
        expect<
            D2 extends BaseGraph.Data,
            S2 extends BaseGraph.ScratchData,
            G2 extends BaseGraph.Class<D2, S2>,
        >(GraphType: Graph<D2, S2, G2>, message?: string): G2 {
            if (!this.is(GraphType)) {
                if (message === undefined) {
                    message = "Graph type mismatch";
                }
                throw new LaraFlowError(message);
            }

            return this.as(GraphType);
        }

        /**
         * Tries to change the functionality class of the current graph. If the graph
         * is not compatible with the new class, undefined is returned.
         *
         * @example
         * ```typescript
         * if (graph === undefined || !graph.is(FlowGraph)) {
         *     return undefined;
         * }
         * return node.as(FlowGraph);
         * ```
         *
         * Can be simplified to:
         * ```typescript
         * return node?.tryAs(FlowGraph);
         * ```
         *
         * @param GraphType The graph type to change the functionality class into.
         * @returns The graph, wrapped in the new functionality class, or undefined if
         * the graph is not compatible with the type.
         */
        tryAs<
            D2 extends BaseGraph.Data,
            S2 extends BaseGraph.ScratchData,
            G2 extends BaseGraph.Class<D2, S2>,
        >(GraphType: Graph<D2, S2, G2>): G2 | undefined {
            if (!this.is(GraphType)) {
                return undefined;
            }
            return this.as(GraphType);
        }

        /**
         * Checks if the type of the graph is compatible with several
         * types, calling a callback for the first match. See
         * {@link Graph.Case} for the syntax of each case.
         *
         * For a default case, match with {@link BaseGraph},
         * which will always be compatible with any graph type.
         *
         * @param cases The cases to match against.
         */
        switch(...cases: ReturnType<typeof Graph.Case>[]) {
            for (const { GraphType, callback } of cases) {
                if (this.is(GraphType)) {
                    callback(this.as(GraphType));
                    return;
                }
            }
        }

        /**
         * Sets the id generator to be used when generating node identifiers.
         * This id generator is only used when creating a node without specifying an id.
         * In other words, if an id is explicitly provided when creating a node, it will
         * have precedence over calling the id generator.
         *
         * When no id generator is set and no id is provided when creating a node, the
         * id generation will be delegated to cytoscape.
         *
         * @param generator The id generator to use, or undefined to delegate to
         * cytoscape's default id generation.
         * @returns itself for chaining.
         */
        setNodeIdGenerator(generator: Node.IdGenerator | undefined): this {
            this.scratchData.nodeIdGenerator = generator;
            return this;
        }

        /**
         * Sets the id generator to be used when generating edge identifiers.
         * This id generator is only used when creating an edge without specifying an id.
         * In other words, if an id is explicitly provided when creating an edge, it will
         * have precedence over calling the id generator.
         *
         * When no id generator is set and no id is provided when creating an edge, the
         * id generation will be delegated to cytoscape.
         *
         * @param generator The id generator to use, or undefined to delegate to
         * cytoscape's default id generation.
         * @returns itself for chaining.
         */
        setEdgeIdGenerator(generator: Edge.IdGenerator | undefined): this {
            this.scratchData.edgeIdGenerator = generator;
            return this;
        }

        /**
         * Adds a new empty node to the graph.
         *
         * @param id The id of the node to add. If not provided, a new id will be generated.
         * @param parent The parent node of the node to add. If not provided, the node will
         * be orphan.
         * @returns the newly created node.
         */
        addNode(id?: string, parent?: BaseNode.Class): BaseNode.Class {
            if (id === undefined && this.scratchData.nodeIdGenerator !== undefined) {
                id = this.scratchData.nodeIdGenerator.newId(this);
            }
            const newNode = this.#graph.add({
                group: "nodes",
                data: { id, parent: parent?.id },
            });
            return new BaseNode.Class(this, newNode);
        }

        /**
         * Adds a new empty edge to the graph, connecting two existing nodes.
         *
         * @param source The source node of the edge.
         * @param target The target node of the edge.
         * @param id The id of the edge to add. If not provided, a new id will be generated.
         * @returns the newly created edge.
         */
        addEdge(
            source: BaseNode.Class,
            target: BaseNode.Class,
            id?: string,
        ): BaseEdge.Class {
            if (id === undefined && this.scratchData.edgeIdGenerator !== undefined) {
                id = this.scratchData.edgeIdGenerator.newId(this, source, target);
            }
            const newEdge = this.#graph.add({
                group: "edges",
                data: { id, source: source.id, target: target.id },
            });
            return new BaseEdge.Class(this, newEdge);
        }

        /**
         * Retrieve a specific node from the graph by its id.
         *
         * @param id The id of the node to get.
         * @returns The node with the given id, or undefined if no such node exists.
         */
        getNodeById(id: string): BaseNode.Class | undefined {
            const node = this.#graph.getElementById(id);
            if (node.isNode()) {
                return new BaseNode.Class(this, node);
            }

            return undefined;
        }

        /**
         * Retrieve a specific edge from the graph by its id.
         *
         * @param id The id of the edge to get.
         * @returns The edge with the given id, or undefined if no such edge exists.
         */
        getEdgeById(id: string): BaseEdge.Class | undefined {
            const edge = this.#graph.getElementById(id);
            if (edge.isEdge()) {
                return new BaseEdge.Class(this, edge);
            }

            return undefined;
        }

        /**
         * @returns A collection of all nodes in the graph.
         */
        get nodes(): NodeCollection {
            // Appears as deprecated because it is for internal use only
            return new NodeCollection(this, BaseNode.Class, this.#graph.nodes());
        }

        /**
         * @returns A collection of all edges in the graph.
         */
        get edges(): EdgeCollection {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(this, BaseEdge.Class, this.#graph.edges());
        }

        /**
         * @param NodeType The type of node to create an empty collection for.
         * @returns An empty collection of the given type.
         */
        emptyCollection<
            D extends BaseNode.Data,
            S extends BaseNode.ScratchData,
            N extends BaseNode.Class<D, S>,
        >(NodeType: Node<D, S, N>): NodeCollection<D, S, N>;
        /**
         * @param EdgeType The type of edge to create an empty collection for.
         * @returns An empty collection of the given type.
         */
        emptyCollection<
            D extends BaseEdge.Data,
            S extends BaseEdge.ScratchData,
            E extends BaseEdge.Class<D, S>,
        >(EdgeType: Edge<D, S, E>): EdgeCollection<D, S, E>;
        emptyCollection(
            Type: Node<any, any, any> | Edge<any, any, any>,
        ): NodeCollection | EdgeCollection {
            // Checks which constructor Type.Class is by constructing a dummy object.
            // This distinguishes node types from edge types.
            if (new Type.Class(this, {} as any) instanceof BaseNode.Class) {
                // Appears as deprecated because it is for internal use only
                return new NodeCollection(
                    this,
                    Type.Class as Node.Class<any, any, any>,
                    this.#graph.collection(),
                );
            } else {
                // Appears as deprecated because it is for internal use only
                return new EdgeCollection(
                    this,
                    Type.Class as Edge.Class<any, any, any>,
                    this.#graph.collection(),
                );
            }
        }

        /**
         * Creates a collection from an array of nodes.
         * Given that the array may be empty, passing the NodeType is mandatory.
         *
         * @param NodeType The type of node to create a collection for.
         * @param nodes The nodes to create a collection from.
         * @returns A collection of the given type with the given nodes.
         */
        arrayCollection<
            D extends BaseNode.Data,
            S extends BaseNode.ScratchData,
            N extends BaseNode.Class<D, S>,
        >(NodeType: Node<D, S, N>, nodes: N[]): NodeCollection<D, S, N>;
        /**
         * Creates a collection from an array of edges.
         * Given that the array may be empty, passing the EdgeType is mandatory.
         *
         * @param EdgeType The type of edge to create a collection for.
         * @param edges The edges to create a collection from.
         * @returns A collection of the given type with the given edges.
         */
        arrayCollection<
            D extends BaseEdge.Data,
            S extends BaseEdge.ScratchData,
            E extends BaseEdge.Class<D, S>,
        >(EdgeType: Edge<D, S, E>, edges: E[]): EdgeCollection<D, S, E>;
        arrayCollection(
            Type: Node<any, any, any> | Edge<any, any, any>,
            elements: any[],
        ): NodeCollection | EdgeCollection {
            if (new Type.Class(this, {} as any) instanceof BaseNode.Class) {
                if (elements.length === 0) {
                    return this.emptyCollection(Type as Node<any, any, any>);
                } else {
                    return NodeCollection.from(elements[0], ...elements.slice(1));
                }
            } else {
                if (elements.length === 0) {
                    return this.emptyCollection(Type as Edge<any, any, any>);
                } else {
                    return EdgeCollection.from(elements[0], ...elements.slice(1));
                }
            }
        }

        /**
         * Applies a {@link Graph.Transformation} to the graph. May be chained.
         *
         * @param transformation The transformation to apply.
         * @returns The graph after applying the transformation.
         */
        apply<G2 extends BaseGraph.Class>(
            transformation: Graph.Transformation<this, G2>,
        ): G2 {
            return transformation.apply(this);
        }

        /**
         * Converts the graph to a string using a {@link Graph.Formatter}.
         *
         * @param formatter The formatter to use.
         * @returns The string representation of the graph.
         */
        toString(formatter: Graph.Formatter<this>): string {
            return formatter.format(this);
        }

        /**
         * Converts the graph to a string using a {@link Graph.Formatter} and writes
         * it to a file.
         *
         * @param formatter The formatter to use.
         * @param filename The name of the file to write to.
         * @returns The file to where the contents where written.
         */
        toFile(formatter: Graph.Formatter<this>, filename: string): JavaClasses.File {
            return Io.writeFile(filename, this.toString(formatter));
        }

        /**
         * @returns the underlying cytoscape graph object.
         */
        toCy(): cytoscape.Core {
            return this.#graph;
        }
    }

    /**
     * Type guards for {@link BaseGraph}. Since this is the base class, data and scratch
     * are always assumed to be compatible, avoiding the runtime cost of exhaustively checking
     * the type of objects such as {@link ScratchData.nodeIdGenerator} on every cast.
     *
     * However, importing a cytoscape object that does not respect these types may lead to
     * runtime errors on certain operations, such as adding a new node. In practice, its almost
     * impossible for that to happen unintentionally, as these fields are under the
     * {@link Graph.scratchNamespace | lara-flow namespace}.
     */
    export const TypeGuard: Graph.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseGraph.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is ScratchData {
            return true;
        },
    };

    /**
     * Data contained in this graph type.
     */
    export interface Data {}

    /**
     * Scratch data contained in this graph type.
     */
    export interface ScratchData {
        /**
         * The {@link Node.IdGenerator} to be used when generating node identifiers.
         */
        nodeIdGenerator: Node.IdGenerator | undefined;
        /**
         * The {@link Edge.IdGenerator} to be used when generating edge identifiers.
         */
        edgeIdGenerator: Edge.IdGenerator | undefined;
    }
}

export default BaseGraph;
