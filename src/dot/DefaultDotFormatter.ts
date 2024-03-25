import DotFormatter from "clava-flow/dot/DotFormatter";
import Edge from "clava-flow/graph/Edge";
import BaseNode from "clava-flow/graph/Node";

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

    override formatEdge(edge: Edge): DotFormatter.Edge {
        return {
            source: edge.source.id,
            target: edge.target.id,
            attrs: {
                label: edge.id,
            },
        };
    }
}
