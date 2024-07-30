import DotFormatter from "lara-flow/graph/dot/DotFormatter";
import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseNode from "lara-flow/graph/BaseNode";
import BaseGraph from "lara-flow/graph/BaseGraph";
import Dot, { DotEdge, DotGraph, DotNode, DotSubgraph } from "lara-flow/graph/dot/dot";

/**
 * The default formatter for converting a graph into a DOT string.
 * 
 * All nodes and all edges are present in the resulting graph. Nodes
 * that are parents are represented as clusters, with an appropriate
 * hack (invisible point node) to make the edges connect correctly.
 */
export default class DefaultDotFormatter extends DotFormatter<BaseGraph.Class> {
    /**
     * The attributes to add to each node.
     */
    getNodeAttrs: (node: BaseNode.Class) => Record<string, string>;
    /**
     * The attributes to add to each edge.
     */
    getEdgeAttrs: (edge: BaseEdge.Class) => Record<string, string>;

    /**
     * The default attributes of a node.
     * 
     * @param node The node to get the attributes for.
     * @returns The attributes of the node.
     */
    static defaultGetNodeAttrs(node: BaseNode.Class): Record<string, string> {
        return { label: node.id, shape: "box" };
    }

    /**
     * The default attributes of an edge.
     * 
     * @param edge The edge to get the attributes for.
     * @returns The attributes of the edge.
     */
    static defaultGetEdgeAttrs(edge: BaseEdge.Class): Record<string, string> {
        return { label: edge.id };
    }

    /**
     * Creates a new default DOT formatter.
     * 
     * @param getNodeAttrs The attributes to add to each node. If not provided,
     * the default attributes are used.
     * @param getEdgeAttrs The attributes to add to each edge. If not provided,
     * the default attributes are used.
     */
    constructor(
        getNodeAttrs?: (node: BaseNode.Class) => Record<string, string>,
        getEdgeAttrs?: (edge: BaseEdge.Class) => Record<string, string>,
    ) {
        super();
        this.getNodeAttrs = getNodeAttrs ?? DefaultDotFormatter.defaultGetNodeAttrs;
        this.getEdgeAttrs = getEdgeAttrs ?? DefaultDotFormatter.defaultGetEdgeAttrs;
    }

    /**
     * Adds attributes to each node. Only overrides the attributes that are
     * explicitly set by the function, leaving the others unchanged.
     * 
     * For completely overriding the previous attributes, just set 
     * {@link getNodeAttrs} directly.
     * 
     * @param f The function that adds attributes to each node.
     * @returns The same formatter, for chaining.
     */
    addNodeAttrs(f: (node: BaseNode.Class) => Record<string, string>): this {
        const old = this.getNodeAttrs;
        this.getNodeAttrs = (node) => ({ ...old(node), ...f(node) });
        return this;
    }

    /**
     * Adds attributes to each edge. Only overrides the attributes that are
     * explicitly set by the function, leaving the others unchanged.
     * 
     * For completely overriding the previous attributes, just set 
     * {@link getEdgeAttrs} directly.
     * 
     * @param f The function that adds attributes to each edge.
     * @returns The same formatter, for chaining.
     */
    addEdgeAttrs(f: (edge: BaseEdge.Class) => Record<string, string>): this {
        const old = this.getEdgeAttrs;
        this.getEdgeAttrs = (edge) => ({ ...old(edge), ...f(edge) });
        return this;
    }

    /**
     * Converts a node without children into a DOT node.
     * 
     * @param node The node to convert.
     * @returns The resulting DOT node.
     */
    nodeToDot(node: BaseNode.Class): DotNode {
        return Dot.node(node.id, this.getNodeAttrs(node));
    }

    /**
     * Converts an edge into a DOT edge.
     * 
     * @param edge The edge to convert. 
     * @returns The resulting DOT edge.
     */
    edgeToDot(edge: BaseEdge.Class): DotEdge {
        const dot = Dot.edge(edge.source.id, edge.target.id, this.getEdgeAttrs(edge));
        if (edge.target.isParent) {
            dot.attr("lhead", "cluster_" + edge.target.id);
        }
        if (edge.source.isParent) {
            dot.attr("ltail", "cluster_" + edge.source.id);
        }
        return dot;
    }

    /**
     * Converts a node with children into a DOT subgraph.
     * 
     * @param node The node to convert.
     * @returns The resulting DOT subgraph.
     */
    parentNodeToDot(node: BaseNode.Class): DotSubgraph {
        const dot = Dot.subgraph("cluster_" + node.id)
            .graphAttrs(this.getNodeAttrs(node))
            .node(node.id, { shape: "point", style: "invis" });

        for (const subnode of node.children) {
            if (subnode.isParent) {
                dot.statements(this.parentNodeToDot(subnode));
            } else {
                dot.statements(this.nodeToDot(subnode));
            }
        }

        return dot;
    }

    /**
     * Converts a graph into a DOT graph.
     * 
     * @param graph The graph to convert.
     * @returns The resulting DOT graph.
     */
    toDot(graph: BaseGraph.Class): DotGraph {
        const dot = Dot.graph().graphAttr("compound", "true");

        for (const node of graph.nodes.filter((node) => !node.isChild)) {
            if (node.isParent) {
                dot.statements(this.parentNodeToDot(node));
            } else {
                dot.statements(this.nodeToDot(node));
            }
        }

        for (const edge of graph.edges) {
            dot.statements(this.edgeToDot(edge));
        }

        return dot;
    }
}
