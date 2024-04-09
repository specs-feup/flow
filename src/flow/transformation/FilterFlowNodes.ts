import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseGraph from "clava-flow/graph/BaseGraph";
import { GraphTransformation } from "clava-flow/graph/Graph";

export default class FilterFlowNodes implements GraphTransformation {
    #filterFn: (node: FlowNode.Class) => boolean;
    
    constructor(filterFn: (node: FlowNode.Class) => boolean){
        this.#filterFn = filterFn;
    }

    apply(graph: BaseGraph.Class): void {
        for (const node of graph.nodes) {
            if (node.is(FlowNode.TypeGuard)) {
                const flowNode = node.as(FlowNode.Class);
                if (!this.#filterFn(flowNode)) {
                    flowNode.removeFromFlow();
                    flowNode.remove();
                }
            }
        }
    }
}
