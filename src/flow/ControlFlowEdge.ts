import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import Edge from "@specs-feup/flow/graph/Edge";

namespace ControlFlowEdge {
    export const TAG = "__lara_flow__control_flow_edge";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseEdge.Class<D, S> {
        get isFake(): boolean {
            return this.data[TAG].isFake;
        }

        set isFake(value: boolean) {
            this.data[TAG].isFake = value;
        }
    }

    export class Builder implements Edge.Builder<Data, ScratchData> {
        #isFake: boolean;

        constructor() {
            this.#isFake = false;
        }

        fake(): this {
            this.#isFake = true;
            return this;
        }

        buildData(data: BaseEdge.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                    isFake: this.#isFake,
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
            isFake: boolean;
        };
    }

    export interface ScratchData extends BaseEdge.ScratchData {}
}

export default ControlFlowEdge;
