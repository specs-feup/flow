// Replace FlowNode with node class name

import FlowNode from "clava-flow/flow/node/FlowNode";
import WithId from "clava-flow/graph/WithId";


class ConditionFlowNode<
    D extends WithId<ConditionFlowNode.Data> = WithId<ConditionFlowNode.Data>,
    S extends ConditionFlowNode.ScratchData = ConditionFlowNode.ScratchData,
> extends FlowNode<D, S> {}

namespace ConditionFlowNode {
    export interface Data extends FlowNode.Data {
        trueEdgeId: string;
        falseEdgeId: string;
    }

    export interface ScratchData extends FlowNode.ScratchData {}
}

export default ConditionFlowNode;
