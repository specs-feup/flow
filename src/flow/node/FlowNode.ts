import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeConstructor, NodeTypeGuard } from "clava-flow/graph/Node";
import { Joinpoint } from "clava-js/api/Joinpoints.js";

namespace FlowNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {}

    export abstract class Builder
        extends BaseNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        #$jp: Joinpoint;
        #flowNodeType: Type;

        constructor($jp: Joinpoint, type: Type) {
            super();
            this.#$jp = $jp;
            this.#flowNodeType = type;
        }

        override buildData(data: BaseNode.Data): Data {
            return {
                ...super.buildData(data),
                flowNodeType: this.#flowNodeType,
            };
        }

        override buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
                $jp: this.#$jp,
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!BaseNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
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
