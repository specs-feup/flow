import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import Graph from "@specs-feup/flow/graph/Graph";
import cytoscape from "cytoscape";

/**
 * Represents a node type. All node types must be subtypes of {@link BaseNode}.
 * An node type has 5 components:
 * - A class with functionality ({@link BaseNode.Class});
 * - A builder class (optional) ({@link Node.Builder});
 * - A type guard object ({@link Node.TypeGuard});
 * - A data type ({@link BaseNode.Data});
 * - A scratch data type ({@link BaseNode.ScratchData}).
 *
 * @template D Type parameter for the data contained in the node type.
 * @template S Type parameter for the scratch data contained in the node type.
 * @template N Type parameter for the instance of the class with functionality for this node type.
 */
type Node<
    D extends BaseNode.Data,
    S extends BaseNode.ScratchData,
    N extends BaseNode.Class<D, S>,
> = {
    /**
     * The class with functionality for the node type. See {@link Node.Class}.
     */
    Class: Node.Class<D, S, N>;
    /**
     * The type guard object for the node type. See {@link Node.TypeGuard}.
     */
    TypeGuard: Node.TypeGuard<D, S>;
};

namespace Node {
    /**
     * Retrieves a node from the given cytoscape node representation.
     *
     * @param node The cytoscape node to create the node from.
     * @returns The node from the cytoscape node.
     */
    export function fromCy(node: cytoscape.NodeSingular): BaseNode.Class {
        // Appears as deprecated because it is for internal use only
        return new BaseNode.Class(Graph.fromCy(node.cy()), node);
    }

    /**
     * Represents the class with functionality for a node type.
     * For example, {@link BaseNode.Class} is a {@link Node.Class}
     */
    export type Class<
        D extends BaseNode.Data,
        S extends BaseNode.ScratchData,
        N extends BaseNode.Class<D, S>,
    > = new (graph: BaseGraph.Class, node: cytoscape.NodeSingular, _d?: D, _sd?: S) => N;

    /**
     * Represents a builder class instance for a node type.
     * For example, an instance of {@link BaseNode.Builder} is a {@link Node.Builder}.
     *
     * The builder class may have a constructor and methods to customize the information
     * that is stored in the node.
     */
    export interface Builder<
        D2 extends BaseNode.Data,
        S2 extends BaseNode.ScratchData,
        D1 extends BaseNode.Data = BaseNode.Data,
        S1 extends BaseNode.ScratchData = BaseNode.ScratchData,
    > {
        /**
         * Adds data to the data object of the node.
         *
         * @param data The current data object of the node.
         * @returns The data object to be stored in the node.
         */
        buildData: (data: D1) => D2;

        /**
         * Adds data to the scratch data object of the node.
         *
         * @param scratchData The current scratch data object of the node.
         * @returns The scratch data object to be stored in the node.
         */
        buildScratchData: (scratchData: S1) => S2;
    }

    /**
     * Represents the type guard object for a node type.
     * For example, {@link BaseNode.TypeGuard} is a {@link Node.TypeGuard}.
     */
    export interface TypeGuard<D extends BaseNode.Data, S extends BaseNode.ScratchData> {
        /**
         * Type guard for the data object of the node.
         *
         * @param data The data object to be checked.
         * @returns Whether the data object is compatible with the node type.
         */
        isDataCompatible(data: BaseNode.Data): data is D;

        /**
         * Type guard for the scratch data object of the node.
         *
         * @param sData The scratch data object to be checked.
         * @returns Whether the scratch data object is compatible with the node type.
         */
        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is S;
    }

    /**
     * Creates a type guard object for a node type based on a tag, which is
     * less verbose than the usual boilerplate for defining TypeGuards.
     *
     * @param tag The tag to check for in the data object.
     * @param version The version number for the node type. In the future,
     * if breaking changes are needed (for example, adding a new field
     * when there are already serialized nodes), this version number may
     * be increased. Utility functions to convert types from older versions
     * should be provided.
     * @param isScratchDataCompatible An optional function to check if the
     * scratch data is compatible with the node type. If not provided, the
     * scratch data is assumed to be compatible.
     * @returns A type guard object for the node type.
     */
    export function TagTypeGuard<D extends BaseNode.Data, S extends BaseNode.ScratchData>(
        tag: string,
        version: string,
        isScratchDataCompatible: (sData: BaseNode.ScratchData) => boolean = () => true,
    ): TypeGuard<D, S> {
        return {
            isDataCompatible(data: BaseNode.Data): data is D {
                const obj = (data as any)[tag];
                return typeof obj === "object" && obj.version === version;
            },

            isScratchDataCompatible(sData: BaseNode.ScratchData): sData is S {
                return isScratchDataCompatible(sData);
            },
        };
    }

    /**
     * Represents a case in a {@link BaseNode.Class.switch}.
     *
     * @param NodeType The node type to match.
     * @param callback The call back if the node type matches.
     * @returns An object to be used in {@link BaseNode.Class.switch}.
     */
    export function Case<
        D extends BaseNode.Data,
        S extends BaseNode.ScratchData,
        N extends BaseNode.Class<D, S>,
    >(NodeType: Node<D, S, N>, callback: (g: N) => void) {
        // By wrapping the class in a function, we can avoid the
        // use of the `new` keyword, making the switch slightly
        // less verbose.
        class _Case {
            NodeType: Node<any, any, any>;
            callback: (g: any) => void;
            constructor(NodeType: Node<any, any, any>, callback: (g: any) => void) {
                this.NodeType = NodeType;
                this.callback = callback;
            }
        }

        return new _Case(NodeType, callback);
    }

    /**
     * An object that can generate unique identifiers for nodes.
     * See {@link BaseGraph.Class.setNodeIdGenerator}.
     */
    export interface IdGenerator {
        /**
         * Generates a unique identifier for a new node.
         *
         * @param graph The graph that the node belongs to.
         * @returns A unique identifier for the new node.
         */
        newId(graph: BaseGraph.Class): string;
    }

    /**
     * A search algorithm that can be used in node search.
     * See {@link BaseNode.Class.search}.
     */
    export interface Search<
        V extends SearchVisit = SearchVisit,
        N extends BaseNode.Class = BaseNode.Class,
    > {
        /**
         * Starts a search from a given root node. This method is a generator,
         * so it is usually implemented like:
         *
         * ```typescript
         * export default class MySearch implements Node.Search {
         *     *search(root: BaseNode.Class): Generator<SearchVisit> {
         *         // Your implementation here
         *     }
         * }
         * ```
         *
         * And uses the `yield` keyword to return values.
         *
         * @param root The root node to start the search from.
         * @returns A generator that yields each visit, so that it can be lazily iterated over.
         */
        search: (root: N) => Generator<V>;
    }

    /**
     * Represents a visit during a node search.
     * See {@link Node.Search}.
     */
    export interface SearchVisit {
        /**
         * The current node that is being visited.
         */
        node: BaseNode.Class;
        /**
         * The path taken in this visit from the root node to the current node.
         */
        path: BaseEdge.Class[];
        /**
         * The current iteration number.
         */
        index: number;
    }

    /**
     * Returns the Data type of a node class.
     */
    export type ExtractData<C> = C extends BaseNode.Class<infer D, any> ? D : never;
    /**
     * Returns the ScratchData type of a node class.
     */
    export type ExtractScratchData<C> = C extends BaseNode.Class<any, infer S> ? S : never;
}

export default Node;
