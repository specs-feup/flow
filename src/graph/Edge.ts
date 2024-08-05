import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import Graph from "lara-flow/graph/Graph";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

/**
 * Represents an edge type. All edge types must be subtypes of {@link BaseEdge}.
 * An edge type has 5 components:
 * - A class with functionality ({@link Edge.Class});
 * - A builder class (optional) ({@link Edge.Builder});
 * - A type guard object ({@link Edge.TypeGuard});
 * - A data type ({@link BaseEdge.Data});
 * - A scratch data type ({@link BaseEdge.ScratchData}).
 *
 * @template D Type parameter for the data contained in the edge type.
 * @template S Type parameter for the scratch data contained in the edge type.
 * @template E Type parameter for the instance of the class with functionality for this edge type.
 */
type Edge<
    D extends BaseEdge.Data,
    S extends BaseEdge.ScratchData,
    E extends BaseEdge.Class<D, S>,
> = {
    /**
     * The class with functionality for the edge type. See {@link Edge.Class}.
     */
    Class: Edge.Class<D, S, E>;
    /**
     * The type guard object for the edge type. See {@link Edge.TypeGuard}.
     */
    TypeGuard: Edge.TypeGuard<D, S>;
};

namespace Edge {
    /**
     * Retrieves an edge from the given cytoscape edge representation.
     *
     * @param edge The cytoscape edge to create the edge from.
     * @returns The edge from the cytoscape edge.
     */
    export function fromCy(edge: cytoscape.EdgeSingular): BaseEdge.Class {
        // Appears as deprecated because it is for internal use only
        return new BaseEdge.Class(Graph.fromCy(edge.cy()), edge);
    }

    /**
     * Represents the class with functionality for an edge type.
     * For example, {@link BaseEdge.Class} is an {@link Edge.Class}
     */
    export type Class<
        D extends BaseEdge.Data,
        S extends BaseEdge.ScratchData,
        E extends BaseEdge.Class<D, S>,
    > = new (graph: BaseGraph.Class, node: cytoscape.EdgeSingular, _d?: D, _sd?: S) => E;

    /**
     * Represents a builder class instance for an edge type.
     * For example, an instance of {@link BaseEdge.Builder} is an {@link Edge.Builder}.
     *
     * The builder class may have a constructor and methods to customize the information
     * that is stored in the edge.
     */
    export interface Builder<
        D2 extends BaseEdge.Data,
        S2 extends BaseEdge.ScratchData,
        D1 extends BaseEdge.Data = BaseEdge.Data,
        S1 extends BaseEdge.ScratchData = BaseEdge.ScratchData,
    > {
        /**
         * Adds data to the data object of the edge.
         *
         * @param data The current data object of the edge.
         * @returns The data object to be stored in the edge.
         */
        buildData: (data: D1) => D2;

        /**
         * Adds data to the scratch data object of the edge.
         *
         * @param scratchData The current scratch data object of the edge.
         * @returns The scratch data object to be stored in the edge.
         */
        buildScratchData: (scratchData: S1) => S2;
    }

    /**
     * Represents the type guard object for an edge type.
     * For example, {@link BaseEdge.TypeGuard} is an {@link Edge.TypeGuard}.
     */
    export interface TypeGuard<D extends BaseEdge.Data, S extends BaseEdge.ScratchData> {
        /**
         * Type guard for the data object of the edge.
         *
         * @param data The data object to be checked.
         * @returns Whether the data object is compatible with the edge type.
         */
        isDataCompatible(data: BaseEdge.Data): data is D;

        /**
         * Type guard for the scratch data object of the edge.
         *
         * @param sData The scratch data object to be checked.
         * @returns Whether the scratch data object is compatible with the edge type.
         */
        isScratchDataCompatible(sData: BaseEdge.ScratchData): sData is S;
    }

    /**
     * Represents a case in a {@link BaseEdge.Class.switch}.
     *
     * @param EdgeType The edge type to match.
     * @param callback The call back if the edge type matches.
     * @returns An object to be used in {@link BaseEdge.Class.switch}.
     */
    export function Case<
        D extends BaseEdge.Data,
        S extends BaseEdge.ScratchData,
        E extends BaseEdge.Class<D, S>,
    >(EdgeType: Edge<D, S, E>, callback: (g: E) => void) {
        // By wrapping the class in a function, we can avoid the
        // use of the `new` keyword, making the switch slightly
        // less verbose.
        class _Case {
            EdgeType: Edge<any, any, any>;
            callback: (g: any) => void;
            constructor(EdgeType: Edge<any, any, any>, callback: (g: any) => void) {
                this.EdgeType = EdgeType;
                this.callback = callback;
            }
        }

        return new _Case(EdgeType, callback);
    }

    /**
     * An object that can generate unique identifiers for edges.
     * See {@link BaseGraph.Class.setEdgeIdGenerator}.
     */
    export interface IdGenerator {
        /**
         * Generates a unique identifier for a new edge.
         *
         * @param graph The graph that the edge belongs to.
         * @param source The source node of the edge.
         * @param target The target node of the edge.
         * @returns A unique identifier for the new edge.
         */
        newId(
            graph: BaseGraph.Class,
            source: BaseNode.Class,
            target: BaseNode.Class,
        ): string;
    }
}

export default Edge;
