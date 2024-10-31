import BaseEdge from "@specs-feup/lara-flow/graph/BaseEdge";
import Edge from "@specs-feup/lara-flow/graph/Edge";

namespace CallEdge {
    export const TAG = "__lara_flow__call_edge";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseEdge.Class<D, S> {}

    export class Builder implements Edge.Builder<Data, ScratchData> {
        buildData(data: BaseEdge.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                },
            };
        }

        buildScratchData(scratchData: BaseEdge.ScratchData): ScratchData {
            return {
                ...scratchData,
            };
        }
    }

    export const TypeGuard = Edge.TagTypeGuard<Data, ScratchData>(TAG, VERSION);

    export interface Data extends BaseEdge.Data {
        [TAG]: {
            version: typeof VERSION;
        };
    }

    export interface ScratchData extends BaseEdge.ScratchData {}
}

export default CallEdge;
