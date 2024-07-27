import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

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
     * Represents the class with functionality for a node type.
     * For example, {@link BaseNode.Class} is a {@link Node.Class}
     */
    export type Class<
        D extends BaseNode.Data,
        S extends BaseNode.ScratchData,
        N extends BaseNode.Class<D, S>,
    > = new (graph: BaseGraph.Class, node: cytoscape.NodeSingular, _d: D, _sd: S) => N;

    /**
     * Represents a builder class for a node type.
     * For example, {@link BaseNode.Builder} is a {@link Node.BuilderClass}.
     */
    export type BuilderClass<
        D extends BaseNode.Data,
        S extends BaseNode.ScratchData,
        B extends Node.Builder<D, S>,
    > = abstract new (..._: any[]) => B;

    /**
     * Represents a builder class instance for a node type.
     * For example, an instance of {@link BaseNode.Builder} is a {@link Node.Builder}.
     *
     * The builder class may have a constructor and methods to customize the information
     * that is stored in the node.
     */
    export interface Builder<D extends BaseNode.Data, S extends BaseNode.ScratchData> {
        /**
         * Adds data to the data object of the node.
         *
         * @param data The current data object of the node.
         * @returns The data object to be stored in the node.
         */
        buildData(data: BaseNode.Data): D;

        /**
         * Adds data to the scratch data object of the node.
         *
         * @param scratchData The current scratch data object of the node.
         * @returns The scratch data object to be stored in the node.
         */
        buildScratchData(scratchData: BaseNode.ScratchData): S;
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
            constructor(
                NodeType: Node<any, any, any>,
                callback: (g: any) => void,
            ) {
                this.NodeType = NodeType;
                this.callback = callback;
            }
        }

        return new _Case(NodeType, callback);
    }
}

export default Node;
