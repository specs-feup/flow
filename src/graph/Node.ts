import Edge from "clava-flow/graph/Edge";
import Graph from "clava-flow/graph/Graph";
import WithId from "clava-flow/graph/WithId";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";


namespace Node {
    export class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > {
        #graph: Graph;
        #node: cytoscape.NodeSingular;

        constructor(graph: Graph, node: cytoscape.NodeSingular) {
            this.#graph = graph;
            this.#node = node;
        }

        get data(): D {
            return this.#node.data();
        }

        get scratchData(): S {
            return this.#node.scratch(Graph.scratchNamespace);
        }

        get id(): string {
            return this.#node.id();
        }

        // get incomers(): Edge[] {
        //     return this.#node
        //         .incomers()
        //         .edges()
        //         .map((edge) => new Edge(this.#graph, edge));
        // }

        // get outgoers(): Edge[] {
        //     return this.#node
        //         .outgoers()
        //         .edges()
        //         .map((edge) => new Edge(this.#graph, edge));
        // }

        // indegree(includeLoops: boolean = true): number {
        //     return this.#node.indegree(includeLoops);
        // }

        // outdegree(includeLoops: boolean = true): number {
        //     return this.#node.outdegree(includeLoops);
        // }

        // /**
        //  * Removes the node from the graph. Before removing the node, creates connections between all connecting sources and targets.
        //  *
        //  * @param node -
        //  * @param edgeMap - function that receives the incoming edge and the outgoing edge, and returns a new EdgeData that replaces both edges
        //  */
        // remove(keepEdges: boolean) {
        //     if (keepEdges) {
        //         for (const incoming of this.incomers) {
        //             for (const outgoing of this.outgoers) {
        //                 this.#graph.addEdge(incoming.source, outgoing.target);
        //             }
        //         }
        //     }

        //     this.#node.remove();
        // }

        // /**
        //  * @returns True if the outdegree (number of edges with this node as source) is zero, false otherwise. By default, if a node has a connection to itself (loop) it is not considered a leaf
        //  */
        // isLeaf(loopsAreLeafs: boolean = false): boolean {
        //     return this.#node.outdegree(!loopsAreLeafs) === 0;
        // }

        toCy(): cytoscape.NodeSingular {
            return this.#node;
        }
    }

    // Override in subclasses
    export function build(id?: string): Builder<Data, ScratchData, Node.Class> {
        return {
            data: { id },
            scratchData: {},
            className: Node.Class,
        };
    }

    // Override in subclasses
    export interface Data {
        id: string | undefined;
    }

    // Override in subclasses
    export interface ScratchData { }
    
    // ------------------------------------------------------------

    export interface Builder<
        D extends Data,
        S extends ScratchData,
        N extends Node.Class<WithId<D>, S>,
    > {
        data: D;
        scratchData: S;
        className: new (graph: Graph, node: cytoscape.NodeSingular) => N;
    }

    export interface AbstractBuilder<
        D extends Data,
        S extends ScratchData,
        N extends Node.Class<WithId<D>, S>,
    > {
        data: D;
        scratchData: S;
        className: abstract new (graph: Graph, node: cytoscape.NodeSingular) => N;
    }
}

export default Node;
