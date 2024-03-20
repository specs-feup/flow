import Graph from "clava-flow/graph/Graph";
import Node from "clava-flow/graph/Node";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

class Edge {
    #graph: Graph;
    #edge: cytoscape.EdgeSingular;

    constructor(graph: Graph, edge: cytoscape.EdgeSingular) {
        this.#graph = graph;
        this.#edge = edge;
    }

    static build(source: Node, target: Node, id?: string): Edge.Builder {
        return {
            data: { 
                id: id,
                source: source.id,
                target: target.id,
            },
        };
    }

    get data(): Edge.Data {
        return this.#edge.data();
    }

    updateData(data: Record<string, unknown>) {
        this.#edge.data(data);
    }

    get scratchData(): Edge.ScratchData {
        return this.#edge.scratch(Graph.scratchNamespace);
    }

    updateScratchData(data: Record<string, unknown>) {
        this.#edge.scratch(Graph.scratchNamespace, data);
    }

    get source(): Node {
        return new Node(this.#graph, this.#edge.source());
    }

    set source(node: Node) {
        this.#edge.data("source", node.id);
    }

    get target(): Node {
        return new Node(this.#graph, this.#edge.target());
    }

    set target(node: Node) {
        this.#edge.data("target", node.id);
    }

    get id(): string {
        return this.#edge.id();
    }

    toCy(): cytoscape.EdgeSingular {
        return this.#edge;
    }
}

namespace Edge {
    export interface Data extends Builder {
        id: string;
        source: string;
        target: string;
        [key: string]: unknown;
    }

    export interface ScratchData {
        [key: string]: unknown;
    }

    export interface Builder {
        data: Record<string, unknown>;
    }
}

export default Edge;
