import FlowNode from "clava-flow/flow/node/FlowNode";
import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";


namespace InstructionNode {
    export class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {
        static isDataCompatible(data: Node.Data): data is Data {
            return true;
        }
    }
    
    export function build(
        $jp: Joinpoint,
        type: Type,
        id?: string,
    ): Node.Builder<Data, ScratchData, InstructionNode.Class> {
        const s = FlowNode.build($jp, FlowNode.Type.INSTRUCTION, id);
        return {
            data: {
                ...s.data,
                flowNodeType: FlowNode.Type.INSTRUCTION,
                instructionFlowNodeType: type,
            },
            scratchData: {
                ...s.scratchData,
            },
            className: InstructionNode.Class,
        };
    }

    export const TypeGuard: Node.TypeGuarder<Data, ScratchData> = {
        isDataCompatible(data: WithId<Node.Data>): data is WithId<Data> {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as WithId<Data>;
            if (!(d.flowNodeType !== FlowNode.Type.INSTRUCTION)) return false;
            if (!(d.instructionFlowNodeType in Type)) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: Node.ScratchData,
        ): scratchData is ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            return true;
        },
    };

    export interface Data extends FlowNode.Data {
        flowNodeType: FlowNode.Type.INSTRUCTION;
        instructionFlowNodeType: Type;
    }

    export interface ScratchData extends FlowNode.ScratchData {}

    // ------------------------------------------------------------

    export enum Type {
        FUNCTION_ENTRY = "function_entry",
        FUNCTION_EXIT = "function_exit",
        SCOPE_START = "scope_start",
        SCOPE_END = "scope_end",
        STATEMENT = "statement",
        COMMENT = "comment",
    }
}

export default InstructionNode;
