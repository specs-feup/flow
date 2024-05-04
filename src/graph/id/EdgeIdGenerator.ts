import BaseGraph from "clava-flow/graph/BaseGraph";
import BaseNode from "clava-flow/graph/BaseNode";

export default interface EdgeIdGenerator {
    newId(graph: BaseGraph.Class, source: BaseNode.Class, target: BaseNode.Class): string;
}
