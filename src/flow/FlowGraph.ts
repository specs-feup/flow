import FlowGraphGenerator from "clava-flow/flow/builder/FlowGraphBuilder";
import ControlFlowEdge from "clava-flow/flow/edge/ControlFlowEdge";
import FunctionEntryNode from "clava-flow/flow/node/instruction/FunctionEntryNode";
import FunctionExitNode from "clava-flow/flow/node/instruction/FunctionExitNode";
import ScopeEndNode from "clava-flow/flow/node/instruction/ScopeEndNode";
import ScopeStartNode from "clava-flow/flow/node/instruction/ScopeStartNode";
import BaseGraph from "clava-flow/graph/BaseGraph";
import Graph, { GraphBuilder, GraphTypeGuard } from "clava-flow/graph/Graph";
import { FunctionJp, Joinpoint, Scope, Statement } from "clava-js/api/Joinpoints.js";


namespace FlowGraph {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> extends BaseGraph.Class<D, S> {
        
        addFunctionPair($jp: FunctionJp): [FunctionEntryNode.Class, FunctionExitNode.Class] {
            const function_entry = this.addNode().init(new FunctionEntryNode.Builder($jp)).as(FunctionEntryNode.Class);
            const function_exit = this.addNode().init(new FunctionExitNode.Builder($jp)).as(FunctionExitNode.Class);
            this.addEdge(function_entry, function_exit).init(new ControlFlowEdge.Builder);
            
            return [function_entry, function_exit];
        }

        addScopePair($jp: Scope): [ScopeStartNode.Class, ScopeEndNode.Class] {
            const scope_start = this.addNode().init(new ScopeStartNode.Builder($jp)).as(ScopeStartNode.Class);
            const scope_end = this.addNode().init(new ScopeEndNode.Builder($jp)).as(ScopeEndNode.Class);
            this.addEdge(scope_start, scope_end).init(new ControlFlowEdge.Builder);

            return [scope_start, scope_end];
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
        const flowGraph = (graph ?? Graph.create()).init(new FlowGraph.Builder).as(FlowGraph.Class);
        return new FlowGraphGenerator($jp, flowGraph).build();
    }
}

export default FlowGraph;
