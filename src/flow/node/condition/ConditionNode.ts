import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseNode from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";

namespace ConditionNode {
    export class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {}

    export function build(
        $jp: Joinpoint,
        id?: string,
    ): BaseNode.Builder<Data, ScratchData, ConditionNode.Class> {
        const s = FlowNode.build($jp, FlowNode.Type.CONDITION, id);
        return {
            data: {
                ...s.data,
                flowNodeType: FlowNode.Type.CONDITION,
            },
            scratchData: {
                ...s.scratchData,
            },
            className: ConditionNode.Class,
        };
    }

    export interface Data extends FlowNode.Data {
        trueEdgeId: string;
        // falseEdgeId: string;
        // flowNodeType: FlowNode.Type.CONDITION;
    }

    export interface ScratchData extends FlowNode.ScratchData {}
}

export default ConditionNode;
