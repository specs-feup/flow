import DotFormatter from "clava-flow/dot/DotFormatter";
import Edge from "clava-flow/graph/Edge";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import Io from "lara-js/api/lara/Io.js";
import { JavaClasses } from "lara-js/api/lara/util/JavaTypes.js";
import BaseNode from "clava-flow/graph/BaseNode";
import BaseEdge from "clava-flow/graph/BaseEdge";

class Graph<
    D extends Graph.Data = Graph.Data,
    S extends Graph.ScratchData = Graph.ScratchData,
> {
    static scratchNamespace = "_clava_flow";

    #graph: cytoscape.Core;

    // TODO: change; add .is .as .init; create static Graph.new() method to create new graph; create Graph.fromCy() method to create graph from cytoscape.Core
    constructor(graph?: cytoscape.Core) {
        this.#graph = graph ?? cytoscape({});
    }

    get data(): D {
        return this.#graph.data();
    }

    get scratchData(): S {
        return this.#graph.scratch(Graph.scratchNamespace);
    }

    addNode(id?: string): BaseNode.Class {
        const newNode = this.#graph.add({
            group: "nodes",
            data: { id },
        });
        return new BaseNode.Class(this, newNode);
    }

    addEdge(source: BaseNode.Class, target: BaseNode.Class, id?: string): BaseEdge.Class {
        const newEdge = this.#graph.add({
            group: "edges",
            data: { id, source: source.id, target: target.id },
        });
        return new BaseEdge.Class(this, newEdge);
    }

    // TODO
    get nodes(): BaseNode.Class[] {
        return this.#graph.nodes().map((node) => new BaseNode.Class(this, node));
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
