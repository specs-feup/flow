import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";

export default interface EdgeIdGenerator {
    newId(graph: BaseGraph.Class, source: BaseNode.Class, target: BaseNode.Class): string;
}
