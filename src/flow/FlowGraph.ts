import FlowGraphBuilder from "clava-flow/flow/FlowGraphBuilder";
import Graph from "clava-flow/graph/Graph";
import { Joinpoint, Statement } from "clava-js/api/Joinpoints.js";

export default class FlowGraph extends Graph {
    constructor(graph?: Graph) {
        super(graph?.toCy());
    }

    static build($jp: Joinpoint): FlowGraph {
        return new FlowGraphBuilder($jp).build();
    }

    // /**
    //  * Returns the graph node where the given statement belongs.
    //  *
    //  * @param $stmt - A statement join point, or a string with the astId of the join point
    //  */
    // getNode($stmt: Statement | string) {
    //     // If string, assume it is astId
    //     const astId: string = typeof $stmt === "string" ? $stmt : $stmt.astId;

    //     return this.#nodes.get(astId);
    // }
}
