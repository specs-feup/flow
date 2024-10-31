import LaraFlowError from "lara-flow/error/LaraFlowError";
import FunctionNode from "lara-flow/flow/FunctionNode";
import BaseNode from "lara-flow/graph/BaseNode";
import Node from "lara-flow/graph/Node";

/**
 * TODO
 *
 * Each ControlFlowNode must belong to exactly one FunctionNode.
 * You may create a "global" FunctionNode for the flow that is not
 * part of any function (in languages such as python or javascript).
 */
namespace ControlFlowNode {
    export const TAG = "__lara_flow__control_flow_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        get function(): FunctionNode.Class {
            const id = this.data[TAG].function;
            const node = this.graph.getNodeById(id);
            if (node === undefined || !node.is(FunctionNode)) {
                throw new LaraFlowError(
                    "FunctionNode not in graph; may have been removed.",
                );
            }
            return node.as(FunctionNode);
        }

        setAsEntryNode(): this {
            this.function.data[FunctionNode.TAG].cfgEntryNode = this.id;
            return this;
        }
    }

    export class Builder implements Node.Builder<Data, ScratchData> {
        #function: FunctionNode.Class;

        constructor(functionNode: FunctionNode.Class) {
            this.#function = functionNode;
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                    function: this.#function.id,
                },
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...scratchData,
            };
        }
    }

    export const TypeGuard = Node.TagTypeGuard<Data, ScratchData>(TAG, VERSION);

    export interface Data extends BaseNode.Data {
        [TAG]: {
            version: typeof VERSION;
            /**
             * The id of the {@link FunctionNode} that this node belongs to.
             */
            function: string;
        };
    }

    export interface ScratchData extends BaseNode.ScratchData {}
}

export default ControlFlowNode;
