import CallEdge from "@specs-feup/flow/flow/CallEdge";
import ControlFlowEdge from "@specs-feup/flow/flow/ControlFlowEdge";
import ControlFlowEndNode from "@specs-feup/flow/flow/ControlFlowEndNode";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import FlowGraph from "@specs-feup/flow/flow/FlowGraph";
import FunctionNode from "@specs-feup/flow/flow/FunctionNode";
import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import DefaultDotFormatter from "@specs-feup/flow/graph/dot/DefaultDotFormatter";
import Edge from "@specs-feup/flow/graph/Edge";
import Node from "@specs-feup/flow/graph/Node";

/**
 * A formatter for converting a flow graph into a DOT string.
 *
 * {@link ControlFlowNode | ControlFlowNodes} are visualized as contained
 * inside their respective {@link FunctionNode | FunctionNode}, unless an
 * explicit parent is specified.
 * 
 * The {@link ControlFlowEndNode | ControlFlowEndNode} is visualized as a
 * distinguished special symbol. The entry control-flow node is represented
 * like a regular control-flow node, but with a double border. If a
 * {@link ControlFlowNode | ControlFlowNode} has more than one non-fake outgoing edge,
 * it appears diamond-shaped to represent its conditional nature.
 * 
 * A {@link FunctionNode | FunctionNode} has its name as the label, while a
 * {@link ControlFlowNode | ControlFlowNode} has its id as the label. These labels
 * may (and usually should) be overridden by a subclass or an instance.
 * 
 * Colors help distinguish between different types of nodes and edges.
 * {@link ControlFlowEdge.Class.isFake | fake edges} appear with a dashed line.
 *
 * @typeParam G - The type of the graph. This parameter exists so that
 * the formatter may be extended into a formatter that requires a more
 * specific graph type.
 */
export default class FlowDotFormatter<
    G extends FlowGraph.Class = FlowGraph.Class,
> extends DefaultDotFormatter<G> {
    // TODO make it so that they are easier to override
    static functionDarkColor = "#7719b3";
    static functionColor = "#a020f0";
    static functionFontSize = "20";
    static cfgEndNodeSize = "0.25";

    static cfgNodeColor = "#f29e1f";
    static cfgNodeDarkColor = "#d68e20";
    static cfgEdgeTransparency = "2f";
    static cfgDefaultEdgeColor = "#4e7f02";

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
                result.fontname = "Consolas";
            }),
            Node.Case(ControlFlowEndNode, (n) => {
                result.shape = "point";
                result.peripheries = "2";
                result.width = FlowDotFormatter.cfgEndNodeSize;
                result.color = FlowDotFormatter.cfgNodeDarkColor;
            }),
            Node.Case(ControlFlowNode, (n) => {
                result.color = FlowDotFormatter.cfgNodeColor;
                result.fontcolor = FlowDotFormatter.cfgNodeDarkColor;
                result.label = n.id;
                if (n.function.cfgEntryNode?.id === n.id) {
                    result.peripheries = "2";
                }
                if (n.cfgOutgoers.length >= 2) {
                    result.shape = "diamond";
                    result.height = "0.75";
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
                    result.style = "dashed";
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
