import BaseGraph from "clava-flow/graph/BaseGraph";

export default interface NodeIdGenerator {
    newId(graph: BaseGraph.Class): string;
}
