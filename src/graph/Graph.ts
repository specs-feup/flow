import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import BaseGraph from "lara-flow/graph/BaseGraph";

/**
 * Represents a graph type. All graph types must be subtypes of {@link BaseGraph}.
 * A graph type has 5 components:
 * - A class with functionality;
 * - A builder class;
 * - A type guard object;
 * - A data type;
 * - A scratch data type.
 *
 * @param <D> - Type parameter for the data contained in the graph type.
 * @param <S> - Type parameter for the scratch data contained in the graph type.
 * @param <G> - Type parameter for the instance of the class with functionality for this graph type.
 * @param <B> - Type parameter for the instance of the builder class for this graph type.
 */
type Graph<
    D extends BaseGraph.Data,
    S extends BaseGraph.ScratchData,
    G extends BaseGraph.Class<D, S>,
    B extends Graph.Builder<D, S>,
> = {
    /**
     * The class with functionality for the graph type. See {@link Graph.Class}.
     */
    Class: Graph.Class<D, S, G>;
    /**
     * The builder class for the graph type. See {@link Graph.BuilderClass}.
     */
    Builder: Graph.BuilderClass<D, S, B>;
    /**
     * The type guard object for the graph type. See {@link Graph.TypeGuard}.
     */
    TypeGuard: Graph.TypeGuard<D, S>;
};

namespace Graph {
    /**
     * Namespace to store scratch data in lara-flow. Avoids collision with
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
    > = new (node: cytoscape.Core, _d: D, _sd: S) => G;

    /**
     * Represents a builder class for a graph type.
     * For example, {@link BaseGraph.Builder} is a {@link Graph.BuilderClass}
     */
    export type BuilderClass<
        D extends BaseGraph.Data,
        S extends BaseGraph.ScratchData,
        B extends Graph.Builder<D, S>,
    > = new (..._: any[]) => B;

    /**
     * Represents a builder class instance for a graph type.
     * For example, an instance of {@link BaseGraph.Builder} is a {@link Graph.Builder}
     */
    export interface Builder<D extends BaseGraph.Data, S extends BaseGraph.ScratchData> {
        buildData(data: BaseGraph.Data): D;
        buildScratchData(scratchData: BaseGraph.ScratchData): S;
    }

    /**
     * Represents the type guard object for a graph type.
     * For example, {@link BaseGraph.TypeGuard} is a {@link Graph.TypeGuard}
     */
    export interface TypeGuard<
        D extends BaseGraph.Data,
        S extends BaseGraph.ScratchData,
    > {
        isDataCompatible(data: BaseGraph.Data): data is D;
        isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is S;
    }

    /**
     * Represents a transformation that can be applied to the graph as a whole.
     * See {@link BaseGraph.Class.apply}.
     */
    export interface Transformation {
        apply(graph: BaseGraph.Class): void;
    }
}

export default Graph;
