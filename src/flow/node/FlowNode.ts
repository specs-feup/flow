import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";


namespace FlowNode {
    export abstract class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > extends Node.Class<D, S> {}

    export function build(
        $jp: Joinpoint,
        type: Type,
        id?: string,
    ): Node.AbstractBuilder<Data, ScratchData, FlowNode.Class> {
        const s = Node.build(id);
        return {
            data: {
                ...s.data,
                jpAstId: $jp.astId,
                flowNodeType: type,
            },
            scratchData: {
                ...s.scratchData,
            },
            className: FlowNode.Class,
        };
    }

    export interface Data extends Node.Data {
        flowNodeType: Type;
        jpAstId: string;
    }

    export interface ScratchData extends Node.ScratchData {}

    // ------------------------------------------------------------

    export enum Type {
        INSTRUCTION = "instruction",
        CONDITION = "condition",
    }
}

export default FlowNode;
