import ControlFlowEdge from "clava-flow/flow/edge/ControlFlowEdge";
import FlowNode from "clava-flow/flow/node/FlowNode";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { Joinpoint, Vardecl } from "clava-js/api/Joinpoints.js";

namespace LivenessNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
        > extends FlowNode.Class<D, S> {
        get defs(): Set<Vardecl> {
            return this.scratchData.liveness.defs;
        }

        set defs(defs: Set<Vardecl>) {
            this.scratchData.liveness.defs = defs;
        }

        get uses(): Set<Vardecl> {
            return this.scratchData.liveness.uses;
        }

        set uses(uses: Set<Vardecl>) {
            this.scratchData.liveness.uses = uses;
        }

        get liveIn(): Set<Vardecl> {
            return this.scratchData.liveness.liveIn;
        }

        set liveIn(liveIn: Set<Vardecl>) {
            this.scratchData.liveness.liveIn = liveIn;
        }

        get liveOut(): Set<Vardecl> {
            return this.scratchData.liveness.liveOut;
        }

        set liveOut(liveOut: Set<Vardecl>) {
            this.scratchData.liveness.liveOut = liveOut;
        }
    }

    export class Builder
        extends BaseNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        override buildData(data: BaseNode.Data): Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) {
                throw new Error("Liveness Node can only be built from a FlowNode.");
            }

            return {
                ...data,
                ...super.buildData(data),
            };
        }

        override buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) {
                throw new Error("Liveness Node can only be built from a FlowNode.");
            }
            
            return {
                ...scratchData,
                ...super.buildScratchData(scratchData),
                liveness: {
                    defs: new Set(),
                    uses: new Set(),
                    liveIn: new Set(),
                    liveOut: new Set(),
                },
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            const s = scratchData as ScratchData;
            if (s.liveness === undefined) return false;
            if (!(s.liveness.defs instanceof Set)) return false;
            if (!(s.liveness.uses instanceof Set)) return false;
            if (!(s.liveness.liveIn instanceof Set)) return false;
            if (!(s.liveness.liveOut instanceof Set)) return false;
            return true;
        },
    };

    export interface Data extends BaseNode.Data, FlowNode.Data {}

    export interface ScratchData extends BaseNode.ScratchData, FlowNode.ScratchData {
        liveness: {
            defs: Set<Vardecl>;
            uses: Set<Vardecl>;
            liveIn: Set<Vardecl>;
            liveOut: Set<Vardecl>;
        };
    }
}

export default LivenessNode;
