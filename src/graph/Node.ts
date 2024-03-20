import Edge from "clava-flow/graph/Edge";
import Graph from "clava-flow/graph/Graph";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";


class Node {
    #graph: Graph;
    #node: cytoscape.NodeSingular;

    constructor(graph: Graph, node: cytoscape.NodeSingular) {
        this.#graph = graph;
        this.#node = node;
    }

    static build(id?: string): Node.Builder {
        return {
            data: { id },
        };
    }

    get id(): string {
        return this.#node.id();
    }

    get data(): Node.Data {
        return this.#node.data();
    }

    updateData(data: Record<string, unknown>) {
        this.#node.data(data);
    }

    get scratchData(): Node.ScratchData {
        return this.#node.scratch(Graph.scratchNamespace);
    }

    updateScratchData(data: Record<string, unknown>) {
        this.#node.scratch(Graph.scratchNamespace, data);
    }

    get incomers(): Edge[] {
        return this.#node
            .incomers()
            .edges()
            .map((edge) => new Edge(this.#graph, edge));
    }

    get outgoers(): Edge[] {
        return this.#node
            .outgoers()
            .edges()
            .map((edge) => new Edge(this.#graph, edge));
    }

    indegree(includeLoops: boolean = true): number {
        return this.#node.indegree(includeLoops);
    }

    outdegree(includeLoops: boolean = true): number {
        return this.#node.outdegree(includeLoops);
    }

    /**
     * Removes the node from the graph. Before removing the node, creates connections between all connecting sources and targets.
     *
     * @param node -
     * @param edgeMap - function that receives the incoming edge and the outgoing edge, and returns a new EdgeData that replaces both edges
     */
    remove(keepEdges: boolean) {
        if (keepEdges) {
            for (const incoming of this.incomers) {
                for (const outgoing of this.outgoers) {
                    this.#graph.addEdge(incoming.source, outgoing.target);
                }
            }
        }

        this.#node.remove();
    }

    /**
     * @returns True if the outdegree (number of edges with this node as source) is zero, false otherwise. By default, if a node has a connection to itself (loop) it is not considered a leaf
     */
    isLeaf(loopsAreLeafs: boolean = false): boolean {
        return this.#node.outdegree(!loopsAreLeafs) === 0;
    }

    toCy(): cytoscape.NodeSingular {
        return this.#node;
    }
}

namespace Node {
    export interface Data {
        id: string;
        [key: string]: unknown;
    }

    export interface ScratchData {
        [key: string]: unknown;
    }

    export interface Builder {
        data: Record<string, unknown>;
    }
}

export default Node;
