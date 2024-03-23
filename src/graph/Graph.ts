import DotFormatter from "clava-flow/dot/DotFormatter";
import Edge from "clava-flow/graph/Edge";
import Node from "clava-flow/graph/Node";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import Io from "lara-js/api/lara/Io.js";
import { JavaClasses } from "lara-js/api/lara/util/JavaTypes.js";
import WithId from "clava-flow/graph/WithId";

class Graph<
    D extends Graph.Data = Graph.Data,
    S extends Graph.ScratchData = Graph.ScratchData,
> {
    static scratchNamespace = "_clava_flow";

    #graph: cytoscape.Core;

    constructor(graph?: cytoscape.Core) {
        this.#graph = graph ?? cytoscape({});
    }

    get data(): D {
        return this.#graph.data();
    }

    get scratchData(): S {
        return this.#graph.scratch(Graph.scratchNamespace);
    }

    addNode<
        D extends Node.Data,
        S extends Node.ScratchData,
        N extends Node.Class<WithId<D>, S>,
    >(node: Node.Builder<D, S, N>): N {
        const newNode = this.#graph.add({ group: "nodes", data: node.data });
        newNode.scratch(Graph.scratchNamespace, node.scratchData);
        return new node.className(this, newNode);
    }

    addEdge<
        D extends Edge.Data,
        S extends Edge.ScratchData,
        E extends Edge<WithId<D>, S>,
    >(edge: Edge.Builder<D, S, E>): E {
        const newEdge = this.#graph.add({ group: "edges", data: edge.data });
        newEdge.scratch(Graph.scratchNamespace, edge.scratchData);
        return new edge.className(this, newEdge);
    }

    // TODO
    get nodes(): Node.Class[] {
        return this.#graph.nodes().map((node) => new Node.Class(this, node));
    }

    // TODO
    get edges(): Edge[] {
        return this.#graph.edges().map((edge) => new Edge(this, edge));
    }

    toDot(dotFormatter: DotFormatter, label?: string): string {
        return dotFormatter.format(this, label);
    }

    toDotFile(
        dotFormatter: DotFormatter,
        filename: string,
        label?: string,
    ): JavaClasses.File {
        return Io.writeFile(filename, this.toDot(dotFormatter, label));
    }

    toCy(): cytoscape.Core {
        return this.#graph;
    }
}

namespace Graph {
    export interface Data {}

    export interface ScratchData {}
}

export default Graph;
