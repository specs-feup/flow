import Graph from "clava-flow/graph/Graph";
import BaseNode from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

class Edge<
    D extends WithId<Edge.Data> = WithId<Edge.Data>,
    S extends Edge.ScratchData = Edge.ScratchData,
> {
    #graph: Graph;
    #edge: cytoscape.EdgeSingular;

    constructor(graph: Graph, edge: cytoscape.EdgeSingular) {
        this.#graph = graph;
        this.#edge = edge;
    }

    // Override in subclasses
    static build(
        source: BaseNode.Class,
        target: BaseNode.Class,
        id?: string,
    ): Edge.Builder<Edge.Data, Edge.ScratchData, Edge> {
        return {
            data: {
                id: id,
                source: source.id,
                target: target.id,
            },
            scratchData: {},
            className: this,
        };
    }

    get data(): D {
        return this.#edge.data();
    }

    get scratchData(): S {
        return this.#edge.scratch(Graph.scratchNamespace);
    }

    get id(): string {
        return this.#edge.id();
    }

    get source(): BaseNode.Class {
        return new BaseNode.Class(this.#graph, this.#edge.source());
    }

    set source(node: BaseNode.Class) {
        this.#edge.move({ source: node.id });
    }

    get target(): BaseNode.Class {
        return new BaseNode.Class(this.#graph, this.#edge.target());
    }

    set target(node: BaseNode.Class) {
        this.#edge.move({ target: node.id });
    }

    toCy(): cytoscape.EdgeSingular {
        return this.#edge;
    }
}

namespace Edge {
    export interface Builder<
        D extends Data,
        S extends ScratchData,
        E extends Edge<WithId<D>, S>,
    > {
        data: D;
        scratchData: S;
        className: new (graph: Graph, edge: cytoscape.EdgeSingular) => E;
    }

    // Override in subclasses
    export interface Data {
        id: string | undefined;
        source: string;
        target: string;
    }

    // Override in subclasses
    export interface ScratchData {}
}

export default Edge;
