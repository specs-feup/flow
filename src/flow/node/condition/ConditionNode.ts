import ControlFlowEdge from "clava-flow/flow/edge/ControlFlowEdge";
import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { Joinpoint } from "clava-js/api/Joinpoints.js";

namespace ConditionNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {}

    export class Builder
        extends FlowNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        #truePath: ControlFlowEdge.Class;
        #falsePath: ControlFlowEdge.Class;

        constructor($jp: Joinpoint, truePath: ControlFlowEdge.Class, falsePath: ControlFlowEdge.Class) {
            super($jp, FlowNode.Type.CONDITION);
            this.#truePath = truePath;
            this.#falsePath = falsePath;
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...(super.buildData(data) as FlowNode.Data & {
                    flowNodeType: FlowNode.Type.CONDITION;
                }),
                trueEdgeId: this.#truePath.id,
                falseEdgeId: this.#falsePath.id,
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (!(d.flowNodeType !== FlowNode.Type.CONDITION)) return false;
            if (!(typeof d.trueEdgeId === "string")) return false;
            if (!(typeof d.falseEdgeId === "string")) return false;
            return true;
        },

        isScratchDataCompatible(scratchData: BaseNode.ScratchData): scratchData is ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            return true;
        },
    };

    export interface Data extends FlowNode.Data {
        trueEdgeId: string;
        falseEdgeId: string;
        flowNodeType: FlowNode.Type.CONDITION;
    }

    export interface ScratchData extends FlowNode.ScratchData {}
}

export default ConditionNode;
