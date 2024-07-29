import DotFormatter from "lara-flow/graph/dot/DotFormatter";
import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseNode from "lara-flow/graph/BaseNode";
import BaseGraph from "lara-flow/graph/BaseGraph";
import Dot, { DotEdge, DotGraph, DotNode } from "lara-flow/graph/dot/dot";

/**
 * @todo parent stuff
 */
export default class DefaultDotFormatter extends DotFormatter<BaseGraph.Class> {
    nodeToDot(node: BaseNode.Class): DotNode {
        return Dot
            .node(node.id)
            .attrs({
                label: node.id,
                shape: "box",
            });
    }

    edgeToDot(edge: BaseEdge.Class): DotEdge {
        return Dot
            .edge(edge.source.id, edge.target.id)
            .attrs({
                label: edge.id,
            });
    }

    toDot(graph: BaseGraph.Class): DotGraph {
        const dot = Dot.graph();
        for (const node of graph.nodes) {
            dot.statements(this.nodeToDot(node));
        }

        for (const edge of graph.edges) {
            dot.statements(this.edgeToDot(edge));
        }
        return dot;
    }
}
