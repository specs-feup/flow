import ControlFlowEdge from "clava-flow/flow/edge/ControlFlowEdge";
import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseEdge from "clava-flow/graph/BaseEdge";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { Joinpoint } from "clava-js/api/Joinpoints.js";

namespace ConditionNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {
        get trueEdge(): ControlFlowEdge.Class {
            // Data and scratchdata should be ControlFlowEdge
            const edge = this.graph.getEdgeById(this.data.trueEdgeId)! as BaseEdge.Class<
                ControlFlowEdge.Data,
                ControlFlowEdge.ScratchData
            >;
            return edge.as(ControlFlowEdge.Class);
        }

        get trueNode(): BaseNode.Class {
            return this.trueEdge.target;
        }

        get falseEdge(): ControlFlowEdge.Class {
            // Data and scratchdata should be ControlFlowEdge
            const edge = this.graph.getEdgeById(this.data.falseEdgeId)! as BaseEdge.Class<
                ControlFlowEdge.Data,
                ControlFlowEdge.ScratchData
            >;
            return edge.as(ControlFlowEdge.Class);
        }

        get falseNode(): BaseNode.Class {
            return this.falseEdge.target;
        }

        override get jp(): Joinpoint {
            return this.scratchData.$jp;
        }
    }

    export class Builder
        extends FlowNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        #truePath: ControlFlowEdge.Class;
        #falsePath: ControlFlowEdge.Class;

        constructor($jp: Joinpoint, truePath: ControlFlowEdge.Class, falsePath: ControlFlowEdge.Class) {
            super(FlowNode.Type.CONDITION, $jp);
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
                ...super.buildScratchData(scratchData) as FlowNode.ScratchData & { $jp: Joinpoint },
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (d.flowNodeType !== FlowNode.Type.CONDITION) return false;
            if (typeof d.trueEdgeId !== "string") return false;
            if (typeof d.falseEdgeId !== "string") return false;
            return true;
        },

        isScratchDataCompatible(scratchData: BaseNode.ScratchData): scratchData is ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            if (!(scratchData.$jp instanceof Joinpoint)) return false;
            return true;
        },
    };

    export interface Data extends FlowNode.Data {
        trueEdgeId: string;
        falseEdgeId: string;
        flowNodeType: FlowNode.Type.CONDITION;
    }

    export interface ScratchData extends FlowNode.ScratchData {
        $jp: Joinpoint;
    }
}

export default ConditionNode;
