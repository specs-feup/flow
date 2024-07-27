import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import Graph from "lara-flow/graph/Graph";
import Node from "lara-flow/graph/Node";

namespace TGraph {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        lolme() {
            console.log("lolme");
        }
    }

    export const TypeGuard: Node.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is ScratchData {
            return true;
        },
    };

    export interface Data extends BaseNode.Data {
        kaka: string;
    }

    export interface ScratchData extends BaseNode.ScratchData {}
}

const graph = Graph.create();




graph.as(BaseGraph);


// graph.switch(
//     Graph.Case(TGraph, (g) => console.log("2ac")),
//     Graph.Case(BaseGraph, (g) => console.log("2baaa")),
// )

const node = graph.addNode();
node.switch(
    Node.Case(TGraph, (n) => console.log("2ac")),
    Node.Case(BaseNode, (n) => console.log("2baaa")),
)

