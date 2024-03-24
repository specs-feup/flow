import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";


namespace FlowNode {
    export class Class<
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
                flowNodeType: type,
            },
            scratchData: {
                ...s.scratchData,
                $jp: $jp,
            },
            className: FlowNode.Class,
        };
    }

    export const TypeGuard: Node.TypeGuarder<Data, ScratchData> = {
        isDataCompatible(data: WithId<Node.Data>): data is WithId<Data> {
            if (!Node.TypeGuard.isDataCompatible(data)) return false;
            const d = data as WithId<Data>;
            if (!(d.flowNodeType in Type)) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: Node.ScratchData,
        ): scratchData is ScratchData {
            if (!Node.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            const s = scratchData as ScratchData;
            if (!(s.$jp instanceof Joinpoint)) return false;
            return true;
        },
    };

    export interface Data extends Node.Data {
        flowNodeType: Type;
    }

    export interface ScratchData extends Node.ScratchData {
        $jp: Joinpoint;
    }

    // ------------------------------------------------------------

    export enum Type {
        INSTRUCTION = "instruction",
        CONDITION = "condition",
    }
}

export default FlowNode;
