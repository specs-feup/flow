import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import Edge from "@specs-feup/flow/graph/Edge";

/**
 * This edge type is used to connect two {@link ControlFlowNode | ControlFlowNodes}.
 * It represents that, immediately after the execution of the incoming node, the
 * outgoing node may be executed.
 */
namespace ControlFlowEdge {
    export const TAG = "__lara_flow__control_flow_edge";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
        > extends BaseEdge.Class<D, S> {
        /**
         * @returns Whether this edge is {@link ControlFlowEdge.Data.isFake | fake}.
         */
        get isFake(): boolean {
            return this.data[TAG].isFake;
        }

        /**
         * Sets whether this edge is {@link ControlFlowEdge.Data.isFake | fake}.
         * 
         * @param value Whether this edge is fake.
         */
        set isFake(value: boolean) {
            this.data[TAG].isFake = value;
        }
    }

    export class Builder implements Edge.Builder<Data, ScratchData> {
        #isFake: boolean;

        constructor() {
            this.#isFake = false;
        }

        /**
         * Marks this edge as {@link ControlFlowEdge.Data.isFake | fake}.
         */
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
            /**
             * Whether the edge is fake. Fake edges guarantee that
             * this control flow path is actually never followed in runtime,
             * even though the edge might be needed for algorithms to work
             * properly (for instance, to maintain post-dominance properties).
             * 
             * For a concrete example, consider the following code:
             * 
             * ```c
             * if (true) {
             *     ...
             * } else {
             *     ...
             * }
             * ```
             * 
             * Although it may make sense to represent this as a conditional node
             * with two outgoing control flow edges, in practice, the `else` branch
             * is never executed. Therefore, it may make sense to mark the edge
             * connecting the `if` branch to the `else` branch as fake.
             * 
             * Another example is the following code:
             * 
             * ```c
             * goback:
             * ...
             * goto goback;
             * ...
             * ```
             * 
             * This is effectively an infinite loop. However, to ensure that the end
             * of the function post-dominates the loop, it may be necessary to have
             * a fake edge connecting the `goto` statement to the next statement.
             */
            isFake: boolean;
        };
    }

    export interface ScratchData extends BaseEdge.ScratchData {}
}

export default ControlFlowEdge;
