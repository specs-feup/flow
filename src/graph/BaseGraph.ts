import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import { JavaClasses } from "lara-js/api/lara/util/JavaTypes.js";
import Graph from "lara-flow/graph/Graph";
import BaseNode from "lara-flow/graph/BaseNode";
import BaseEdge from "lara-flow/graph/BaseEdge";
import DotFormatter from "lara-flow/graph/dot/DotFormatter";
import Io from "lara-js/api/lara/Io.js";
import EdgeIdGenerator from "lara-flow/graph/id/EdgeIdGenerator";
import NodeIdGenerator from "lara-flow/graph/id/NodeIdGenerator";
import LaraFlowError from "lara-flow/error/LaraFlowError";

/**
 * The base [graph type]{@link Graph}. All graph types must be subtypes of this type.
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
         * @param _d A hack to force typescript to typecheck D in .as() method.
         * @param _sd A hack to force typescript to typecheck S in .as() method.
         * @deprecated
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

        /**
         * @todo
         * @deprecated
         */
        setNodeIdGenerator(generator: NodeIdGenerator | undefined): this {
            this.#graph.scratch(Graph.scratchNamespace, {
                ...this.scratchData,
                nodeIdGenerator: generator,
            });
            return this;
        }

        /**
         * @todo
         * @deprecated
         */
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
         * @param id The id of the node to add. If not provided, a new id will be generated.
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
         * @todo
         * @deprecated
         */
        get nodes(): BaseNode.Class[] {
            return this.#graph.nodes().map((node) => new BaseNode.Class(this, node));
        }

        /**
         * @todo
         * @deprecated
         */
        get edges(): BaseEdge.Class[] {
            return this.#graph.edges().map((edge) => new BaseEdge.Class(this, edge));
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
            builder: Graph.Builder<D2, S2>,
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
         * @param GraphType The graph type to check compatibility with. The relevant
         * part of the graph type for this function is the {@link Graph.TypeGuard} object.
         * @returns Whether the graph is compatible with the given type.
         */
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

        /**
         * Changes the functionality class of the current graph. This is only
         * possible if the data and scratch data are compatible with the new class.
         * To assert that, use {@link BaseGraph.Class.is}.
         *
         * @param GraphType The graph type to change the functionality class into.
         * The relevant part of the graph type for this function is the {@link Graph.Class} class.
         * @returns The same graph, wrapped in the new functionality class.
         */
        as<G extends BaseGraph.Class<D, S>>(GraphType: {
            Class: Graph.Class<D, S, G>;
        }): G {
            return new GraphType.Class(this.#graph, this.data, this.scratchData);
        }

        /**
         * Changes the functionality class of the current graph. Should only be used
         * when it is known (but not statically provable) that the graph is compatible
         * with the new class. If not, an error will be thrown.
         *
         * It is bad practice to try and catch the error thrown by this function. For
         * such cases, combine {@link BaseGraph.Class.is} with {@link BaseGraph.Class.as},
         * or use {@link BaseGraph.Class.match} instead.
         *
         * @param GraphType The graph type to change the functionality class into.
         * @param message The message to throw if the graph is not compatible with the type.
         * @returns The graph, wrapped in the new functionality class.
         * @throws LaraFlowError if the graph is not compatible with the type.
         * This error should be seen as a logic error and not catched.
         */
        expect<
            D2 extends BaseGraph.Data,
            S2 extends BaseGraph.ScratchData,
            G2 extends BaseGraph.Class<D2, S2>,
            B2 extends Graph.Builder<D2, S2>,
        >(GraphType: Graph<D2, S2, G2, B2>, message?: string): G2 {
            if (!this.is(GraphType)) {
                if (message === undefined) {
                    message = "Graph type mismatch";
                }
                throw new LaraFlowError(message);
            }

            return this.as(GraphType);
        }

        /**
         *  g.match(
         *      [ TGraph, (g: TGraph.Class) => g.t() ],
         *      [ BaseGraph, (g: BaseGraph.Class) => console.log("Default") ],
         *  )
         *
         *  The implementation is not exactly correct. Will either be fixed or removed altogether
         *  in the future. For most use cases, it should report error messages when needed.
         *  See also {@link BaseGraph.Class.switch}.
         *
         *  @deprecated until stabilized.
         *  @todo Decide whether to keep this or not.
         */
        match<T extends BaseGraph.Class[]>(
            ...matches: [...{ [I in keyof T]: Graph.Match<T[I]> }]
        ) {
            const b = this as BaseGraph.Class;
            for (const [type, callback] of matches) {
                if (b.is(type)) {
                    callback(b.as(type));
                    return;
                }
            }
        }

        /**
         *  g.switch(
         *      Graph.Case(TGraph, (g) => g.t()),
         *      Graph.Case(BaseGraph, (g) => console.log("Default")),
         *  )
         *
         *  Will either be fixed or removed altogether in the future. Depends on the decision
         *  to keep {@link BaseGraph.Class.match}.
         *
         *  @deprecated until stabilized.
         *  @todo Decide whether to keep this or not.
         */
        switch(...cases: ReturnType<typeof Graph.Case>[]) {
            for (const c of cases) {
                if (this.is(c.GraphType)) {
                    c.callback(this.as(c.GraphType));
                    return;
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
         * @todo
         * @deprecated
         */
        toDot(dotFormatter: DotFormatter, label?: string): string {
            return dotFormatter.format(this, label);
        }

        /**
         * @todo
         * @deprecated
         */
        toDotFile(
            dotFormatter: DotFormatter,
            filename: string,
            label?: string,
        ): JavaClasses.File {
            return Io.writeFile(filename, this.toDot(dotFormatter, label));
        }

        /**
         * @returns the underlying cytoscape graph object.
         */
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
