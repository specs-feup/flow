// Replace FlowNode with node class name

import FlowNode from "clava-flow/flow/node/FlowNode";
import WithId from "clava-flow/graph/WithId";


class InstructionFlowNode<
    D extends WithId<InstructionFlowNode.Data> = WithId<InstructionFlowNode.Data>,
    S extends InstructionFlowNode.ScratchData = InstructionFlowNode.ScratchData,
> extends FlowNode<D, S> {}

namespace InstructionFlowNode {
    export enum InstructionType {
        FUNCTION_ENTRY = "function_entry",
        FUNCTION_EXIT = "function_exit",
        SCOPE_START = "scope_start",
        SCOPE_END = "scope_end",
        STATEMENT = "statement",
        COMMENT = "comment",
    }

    export interface Data extends FlowNode.Data {
        instructionFlowNodeType: InstructionType;
    }

    export interface ScratchData extends FlowNode.ScratchData {}
}

export default InstructionFlowNode;
