import FlowEdge from "clava-flow/flow/edge/FlowEdge";
import BaseEdge from "clava-flow/graph/BaseEdge";
import { EdgeBuilder, EdgeTypeGuard } from "clava-flow/graph/Edge";


namespace ControlFlowEdge {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FlowEdge.Class<D, S> {}

    export class Builder
        extends FlowEdge.Builder
        implements EdgeBuilder<Data, ScratchData>
    {
        constructor() {
            super(FlowEdge.Type.CONTROL_FLOW);
        }

        buildData(data: BaseEdge.Data): Data {
            return {
                ...(super.buildData(data) as FlowEdge.Data & { flowEdgeType: FlowEdge.Type.CONTROL_FLOW; }),
            };
        }

        buildScratchData(scratchData: BaseEdge.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
            };
        }
    }

    export const TypeGuard: EdgeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseEdge.Data): data is Data {
            if (!FlowEdge.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (d.flowEdgeType !== FlowEdge.Type.CONTROL_FLOW) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseEdge.ScratchData,
        ): scratchData is ScratchData {
            if (!FlowEdge.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            return true;
        },
    };

    export interface Data extends FlowEdge.Data {
        flowEdgeType: FlowEdge.Type.CONTROL_FLOW;
    }

    export interface ScratchData extends FlowEdge.ScratchData {}
}

export default ControlFlowEdge;
