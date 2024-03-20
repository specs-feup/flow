import DotFormatter from "clava-flow/dot/DotFormatter";
import Edge from "clava-flow/graph/Edge";
import Node from "clava-flow/graph/Node";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import Io from "lara-js/api/lara/Io.js";
import { JavaClasses } from "lara-js/api/lara/util/JavaTypes.js";


class Graph {
    static scratchNamespace = "_clava_flow";

    #graph: cytoscape.Core;

    constructor(graph?: cytoscape.Core) {
        this.#graph = graph ?? cytoscape({});
    }

    get data(): Graph.Data {
        return this.#graph.data();
    }

    updateData(data: Record<string, unknown>) {
        this.#graph.data(data);
    }

    get scratchData(): Graph.ScratchData {
        return this.#graph.scratch(Graph.scratchNamespace);
    }

    updateScratchData(data: Record<string, unknown>) {
        this.#graph.scratch(Graph.scratchNamespace, data);
    }

    addNode(node: Node.Builder): Node {
        return new Node(this, this.#graph.add({ group: "nodes", data: node.data }));
    }

    addEdge(edge: Edge.Builder): Edge {
        return new Edge(this, this.#graph.add({ group: "edges", data: edge.data }));
    }

    // TODO
    get nodes() {
        return this.#graph.nodes().map((node) => new Node(this, node));
    }

    // TODO
    get edges() {
        return this.#graph.edges().map((edge) => new Edge(this, edge));
    }

    toDot(dotFormatter: DotFormatter, label?: string): string {
        return dotFormatter.format(this, label);
    }

    toDotFile(dotFormatter: DotFormatter, filename: string, label?: string): JavaClasses.File {
        return Io.writeFile(filename, this.toDot(dotFormatter, label));
    }

    toCy(): cytoscape.Core {
        return this.#graph;
    }
}

namespace Graph {
    export interface Data {
        [key: string]: unknown;
    }

    export interface ScratchData {
        [key: string]: unknown;
    }
}

export default Graph;
