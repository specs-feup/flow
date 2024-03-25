import BaseNode from "clava-flow/graph/BaseNode";
import WithId from "clava-flow/graph/WithId";
import { Joinpoint } from "clava-js/api/Joinpoints.js";

namespace FlowNode {
    export class Class<
        D extends WithId<Data> = WithId<Data>,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {}

    export function build(
        $jp: Joinpoint,
        type: Type,
        id?: string,
    ): BaseNode.AbstractBuilder<Data, ScratchData, FlowNode.Class> {
        const s = BaseNode.build(id);
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

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: WithId<BaseNode.Data>): data is WithId<Data> {
            if (!BaseNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as WithId<Data>;
            if (!(d.flowNodeType in Type)) return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!BaseNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            const s = scratchData as ScratchData;
            if (!(s.$jp instanceof Joinpoint)) return false;
            return true;
        },
    };

    export interface Data extends BaseNode.Data {
        flowNodeType: Type;
    }

    export interface ScratchData extends BaseNode.ScratchData {
        $jp: Joinpoint;
    }

    // ------------------------------------------------------------

    export enum Type {
        INSTRUCTION = "instruction",
        CONDITION = "condition",
    }
}

export default FlowNode;
