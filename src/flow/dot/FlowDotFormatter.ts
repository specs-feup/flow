import CallEdge from "@specs-feup/lara-flow/flow/CallEdge";
import ControlFlowEdge from "@specs-feup/lara-flow/flow/ControlFlowEdge";
import ControlFlowNode from "@specs-feup/lara-flow/flow/ControlFlowNode";
import FlowGraph from "@specs-feup/lara-flow/flow/FlowGraph";
import FunctionNode from "@specs-feup/lara-flow/flow/FunctionNode";
import BaseEdge from "@specs-feup/lara-flow/graph/BaseEdge";
import BaseNode from "@specs-feup/lara-flow/graph/BaseNode";
import DefaultDotFormatter from "@specs-feup/lara-flow/graph/dot/DefaultDotFormatter";
import Edge from "@specs-feup/lara-flow/graph/Edge";
import Node from "@specs-feup/lara-flow/graph/Node";

export default class FlowDotFormatter<
    G extends FlowGraph.Class = FlowGraph.Class,
> extends DefaultDotFormatter<G> {
    // TODO make it so that they are easier to override
    // TODO maybe visually mark CFEndNode
    static functionDarkColor = "#7719b3";
    static functionColor = "#a020f0";
    static functionFontSize = "20";

    static cfgNodeColor = "#f29e1f";
    static cfgNodeDarkColor = "#d68e20";
    static cfgEdgeTransparency = "2f";
    static cfgDefaultEdgeColor = "#4e7f02";
    static cfgAlternativeEdgeColor = "#940000";

    /**
     * @param node The node to get the attributes for.
     * @returns The attributes of the node.
     */
    static defaultGetNodeAttrs(node: BaseNode.Class): Record<string, string> {
        const result: Record<string, string> = { label: node.id, shape: "box" };
        node.switch(
            Node.Case(FunctionNode, (n) => {
                result.label = n.functionName;
                result.color = FlowDotFormatter.functionDarkColor;
                result.fontcolor = FlowDotFormatter.functionColor;
                result.fontsize = FlowDotFormatter.functionFontSize;
            }),
            Node.Case(ControlFlowNode, (n) => {
                result.color = FlowDotFormatter.cfgNodeColor;
                result.fontcolor = FlowDotFormatter.cfgNodeDarkColor;
                if (n.function.cfgEntryNode?.id === n.id) {
                    result.peripheries = "2";
                }
            }),
        );
        return result;
    }

    /**
     * @param edge The edge to get the attributes for.
     * @returns The attributes of the edge.
     */
    static defaultGetEdgeAttrs(edge: BaseEdge.Class): Record<string, string> {
        const result: Record<string, string> = {};
        edge.switch(
            Edge.Case(CallEdge, (e) => {
                result.color = FlowDotFormatter.functionColor;
            }),
            Edge.Case(ControlFlowEdge, (e) => {
                result.color = FlowDotFormatter.cfgDefaultEdgeColor;
                if (e.isFake) {
                    result.color += FlowDotFormatter.cfgEdgeTransparency;
                }
            }),
        );
        return result;
    }

    /**
     * Prioritizes the parent of the node as the container.
     * Otherwise, for a {@link ControlFlowNode}, its function is used.
     *
     * @param node The node to find the container of.
     * @returns The parent of the node.
     */
    static defaultGetContainer(node: BaseNode.Class): BaseNode.Class | undefined {
        if (node.parent !== undefined) {
            return node.parent;
        }

        return node.tryAs(ControlFlowNode)?.function;
    }

    /**
     * Creates a new flow DOT formatter.
     */
    constructor() {
        super(
            FlowDotFormatter.defaultGetNodeAttrs,
            FlowDotFormatter.defaultGetEdgeAttrs,
            FlowDotFormatter.defaultGetContainer,
        );
    }
}
