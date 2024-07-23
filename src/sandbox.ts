import BaseGraph from "lara-flow/graph/BaseGraph";
import Graph from "lara-flow/graph/Graph";

function test(a: Graph<BaseGraph.Data, BaseGraph.ScratchData, BaseGraph.Class, BaseGraph.Builder>) {
    console.log(a);
    const ca = a.Builder;
    const ba = new a.Builder()
}


test(BaseGraph);

console.log("Hello, world!a");
