import BaseGraph from "lara-flow/graph/BaseGraph";
import { DotGraph } from "lara-flow/graph/dot/dot";
import Graph from "lara-flow/graph/Graph";

export default abstract class DotFormatter<G extends BaseGraph.Class> implements Graph.Formatter<G> {
    abstract toDot(graph: G): DotGraph;

    format(graph: G): string {
        return this.toDot(graph).toDotString();
    }
}
