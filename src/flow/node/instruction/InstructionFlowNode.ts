import FlowNode from "clava-flow/flow/node/FlowNode";
import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";


namespace InstructionFlowNode {
    export class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {}
    
    export function build(
        $jp: Joinpoint,
        type: Type,
        id?: string,
    ): Node.Builder<Data, ScratchData, InstructionFlowNode.Class> {
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
            className: InstructionFlowNode.Class,
        };
    }

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

export default InstructionFlowNode;
