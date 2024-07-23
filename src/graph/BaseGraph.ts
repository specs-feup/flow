import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import Graph from "lara-flow/graph/Graph";
import BaseNode from "lara-flow/graph/BaseNode";
import BaseEdge from "lara-flow/graph/BaseEdge";
import { JavaClasses } from "lara-js/api/lara/util/JavaTypes.js";
import DotFormatter from "lara-flow/dot/DotFormatter";
import Io from "lara-js/api/lara/Io.js";
import EdgeIdGenerator from "lara-flow/graph/id/EdgeIdGenerator";
import NodeIdGenerator from "lara-flow/graph/id/NodeIdGenerator";

/**
 * The base [graph type]{@link Graph}. All graph types must be subtypes of this type.
 */
namespace BaseGraph {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        #graph: cytoscape.Core;

        /**
         * @deprecated
         * This constructor is for internal use only. Use {@link Graph.create} or
         * {@link Graph.fromCy} to create a new graph instead.
         * 
         * It is not possible to make the constructor private or protected as it is used
         * in other parts of this framework outside of this class (for instance,
         * {@link Graph.Class}). However, it should not be used directly by user code.
         *
         * @param graph - The underlying cytoscape graph object.
         * @param _d - A hack to force typescript to typecheck D in .as() method.
         * @param _sd - A hack to force typescript to typecheck S in .as() method.
         */
        constructor(graph: cytoscape.Core, _d: D = {} as any, _sd: S = {} as any) {
            this.#graph = graph;
        }

        /**
         * @returns the data object associated with this graph.
         */
        get data(): D {
            return this.#graph.data();
        }

        /**
         * @returns the scratch data object associated with this graph.
         */
        get scratchData(): S {
            return this.#graph.scratch(Graph.scratchNamespace);
        }

        setNodeIdGenerator(generator: NodeIdGenerator | undefined): this {
            this.#graph.scratch(Graph.scratchNamespace, {
                ...this.scratchData,
                nodeIdGenerator: generator,
            });
            return this;
        }

        setEdgeIdGenerator(generator: EdgeIdGenerator | undefined): this {
            this.#graph.scratch(Graph.scratchNamespace, {
                ...this.scratchData,
                edgeIdGenerator: generator,
            });
            return this;
        }

        /**
         * Adds a new empty node to the graph.
         *
         * @param id - The id of the node to add. If not provided, a new id will be generated.
         * @returns the newly created node.
         */
        addNode(id?: string): BaseNode.Class {
            if (id === undefined && this.scratchData.nodeIdGenerator !== undefined) {
                id = this.scratchData.nodeIdGenerator.newId(this);
            }
            const newNode = this.#graph.add({
                group: "nodes",
                data: { id },
            });
            return new BaseNode.Class(this, newNode);
        }

        /**
         * Adds a new empty edge to the graph, connecting two existing nodes.
         *
         * @param source - The source node of the edge.
         * @param target - The target node of the edge.
         * @param id - The id of the edge to add. If not provided, a new id will be generated.
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
         * @param id - The id of the node to get.
         * @returns - The node with the given id, or undefined if no such node exists.
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
         * @param id - The id of the edge to get.
         * @returns - The edge with the given id, or undefined if no such edge exists.
         */
        getEdgeById(id: string): BaseEdge.Class | undefined {
            const edge = this.#graph.getElementById(id);
            if (edge.isEdge()) {
                return new BaseEdge.Class(this, edge);
            }

            return undefined;
        }

        // TODO
        get nodes(): BaseNode.Class[] {
            return this.#graph.nodes().map((node) => new BaseNode.Class(this, node));
        }

        // TODO
        get edges(): BaseEdge.Class[] {
            return this.#graph.edges().map((edge) => new BaseEdge.Class(this, edge));
        }

        is<D2 extends Data, S2 extends ScratchData>(GraphType: {
            TypeGuard: Graph.TypeGuard<D2, S2>;
        }): this is BaseGraph.Class<D2, S2> {
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

        as<G extends BaseGraph.Class<D, S>>(GraphType: {
            Class: Graph.Class<D, S, G>;
        }): G {
            return new GraphType.Class(this.#graph, this.data, this.scratchData);
        }

        init<D2 extends BaseGraph.Data, S2 extends BaseGraph.ScratchData>(
            builder: Graph.Builder<D2, S2>,
        ): BaseGraph.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#graph.data(initedData);
            this.#graph.scratch(Graph.scratchNamespace, initedScratchData);
            return new BaseGraph.Class(this.#graph, initedData, initedScratchData);
        }

        apply(transformation: Graph.Transformation): this {
            transformation.apply(this);
            return this;
        }

        toDot(dotFormatter: DotFormatter, label?: string): string {
            return dotFormatter.format(this, label);
        }

        toDotFile(
            dotFormatter: DotFormatter,
            filename: string,
            label?: string,
        ): JavaClasses.File {
            return Io.writeFile(filename, this.toDot(dotFormatter, label));
        }

        toCy(): cytoscape.Core {
            return this.#graph;
        }
    }

    /**
     * Builder for {@link BaseGraph}. Since this is the base class, the implementation
     * is trivial.
     */
    export class Builder implements Graph.Builder<Data, ScratchData> {
        buildData(data: BaseGraph.Data): Data {
            return data;
        }

        buildScratchData(scratchData: BaseGraph.ScratchData): ScratchData {
            return scratchData;
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
     * [lara-flow namespace]{@link Graph.scratchNamespace}.
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
        nodeIdGenerator: NodeIdGenerator | undefined;
        edgeIdGenerator: EdgeIdGenerator | undefined;
    }
}

export default BaseGraph;
