import FlowNode from "clava-flow/flow/node/FlowNode";
import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";


namespace ConditionFlowNode {
    export class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {}

    export function build(
        $jp: Joinpoint,
        id?: string,
    ): Node.Builder<Data, ScratchData, ConditionFlowNode.Class> {
        const s = FlowNode.build($jp, FlowNode.Type.CONDITION, id);
        return {
            data: {
                ...s.data,
                flowNodeType: FlowNode.Type.CONDITION,
            },
            scratchData: {
                ...s.scratchData,
            },
            className: ConditionFlowNode.Class,
        };
    }

    export interface Data extends FlowNode.Data {
        // trueEdgeId: string;
        // falseEdgeId: string;
        flowNodeType: FlowNode.Type.CONDITION;
    }

    export interface ScratchData extends FlowNode.ScratchData {}
}

export default ConditionFlowNode;
