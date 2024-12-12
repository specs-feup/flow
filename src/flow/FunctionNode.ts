import LaraFlowError from "@specs-feup/flow/error/LaraFlowError";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import FlowGraph from "@specs-feup/flow/flow/FlowGraph";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Node from "@specs-feup/flow/graph/Node";
import { NodeCollection } from "@specs-feup/flow/graph/NodeCollection";

/**
 * A node that represents a function. A CFG subgraph may be associated
 * with it.
 *
 * Each FunctionNode must have a name that is unique in the graph.
 * You should mangle names in case of overloading or when you wish
 * to have multiple contexts of the same function as different nodes.
 */
namespace FunctionNode {
    export const TAG = "__lara_flow__function_node";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        /**
         * @returns The name of the function. This name must be unique in the graph,
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
         * should not be catched. Instead, ensure that no existing function
         * shares the same name by renaming or removing.
         */
        renameFunction(name: string): this {
            if (this.graph.is(FlowGraph)) {
                const graph = this.#expectMayRegister(name);
                this.unregister();
                graph.data[FlowGraph.TAG].functions[name] = this.id;
            }
            this.data[TAG].functionName = name;
            return this;
        }

        /**
         * @returns The control flow nodes that belong to this function.
         */
        get controlFlowNodes(): NodeCollection<ControlFlowNode.Class> {
            return this.graph.nodes
                .filterIs(ControlFlowNode)
                .filter((n) => n.data[ControlFlowNode.TAG].function === this.id);
        }

        /**
         * @returns The initial node of the function's CFG. This is the entry point
         * of the function.
         */
        get cfgEntryNode(): ControlFlowNode.Class | undefined {
            const id = this.data[TAG].cfgEntryNode;
            if (id === undefined) return undefined;
            return this.graph.getNodeById(id)?.tryAs(ControlFlowNode);
        }

        /**
         * Sets the initial node of the function's CFG. This is the entry point
         * of the function.
         * 
         * @param node The new entry node.
         */
        set cfgEntryNode(node: ControlFlowNode.Class | undefined) {
            if (
                node !== undefined &&
                node.data[ControlFlowNode.TAG].function !== this.id
            ) {
                throw new LaraFlowError(
                    "Cannot set a CFG entry node that does not belong to this function.",
                );
            }

            this.data[TAG].cfgEntryNode = node?.id;
        }

        /**
         * Auxiliary method to throw errors when trying to register a function
         * in a context that does not allow it.
         * 
         * @throws {} {@link LaraFlowError} if the node is not part of a
         * {@link FlowGraph} or if another function with the same name is
         * already registered in the graph.
         */
        #expectMayRegister(name: string): FlowGraph.Class {
            const graph = this.graph
                .expect(
                    FlowGraph,
                    "register() must be called on a FunctionNode in a FlowGraph",
                )
                .as(FlowGraph);
            const node = graph.getFunction(name);
            if (node !== undefined && node.id !== this.id) {
                throw new LaraFlowError(
                    `Another function '${name}' is already registered in the graph.`,
                );
            }
            return graph;
        }

        /**
         * Registers the function in the graph, so that its name points
         * to this node.
         * 
         * @throws {} {@link LaraFlowError} if the node is not part of a
         * {@link FlowGraph} or if another function with the same name is
         * already registered in the graph.
         */
        register() {
            this.#expectMayRegister(this.functionName).data[FlowGraph.TAG].functions[
                this.functionName
            ] = this.id;
        }

        /**
         * Unregisters the function from the graph, removing its name from
         * the function map.
         * 
         * @throws {} {@link LaraFlowError} if the node is not part of a
         * {@link FlowGraph}.
         */
        unregister() {
            const graph = this.graph
                .expect(
                    FlowGraph,
                    "unregister() must be called on a FunctionNode in a FlowGraph",
                )
                .as(FlowGraph);
            const node = graph.getFunction(this.functionName);
            if (node === undefined || node.id !== this.id) {
                return;
            }
            delete graph.data[FlowGraph.TAG].functions[this.functionName];
        }

        /**
         * @returns Whether this function is registered in the graph.
         * 
         * @throws {} {@link LaraFlowError} if the node is not part of a
         * {@link FlowGraph}.
         */
        isRegistered(): boolean {
            const id = this.graph.expect(
                FlowGraph,
                "isRegistered() must be called on a FunctionNode in a FlowGraph",
            ).data[FlowGraph.TAG].functions[this.functionName];
            return id === this.id;
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
             * 
             * The field {@link BaseNode.Data.parent} is not used so as to give
             * the developer more flexibility in the decision of what constitutes
             * a parent-child relationship. If desired that the {@link ControlFlowNode}
             * is a direct child of its {@link FunctionNode}, one may iterate
             * over the graph's {@link ControlFlowNode | ControlFlowNodes} and
             * set {@link BaseNode.Data.parent} to the value of this field.
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
