import LaraFlowError from "@specs-feup/flow/error/LaraFlowError";
import FunctionNode from "@specs-feup/flow/flow/FunctionNode";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Graph from "@specs-feup/flow/graph/Graph";
import { NodeCollection } from "@specs-feup/flow/graph/NodeCollection";

/**
 * A graph for building CFGs, DFGs, CDFGs, SCGs, etc.
 *
 * This graph is language and weaver agnostic. In fact,
 * it may contain custom nodes and edges not associated
 * with any language or weaver.
 *
 * Note that this graph maintains a map from function names
 * to their respective nodes. While this is useful for
 * efficiency and for transformations to target the intended
 * nodes, a precaution must be taken:
 * - Initializing, cloning, or deserializing nodes does not
 * necessarily update the function map. Take that into account
 * when manipulating the graph, favoring functions such as
 * {@link FlowGraph.addFunction}.
 */
namespace FlowGraph {
    export const TAG = "__lara_flow__flow_graph";
    export const VERSION = "1";

    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseGraph.Class<D, S> {
        /**
         * Adds a {@link FunctionNode} to the graph, updating the function map.
         *
         * @param name The name of the function. This name must be unique in the graph,
         * so it should be mangled if the use case permits overloading.
         * @param node The node to initialize as the {@link FunctionNode}. If not
         * provided, a new node will be created.
         * @returns The {@link FunctionNode} that was added.
         * @throws {} {@link LaraFlowError} if the function name already exists in the graph.
         * This should be seen as a logic error and should not catched. Instead, ensure that
         * no existing function shares the same name by renaming or removing.
         */
        addFunction(name: string, node?: BaseNode.Class): FunctionNode.Class {
            if (this.hasFunction(name)) {
                throw new LaraFlowError(
                    `Another function '${name}' is already registered in the graph.`,
                );
            }
            if (node === undefined) {
                node = this.addNode();
            }
            this.data[FlowGraph.TAG].functions[name] = node.id;
            return node.init(new FunctionNode.Builder(name)).as(FunctionNode);
        }

        /**
         * Retrieves a {@link FunctionNode} from the graph by the name of the function.
         *
         * If the function is not in the map, the node does not exist, or the node
         * is not a {@link FunctionNode}, `undefined` will be returned.
         *
         * @param name The name of the function.
         * @returns The {@link FunctionNode}, or `undefined` if it does not exist.
         */
        getFunction(name: string): FunctionNode.Class | undefined {
            const id = this.data[FlowGraph.TAG].functions[name];
            if (id === undefined) return undefined;
            return this.getNodeById(id)?.tryAs(FunctionNode);
        }

        /**
         * Retrieves a {@link FunctionNode} from the graph by the name of the function.
         * If the function does not exist, a new node will be created, updating the
         * function map.
         * 
         * @param name The name of the function.
         * @returns The {@link FunctionNode} that was retrieved or created.
         */
        getOrAddFunction(name: string): FunctionNode.Class {
            const functionNode = this.getFunction(name);
            if (functionNode === undefined) {
                return this.addFunction(name);
            }
            return functionNode;
        }

        /**
         * Checks if the graph has a function with the given name.
         *
         * The function must be in the map, the respective node must exist, and the node
         * must be a {@link FunctionNode} for this method to return `true`.
         *
         * @param name The name of the function.
         * @returns `true` if the graph has a function with the given name, `false` otherwise.
         */
        hasFunction(name: string): boolean {
            // Must fully get function, since the key may point to a node
            // that no longer exists
            return this.getFunction(name) !== undefined;
        }

        /**
         * Retrieves all functions in the graph.
         *
         * The functions must be in the map, the respective nodes must exist, and the nodes
         * must be {@link FunctionNode} to be included in the collection.
         *
         * @returns A collection of all functions in the graph.
         */
        get functions(): NodeCollection<FunctionNode.Class> {
            const nodes = Object.values(this.data[FlowGraph.TAG].functions)
                .map((id) => this.getNodeById(id))
                .filter((node) => node !== undefined && node.is(FunctionNode))
                .map((node) => node.as(FunctionNode));

            return this.arrayCollection(FunctionNode, nodes);
        }
    }

    export class Builder implements Graph.Builder<Data, ScratchData> {
        buildData(data: BaseGraph.Data): Data {
            return {
                ...data,
                [TAG]: {
                    version: VERSION,
                    functions: {},
                },
            };
        }

        buildScratchData(scratchData: BaseGraph.ScratchData): ScratchData {
            return {
                ...scratchData,
            };
        }
    }

    export const TypeGuard = Graph.TagTypeGuard<Data, ScratchData>(TAG, VERSION);

    export interface Data extends BaseGraph.Data {
        [TAG]: {
            version: typeof VERSION;
            /**
             * Maps function name to its node id. A Record is used
             * instead of a Map so that it can be serialized.
             */
            functions: Record<string, string>;
        };
    }

    export interface ScratchData extends BaseGraph.ScratchData {}
}

export default FlowGraph;
