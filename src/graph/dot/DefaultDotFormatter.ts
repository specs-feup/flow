import DotFormatter from "lara-flow/dot/DotFormatter";
import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseNode from "lara-flow/graph/BaseNode";

/**
 * @deprecated
 * @todo
 */
export default class DefaultDotFormatter extends DotFormatter {
    override formatNode(node: BaseNode.Class): DotFormatter.Node {
        return {
            id: node.id,
            attrs: {
                label: node.id,
                shape: "box",
            },
        };
    }

    override formatEdge(edge: BaseEdge.Class): DotFormatter.Edge {
        return {
            source: edge.source.id,
            target: edge.target.id,
            attrs: {
                label: edge.id,
            },
        };
    }
}
