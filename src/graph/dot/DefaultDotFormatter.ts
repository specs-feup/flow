import DotFormatter from "@specs-feup/flow/graph/dot/DotFormatter";
import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import Dot, {
    DotEdge,
    DotGraph,
    DotNode,
    DotSubgraph,
} from "@specs-feup/flow/graph/dot/dot";
import { NodeCollection } from "@specs-feup/flow/graph/NodeCollection";

/**
 * The default formatter for converting a graph into a DOT string.
 *
 * All nodes and all edges are present in the resulting graph. Nodes
 * that are parents are represented as clusters, with an appropriate
 * hack (invisible point node) to make the edges connect correctly.
 *
 * @typeParam G - The type of the graph. This parameter exists so that
 * the formatter may be extended into a formatter that requires a more
 * specific graph type.
 */
export default class DefaultDotFormatter<
    G extends BaseGraph.Class = BaseGraph.Class,
> extends DotFormatter<G> {
    /**
     * The attributes to add to each node.
     */
    getNodeAttrs: (node: BaseNode.Class) => Record<string, string>;
    /**
     * The attributes to add to each edge.
     */
    getEdgeAttrs: (edge: BaseEdge.Class) => Record<string, string>;
    /**
     * Given a node, returns the node that will contain it.
     * By default that is the parent of the node, but subclasses
     * may override this method to visualize other parent-like
     * relationships.
     */
    getContainer: (node: BaseNode.Class) => BaseNode.Class | undefined;

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
     * The default method for finding the container of a node.
     *
     * @param node The node to find the container of.
     * @returns The parent of the node.
     */
    static defaultGetContainer(node: BaseNode.Class): BaseNode.Class | undefined {
        return node.parent;
    }

    /**
     * Creates a new default DOT formatter.
     *
     * @param getNodeAttrs The attributes to add to each node. If not provided,
     * the default attributes are used.
     * @param getEdgeAttrs The attributes to add to each edge. If not provided,
     * the default attributes are used.
     * @param getContainer Given a node, returns the node that will contain it.
     */
    constructor(
        getNodeAttrs?: (node: BaseNode.Class) => Record<string, string>,
        getEdgeAttrs?: (edge: BaseEdge.Class) => Record<string, string>,
        getContainer?: (node: BaseNode.Class) => BaseNode.Class | undefined,
    ) {
        super();
        this.getNodeAttrs = getNodeAttrs ?? DefaultDotFormatter.defaultGetNodeAttrs;
        this.getEdgeAttrs = getEdgeAttrs ?? DefaultDotFormatter.defaultGetEdgeAttrs;
        this.getContainer = getContainer ?? DefaultDotFormatter.defaultGetContainer;
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
     * Retrieves all nodes that are contained by a node.
     * This method is based on {@link getContainer}.
     *
     * @param node The node to get the contained nodes of.
     * @returns The nodes that are contained by the given node.
     */
    containedNodes(node: BaseNode.Class): NodeCollection<BaseNode.Class> {
        return node.graph.nodes.filter((n) => this.getContainer(n)?.id === node.id);
    }

    /**
     * Checks if a node contains other nodes.
     * This is based on {@link getContainer}.
     *
     * @param node The node to check.
     * @returns Whether the node contains other nodes.
     */
    isContainer(node: BaseNode.Class): boolean {
        return node.graph.nodes.some((n) => this.getContainer(n)?.id === node.id);
    }

    /**
     * Checks if a node is contained by another node.
     * This is based on {@link getContainer}.
     *
     * @param node The node to check.
     * @returns Whether the node is contained by another node.
     */
    isContained(node: BaseNode.Class): boolean {
        return this.getContainer(node) !== undefined;
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
        // TODO doesn't deal very well with self-edges in clusters
        const dot = Dot.edge(edge.source.id, edge.target.id, this.getEdgeAttrs(edge));
        if (this.isContainer(edge.target)) {
            dot.attr("lhead", "cluster_" + edge.target.id);
        }
        if (this.isContainer(edge.source)) {
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
    clusterNodeToDot(node: BaseNode.Class): DotSubgraph {
        const dot = Dot.subgraph("cluster_" + node.id)
            .graphAttrs(this.getNodeAttrs(node))
            .node(node.id, { shape: "point", style: "invis" });

        for (const subnode of this.containedNodes(node)) {
            if (this.isContainer(subnode)) {
                dot.statements(this.clusterNodeToDot(subnode));
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
    toDot(graph: G): DotGraph {
        const dot = Dot.graph().graphAttr("compound", "true");

        for (const node of graph.nodes.filter((node) => !this.isContained(node))) {
            if (this.isContainer(node)) {
                dot.statements(this.clusterNodeToDot(node));
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
