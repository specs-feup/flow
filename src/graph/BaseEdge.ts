import LaraFlowError from "@specs-feup/flow/error/LaraFlowError";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Edge from "@specs-feup/flow/graph/Edge";
import { EdgeCollection } from "@specs-feup/flow/graph/EdgeCollection";
import Graph from "@specs-feup/flow/graph/Graph";
import cytoscape from "cytoscape";

/**
 * The base {@link Edge | edge type}. All edge types must be subtypes of this type.
 */
namespace BaseEdge {
    /**
     * The class with functionality for the base edge type.
     */
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        /**
         * The graph that this edge is a part of.
         */
        #graph: BaseGraph.Class;
        /**
         * Underlying cytoscape edge object.
         */
        #edge: cytoscape.EdgeSingular;

        /**
         * This constructor is for internal use only. Use {@link BaseGraph.Class.addEdge} to create a new edge instead.
         *
         * It is not possible to make the constructor private or protected as it is used
         * in other parts of this framework outside of this class (for instance,
         * {@link Edge.Class}). However, it should not be used directly by user code.
         *
         * @param graph The graph that this edge is a part of.
         * @param edge The underlying cytoscape edge object.
         * @param _d A hack to force typescript to typecheck D in {@link BaseEdge.Class.as} method.
         * @param _sd A hack to force typescript to typecheck S in {@link BaseEdge.Class.as} method.
         * @deprecated @hideconstructor
         */
        constructor(
            graph: BaseGraph.Class,
            edge: cytoscape.EdgeSingular,
            _d: D = {} as any,
            _sd: S = {} as any,
        ) {
            this.#graph = graph;
            this.#edge = edge;
        }

        /**
         * Use the data object for JSON serializable data.
         * For temporary or non-serializable data, use {@link BaseEdge.Class.scratchData}.
         *
         * @returns the data object associated with this edge.
         */
        get data(): D {
            return this.#edge.data();
        }

        /**
         * Use the scratch data object for temporary or non-serializable data.
         * For JSON serializable data, use {@link BaseEdge.Class.data}.
         *
         * The scratch data is stored under the {@link Graph.scratchNamespace | @specs-feup/flow namespace}.
         *
         * @returns the scratch data object associated with this edge.
         */
        get scratchData(): S {
            if (this.#edge.scratch(Graph.scratchNamespace) === undefined) {
                this.#edge.scratch(Graph.scratchNamespace, {});
            }
            return this.#edge.scratch(Graph.scratchNamespace);
        }

        /**
         * @returns the unique identifier of this edge.
         */
        get id(): string {
            return this.#edge.id();
        }

        /**
         * @returns the source node of this edge.
         */
        get source(): BaseNode.Class {
            return new BaseNode.Class(this.#graph, this.#edge.source());
        }

        /**
         * Changes the source node of this edge.
         *
         * @param node The new source node.
         */
        set source(node: BaseNode.Class) {
            this.#edge.move({ source: node.id });
        }

        /**
         * @returns the target node of this edge.
         */
        get target(): BaseNode.Class {
            return new BaseNode.Class(this.#graph, this.#edge.target());
        }

        /**
         * Changes the target node of this edge.
         *
         * @param node The new target node.
         */
        set target(node: BaseNode.Class) {
            this.#edge.move({ target: node.id });
        }

        /**
         * @returns The edges that connect the same nodes as this edge.
         * Direction is not taken into account.
         */
        get parallelEdges(): EdgeCollection<D, S, this> {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                Object.getPrototypeOf(this).constructor,
                this.#edge.parallelEdges(),
            );
        }

        /**
         * @returns The edges that connect the same nodes as this edge.
         * Direction is taken into account.
         */
        get codirectedEdges(): EdgeCollection<D, S, this> {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                Object.getPrototypeOf(this).constructor,
                this.#edge.codirectedEdges(),
            );
        }

        /**
         * Initializes the edge with the information of a builder. This is effectively
         * extends the type of the edge to include the data and scratch data of the builder.
         *
         * The same edge may simultaneously be of multiple types, as long as the data and
         * scratch data are compatible with the types. The builder methods may overwrite
         * data and scratch data fields with names that collide with its type's fields.
         *
         * @param builder The builder to use to initialize the edge.
         * @returns The same edge, with the data and scratch data of the builder.
         * The edge is downcasted to {@link BaseEdge.Class} because the builder may
         * overwrite the data and scratch data fields, invalidating the current type.
         */
        init<D2 extends BaseEdge.Data, S2 extends BaseEdge.ScratchData>(
            builder: Edge.Builder<D2, S2, D, S>,
        ): BaseEdge.Class<D2, S2> {
            const initedData = builder.buildData(this.data);
            const initedScratchData = builder.buildScratchData(this.scratchData);
            this.#edge.data(initedData);
            this.#edge.scratch(Graph.scratchNamespace, initedScratchData);
            // Appears as deprecated because it is for internal use only
            return new BaseEdge.Class(
                this.#graph,
                this.#edge,
                initedData,
                initedScratchData,
            );
        }

        /**
         * Checks if this edge's data and scratch data are compatible
         * with a specific type. This is effectively a type guard function.
         *
         * @param EdgeType The edge type to check compatibility with.
         * @returns Whether the edge is compatible with the given type.
         */
        is<
            D2 extends BaseEdge.Data,
            S2 extends BaseEdge.ScratchData,
            E2 extends BaseEdge.Class<D2, S2>,
        >(EdgeType: Edge<D2, S2, E2>): this is BaseEdge.Class<D2, S2> {
            const data = this.data;
            const scratchData = this.scratchData;
            const result =
                EdgeType.TypeGuard.isDataCompatible(data) &&
                EdgeType.TypeGuard.isScratchDataCompatible(scratchData);

            // Have typescript statically check that the types are correct
            // in the implementation of this function.
            result && (data satisfies D2) && (scratchData satisfies S2);

            return result;
        }

        /**
         * Changes the functionality class of the current edge. This is only
         * possible if the data and scratch data are compatible with the new class.
         * To assert that, use {@link BaseEdge.Class.is}.
         *
         * @param EdgeType The edge type to change the functionality class into.
         * @returns The same edge, wrapped in the new functionality class.
         */
        as<E extends BaseEdge.Class<D, S>>(EdgeType: { Class: Edge.Class<D, S, E> }): E {
            // The following signature does not work
            // as<E extends BaseEdge.Class<D, S>>(EdgeType: Edge<D, S, E>): E {
            return new EdgeType.Class(
                this.#graph,
                this.#edge,
                this.data,
                this.scratchData,
            );
        }

        /**
         * Changes the functionality class of the current edge. Should only be used
         * when it is known (but not statically provable) that the edge is compatible
         * with the new class. If not, an error will be thrown.
         *
         * It is bad practice to try and catch the error thrown by this function. For
         * such cases, combine {@link BaseEdge.Class.is} with {@link BaseEdge.Class.as},
         * or use {@link BaseEdge.Class.switch} instead.
         *
         * @param EdgeType The edge type to change the functionality class into.
         * @param message The message to throw if the edge is not compatible with the type.
         * @returns The edge, wrapped in the new functionality class.
         * @throws {} {@link LaraFlowError} if the edge is not compatible with the type.
         * This error should be seen as a logic error and not catched.
         */
        expect<
            D2 extends BaseEdge.Data,
            S2 extends BaseEdge.ScratchData,
            E2 extends BaseEdge.Class<D2, S2>,
        >(EdgeType: Edge<D2, S2, E2>, message?: string): E2 {
            if (!this.is(EdgeType)) {
                if (message === undefined) {
                    message = "Graph type mismatch";
                }
                throw new LaraFlowError(message);
            }

            return this.as(EdgeType);
        }

        /**
         * Tries to change the functionality class of the current edge. If the edge
         * is not compatible with the new class, undefined is returned.
         *
         * @param EdgeType The edge type to change the functionality class into.
         * @returns The edge, wrapped in the new functionality class, or undefined if
         * the edge is not compatible with the type.
         */
        tryAs<
            D2 extends BaseEdge.Data,
            S2 extends BaseEdge.ScratchData,
            E2 extends BaseEdge.Class<D2, S2>,
        >(EdgeType: Edge<D2, S2, E2>): E2 | undefined {
            if (!this.is(EdgeType)) {
                return undefined;
            }
            return this.as(EdgeType);
        }

        /**
         *  Checks if the type of the edge is compatible with several
         *  types, calling a callback for the first match. See
         *  {@link Edge.Case} for the syntax of each case.
         *
         *  For a default case, match with {@link BaseEdge},
         *  which will always be compatible with any edge type.
         *
         *  @param cases The cases to match against.
         */
        switch(...cases: ReturnType<typeof Edge.Case>[]) {
            for (const { EdgeType, callback } of cases) {
                if (this.is(EdgeType)) {
                    callback(this.as(EdgeType));
                    return;
                }
            }
        }

        /**
         * @returns whether this edge is a loop (source and target are the same node).
         */
        get isLoop(): boolean {
            return this.#edge.isLoop();
        }

        /**
         * Removes this edge from the graph.
         */
        remove() {
            this.#edge.remove();
        }

        /**
         * @returns whether this edge has been removed from the graph.
         */
        get isRemoved(): boolean {
            return this.#edge.removed();
        }

        /**
         * Restores this edge if it has been removed. See {@link BaseEdge.Class.remove}.
         */
        restore() {
            this.#edge.restore();
        }

        /**
         * @returns A collection containing only this edge.
         */
        toCollection(): EdgeCollection<D, S, this> {
            // Appears as deprecated because it is for internal use only
            return new EdgeCollection(
                this.#graph,
                Object.getPrototypeOf(this).constructor,
                this.#edge,
            );
        }

        /**
         * @returns the graph that this edge is a part of.
         */
        get graph(): BaseGraph.Class {
            return this.#graph;
        }

        /**
         * @returns the underlying cytoscape edge object.
         */
        toCy(): cytoscape.EdgeSingular {
            return this.#edge;
        }
    }

    /**
     * Type guards for {@link BaseEdge}. Since this is the base class, data and scratch
     * are always assumed to be compatible.
     */
    export const TypeGuard: Edge.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseEdge.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseEdge.ScratchData,
        ): scratchData is ScratchData {
            return true;
        },
    };

    /**
     * Data contained in this edge type.
     */
    export interface Data {
        /**
         * The unique identifier of this edge.
         */
        id: string;
        /**
         * The unique identifier of the source node of this edge.
         */
        source: string;
        /**
         * The unique identifier of the target node of this edge.
         */
        target: string;
    }

    /**
     * Scratch data contained in this edge type.
     */
    export interface ScratchData {}
}

export default BaseEdge;
