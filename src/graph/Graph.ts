import cytoscape from "cytoscape";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";

/**
 * Represents a graph type. All graph types must be subtypes of {@link BaseGraph}.
 * A graph type has 5 components:
 * - A class with functionality ({@link BaseGraph.Class});
 * - A builder class (optional) ({@link Graph.Builder});
 * - A type guard object ({@link Graph.TypeGuard});
 * - A data type ({@link BaseGraph.Data});
 * - A scratch data type ({@link BaseGraph.ScratchData}).
 *
 * @template D Type parameter for the data contained in the graph type.
 * @template S Type parameter for the scratch data contained in the graph type.
 * @template G Type parameter for the instance of the class with functionality for this graph type.
 */
type Graph<
    D extends BaseGraph.Data,
    S extends BaseGraph.ScratchData,
    G extends BaseGraph.Class<D, S>,
> = {
    /**
     * The class with functionality for the graph type. See {@link Graph.Class}.
     */
    Class: Graph.Class<D, S, G>;
    /**
     * The type guard object for the graph type. See {@link Graph.TypeGuard}.
     */
    TypeGuard: Graph.TypeGuard<D, S>;
};

namespace Graph {
    /**
     * Namespace to store scratch data in @specs-feup/flow. Avoids collision with
     * cytoscape extensions.
     */
    export const scratchNamespace = "_lara_flow";

    /**
     * Creates a new empty graph. This should be seen as the graph
     * constructor, since actual constructors are for internal use only.
     */
    export function create(): BaseGraph.Class {
        // Appears as deprecated because it is for internal use only
        return new BaseGraph.Class(cytoscape({}));
    }

    /**
     * Imports a graph from a cytoscape object. This should be seen as the graph
     * constructor, since actual constructors are for internal use only.
     */
    export function fromCy(graph: cytoscape.Core): BaseGraph.Class {
        // Appears as deprecated because it is for internal use only
        return new BaseGraph.Class(graph);
    }

    /**
     * Represents the class with functionality for a graph type.
     * For example, {@link BaseGraph.Class} is a {@link Graph.Class}
     */
    export type Class<
        D extends BaseGraph.Data,
        S extends BaseGraph.ScratchData,
        G extends BaseGraph.Class<D, S>,
    > = new (node: cytoscape.Core, _d?: D, _sd?: S) => G;

    /**
     * Represents a builder class instance for a graph type.
     * For example, an instance of {@link BaseGraph.Builder} is a {@link Graph.Builder}.
     *
     * The builder class may have a constructor and methods to customize the information
     * that is stored in the graph.
     */
    export interface Builder<
        D2 extends BaseGraph.Data,
        S2 extends BaseGraph.ScratchData,
        D1 extends BaseGraph.Data = BaseGraph.Data,
        S1 extends BaseGraph.ScratchData = BaseGraph.ScratchData,
    > {
        /**
         * Adds data to the data object of the graph.
         *
         * @param data The current data object of the graph.
         * @returns The data object to be stored in the graph.
         */
        buildData: (data: D1) => D2;

        /**
         * Adds data to the scratch data object of the graph.
         *
         * @param scratchData The current scratch data object of the graph.
         * @returns The scratch data object to be stored in the graph.
         */
        buildScratchData: (scratchData: S1) => S2;
    }

    /**
     * Represents the type guard object for a graph type.
     * For example, {@link BaseGraph.TypeGuard} is a {@link Graph.TypeGuard}.
     */
    export interface TypeGuard<
        D extends BaseGraph.Data,
        S extends BaseGraph.ScratchData,
    > {
        /**
         * Type guard for the data object of the graph.
         *
         * @param data The data object to be checked.
         * @returns Whether the data object is compatible with the graph type.
         */
        isDataCompatible(data: BaseGraph.Data): data is D;

        /**
         * Type guard for the scratch data object of the graph.
         *
         * @param sData The scratch data object to be checked.
         * @returns Whether the scratch data object is compatible with the graph type.
         */
        isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is S;
    }

    /**
     * Creates a type guard object for a graph type based on a tag, which is
     * less verbose than the usual boilerplate for defining TypeGuards.
     *
     * @param tag The tag to check for in the data object.
     * @param version The version number for the graph type. In the future,
     * if breaking changes are needed (for example, adding a new field
     * when there are already serialized graphs), this version number may
     * be increased. Utility functions to convert types from older versions
     * should be provided.
     * @param isScratchDataCompatible An optional function to check if the
     * scratch data is compatible with the edge type. If not provided, the
     * scratch data is assumed to be compatible.
     * @returns A type guard object for the graph type.
     */
    export function TagTypeGuard<
        D extends BaseGraph.Data,
        S extends BaseGraph.ScratchData,
    >(
        tag: string,
        version: string,
        isScratchDataCompatible: (sData: BaseGraph.ScratchData) => boolean = () => true,
    ): TypeGuard<D, S> {
        return {
            isDataCompatible(data: BaseGraph.Data): data is D {
                const obj = (data as any)[tag];
                return typeof obj === "object" && obj.version === version;
            },

            isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is S {
                return isScratchDataCompatible(sData);
            },
        };
    }

    /**
     * Represents a case in a {@link BaseGraph.Class.switch}.
     *
     * @param GraphType The graph type to match.
     * @param callback The call back if the graph type matches.
     * @returns An object to be used in {@link BaseGraph.Class.switch}.
     */
    export function Case<
        D extends BaseGraph.Data,
        S extends BaseGraph.ScratchData,
        G extends BaseGraph.Class<D, S>,
    >(GraphType: Graph<D, S, G>, callback: (g: G) => void) {
        // By wrapping the class in a function, we can avoid the
        // use of the `new` keyword, making the switch slightly
        // less verbose.
        class _Case {
            GraphType: Graph<any, any, any>;
            callback: (g: any) => void;
            constructor(GraphType: Graph<any, any, any>, callback: (g: any) => void) {
                this.GraphType = GraphType;
                this.callback = callback;
            }
        }

        return new _Case(GraphType, callback);
    }

    /**
     * Represents a formatter that can be used to convert a graph to a string.
     * See {@link BaseGraph.Class.toString}.
     *
     * @template G The graph type.
     *
     * @param graph The graph to be formatted.
     * @returns The string representation of the graph.
     */
    export interface Formatter<G extends BaseGraph.Class> {
        format: (graph: G) => string;
    }

    /**
     * Represents a transformation that can be applied to the graph as a whole.
     * See {@link BaseGraph.Class.apply}.
     *
     * @template G1 The graph before the transformation.
     * @template G2 The graph after the transformation.
     */
    export interface Transformation<
        G1 extends BaseGraph.Class,
        G2 extends BaseGraph.Class,
    > {
        apply: (graph: G1) => G2;
    }
}

export default Graph;
