import LaraFlowError from "lara-flow/error/LaraFlowError";
import FlowGraph from "lara-flow/flow/FlowGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import Node from "lara-flow/graph/Node";

/**
 * A node that represents a function. Its children may form a CFG.
 */
namespace FunctionNode {
    export const TAG = "__lara_flow__function_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        /**
         * The name of the function. This name must be unique in the graph,
         * so it should be mangled if the use case permits overloading.
         */
        get functionName(): string {
            return this.data[TAG].functionName;
        }

        /**
         * Changes the function name. This name must be unique in the graph,
         * so it should be mangled if the use case permits overloading.
         *
         * The graph's function map will be updated.
         *
         * @param name The new name of the function.
         * @returns Itself, for chaining.
         * @throws {} {@link LaraFlowError} if the new function name already
         * exists in the graph. This should be seen as a logic error and
         * should not catched. Instead, ensure that no existing function 
         * shares the same name by renaming or removing.
         */
        renameFunction(name: string): this {
            if (this.graph.is(FlowGraph)) {
                const graph = this.graph.as(FlowGraph);
                if (graph.hasFunction(name)) {
                    throw new LaraFlowError(
                        `Function ${name} already exists in the graph.`,
                    );
                }
                graph.data[FlowGraph.TAG].functions.delete(this.functionName);
                graph.data[FlowGraph.TAG].functions.set(name, this.id);
            }
            this.data[TAG].functionName = name;
            return this;
        }
    }

    export class Builder implements Node.Builder<Data, ScratchData> {
        #functionName: string;
        /**
         * Initializing an existing node to be a FunctionNode will not
         * update the graph's function map. As such, use of 
         * {@link FlowGraph.Class.addFunction} is strongly encouraged
         * instead.
         * 
         * @param functionName The name of the function. This name must be 
         * unique in the graph, so it should be mangled if the use case 
         * permits overloading.
         */
        constructor(functionName: string) {
            this.#functionName = functionName;
        }
        
        buildData(data: BaseNode.Data): Data {
            this.#functionName
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                    functionName: this.#functionName,
                    cfgEntryNode: undefined,
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
             * The name of the function. This name must be unique in the graph,
             * so it should be mangled if the use case permits overloading.
             */
            functionName: string;
            /**
             * The initial node of the function's CFG. This is the entry point
             * of the function.
             */
            cfgEntryNode: string | undefined;
        };
    }

    export interface ScratchData extends BaseNode.ScratchData {}
}

export default FunctionNode;
