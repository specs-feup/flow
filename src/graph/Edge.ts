import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

/**
 * Represents an edge type. All edge types must be subtypes of {@link BaseEdge}.
 * An edge type has 5 components:
 * - A class with functionality;
 * - A builder class;
 * - A type guard object;
 * - A data type;
 * - A scratch data type.
 *
 * @template D Type parameter for the data contained in the edge type.
 * @template S Type parameter for the scratch data contained in the edge type.
 * @template E Type parameter for the instance of the class with functionality for this edge type.
 * @template B Type parameter for the instance of the builder class for this edge type.
 */
type Edge<
    D extends BaseEdge.Data,
    S extends BaseEdge.ScratchData,
    E extends BaseEdge.Class<D, S>,
    B extends Edge.Builder<D, S>,
> = {
    /**
     * The class with functionality for the edge type. See {@link Edge.Class}.
     */
    Class: Edge.Class<D, S, E>;
    /**
     * The builder class for the edge type. See {@link Edge.BuilderClass}.
     */
    Builder: Edge.BuilderClass<D, S, B>;
    /**
     * The type guard object for the edge type. See {@link Edge.TypeGuard}.
     */
    TypeGuard: Edge.TypeGuard<D, S>;
};

namespace Edge {
    /**
     * Represents the class with functionality for an edge type.
     * For example, {@link BaseEdge.Class} is an {@link Edge.Class}
     */
    export type Class<
        D extends BaseEdge.Data,
        S extends BaseEdge.ScratchData,
        E extends BaseEdge.Class<D, S>,
    > = new (graph: BaseGraph.Class, node: cytoscape.EdgeSingular, _d: D, _sd: S) => E;

    /**
     * Represents a builder class for an edge type.
     * For example, {@link BaseEdge.Builder} is a {@link Edge.BuilderClass}.
     */
    export type BuilderClass<
        D extends BaseEdge.Data,
        S extends BaseEdge.ScratchData,
        B extends Edge.Builder<D, S>,
    > = new (..._: any[]) => B;

    /**
     * Represents a builder class instance for an edge type.
     * For example, an instance of {@link BaseEdge.Builder} is an {@link Edge.Builder}.
     *
     * The builder class may have a constructor and methods to customize the information
     * that is stored in the edge.
     */
    export interface Builder<D extends BaseEdge.Data, S extends BaseEdge.ScratchData> {
        /**
         * Adds data to the data object of the edge.
         *
         * @param data The current data object of the edge.
         * @returns The data object to be stored in the edge.
         */
        buildData(data: BaseEdge.Data): D;

        /**
         * Adds data to the scratch data object of the edge.
         *
         * @param scratchData The current scratch data object of the edge.
         * @returns The scratch data object to be stored in the edge.
         */
        buildScratchData(scratchData: BaseEdge.ScratchData): S;
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
        B extends Edge.Builder<D, S>,
    >(EdgeType: Edge<D, S, E, B>, callback: (g: E) => void) {
        // By wrapping the class in a function, we can avoid the
        // use of the `new` keyword, making the switch slightly
        // less verbose.
        class _Case {
            EdgeType: Edge<any, any, any, any>;
            callback: (g: any) => void;
            constructor(EdgeType: Edge<any, any, any, any>, callback: (g: any) => void) {
                this.EdgeType = EdgeType;
                this.callback = callback;
            }
        }

        return new _Case(EdgeType, callback);
    }
}

export default Edge;
