import Node from "clava-flow/graph/Node";


export interface FlowNodeData extends Node.Data {
    flowNodeType: FlowNodeType;
}

export interface ConditionNodeData extends FlowNodeData {
    flowNodeType: FlowNodeType.CONDITION;
    ifTrueEdgeId: string;
    ifFalseEdgeId: string;
}

export enum FlowNodeType {
    FUNCTION_ENTRY = 'function_entry',
    FUNCTION_EXIT = 'function_exit',
    SCOPE_ENTRY = 'scope_entry',
    SCOPE_EXIT = 'scope_exit',
    INSTRUCTION = 'instruction',
    CONDITION = 'condition',
}

