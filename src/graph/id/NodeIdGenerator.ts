import BaseGraph from "lara-flow/graph/BaseGraph";

export default interface NodeIdGenerator {
    newId(graph: BaseGraph.Class): string;
}
