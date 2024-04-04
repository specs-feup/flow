import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import BaseGraph from "clava-flow/graph/BaseGraph";
import StatementNode from "clava-flow/flow/node/instruction/StatementNode";
import { Joinpoint, Statement } from "clava-js/api/Joinpoints.js";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";
import UnknownInstructionNode from "clava-flow/flow/node/instruction/UnknownInstructionNode";
import FlowNode from "clava-flow/flow/node/FlowNode";
import ScopeStartNode from "clava-flow/flow/node/instruction/ScopeStartNode";
import ScopeEndNode from "clava-flow/flow/node/instruction/ScopeEndNode";
import BaseNode from "clava-flow/graph/BaseNode";


export type GraphConstructor<
    D extends BaseGraph.Data,
    S extends BaseGraph.ScratchData,
    G extends BaseGraph.Class<D, S>,
> = new (node: cytoscape.Core, _d: D, _sd: S) => G;

export interface GraphBuilder<D extends BaseGraph.Data, S extends BaseGraph.ScratchData> {
    buildData(data: BaseGraph.Data): D;
    buildScratchData(scratchData: BaseGraph.ScratchData): S;
}

export interface GraphTypeGuard<D extends BaseGraph.Data, S extends BaseGraph.ScratchData> {
    isDataCompatible(data: BaseGraph.Data): data is D;
    isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is S;
}

namespace Graph {
    export const scratchNamespace = "_clava_flow";

    export function create(): BaseGraph.Class {
        return new BaseGraph.Class(cytoscape({}));
    }

    export function fromCy(graph: cytoscape.Core): BaseGraph.Class {
        return new BaseGraph.Class(graph);
    }
}

export default Graph;
