import BaseGraph from "lara-flow/graph/BaseGraph";

/**
 * @deprecated
 * @todo
 */
export default interface NodeIdGenerator {
    newId(graph: BaseGraph.Class): string;
}
