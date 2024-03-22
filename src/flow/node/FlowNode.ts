// Replace FlowNode with node class name

import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";


class FlowNode<
    D extends WithId<FlowNode.Data> = WithId<FlowNode.Data>,
    S extends FlowNode.ScratchData = FlowNode.ScratchData,
> extends Node<D, S> {}

namespace FlowNode {
    export enum Type {
        INSTRUCTION = "instruction",
        CONDITION = "condition",
    }

    export interface Data extends Node.Data {
        flowNodeType: Type;
        jpAstId: string;
    }

    export interface ScratchData extends Node.ScratchData {}
}

export default FlowNode;
