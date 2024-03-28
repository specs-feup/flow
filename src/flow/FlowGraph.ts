import FlowGraphGenerator from "clava-flow/flow/builder/FlowGraphBuilder";
import BaseGraph from "clava-flow/graph/BaseGraph";
import Graph, { GraphBuilder, GraphTypeGuard } from "clava-flow/graph/Graph";
import { Joinpoint, Statement } from "clava-js/api/Joinpoints.js";


namespace FlowGraph {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData>  extends BaseGraph.Class<D, S> {
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

    export class Builder extends BaseGraph.Builder implements GraphBuilder<Data, ScratchData> {
        override buildData(data: BaseGraph.Data): Data {
            return {
                ...super.buildData(data),
            };
        }

        override buildScratchData(scratchData: BaseGraph.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
            };
        }
    }

    export const TypeGuard: GraphTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseGraph.Data): data is Data {
            if (!BaseGraph.TypeGuard.isDataCompatible(data)) return false;
            return true;
        },

        isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is ScratchData {
            if (!BaseGraph.TypeGuard.isScratchDataCompatible(sData)) return false;
            return true;
        },
    };

    export interface Data extends BaseGraph.Data {}

    export interface ScratchData extends BaseGraph.Data { }
    
    // ---------------------

    export function generate($jp: Joinpoint, graph?: BaseGraph.Class): FlowGraph.Class {
        const flowGraph = (graph ?? Graph.create()).init(new FlowGraph.Builder);
        return new FlowGraphGenerator($jp, flowGraph).build();
    }
}

export default FlowGraph;
