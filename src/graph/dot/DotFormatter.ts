import BaseGraph from "@specs-feup/lara-flow/graph/BaseGraph";
import { DotGraph } from "@specs-feup/lara-flow/graph/dot/dot";
import Graph from "@specs-feup/lara-flow/graph/Graph";

/**
 * A formatter that converts a graph to a DOT string.
 *
 * @typeParam G - The type of the graph.
 */
export default abstract class DotFormatter<G extends BaseGraph.Class>
    implements Graph.Formatter<G>
{
    /**
     * Converts a graph into a {@link DotGraph}. This function is used
     * by the formatted to convert the graph into a DOT string.
     *
     * @param graph - The graph to convert.
     * @returns The resulting DOT graph.
     */
    abstract toDot(graph: G): DotGraph;

    /**
     * Converts a graph to a DOT string.
     *
     * @param graph - The graph to convert.
     * @returns The resulting DOT string.
     */
    format(graph: G): string {
        return this.toDot(graph).toDotString();
    }
}
