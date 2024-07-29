import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";

abstract class DotFormatter {
    abstract formatNode(node: BaseNode.Class): DotFormatter.Node;

    abstract formatEdge(edge: BaseEdge.Class): DotFormatter.Edge;

    format(graph: BaseGraph.Class): string {
        const nodes = graph.nodes
            .map((node) => this.formatNode(node))
            .join("");

        const edges = graph.edges
            .map((edge) => {
                const { source, target, attrs } = this.formatEdge(edge);
                
            })
            .join("");

        
    }
}
