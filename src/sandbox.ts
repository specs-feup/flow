import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import DefaultDotFormatter from "lara-flow/graph/dot/DefaultDotFormatter";
import DotFormatter from "lara-flow/graph/dot/DotFormatter";
import { EdgeCollection } from "lara-flow/graph/EdgeCollection";
import Graph from "lara-flow/graph/Graph";
import IncrementingIdGenerator from "lara-flow/graph/id/IncrementingIdGenerator";
import Node from "lara-flow/graph/Node";
import { NodeCollection } from "lara-flow/graph/NodeCollection";
import BreadthFirstSearch from "lara-flow/graph/search/BreadthFirstSearch";
import DijkstraSearch from "lara-flow/graph/search/DijkstraSearch";

namespace TGraph {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseGraph.Class<D, S> {
        lolme() {
            console.log("lolme");
        }
    }

    export class Builder extends BaseGraph.Builder implements Graph.Builder<Data, ScratchData> {
        buildData(data: BaseGraph.Data): Data {
            return { ...data, kaka: "kaka" };
        }

        buildScratchData(scratchData: BaseGraph.ScratchData): ScratchData {
            return scratchData;
        }
    }

    export const TypeGuard: Graph.TypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseGraph.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseGraph.ScratchData): sData is ScratchData {
            return true;
        },
    };

    export interface Data extends BaseGraph.Data {
        kaka: string;
    }

    export interface ScratchData extends BaseGraph.ScratchData {}
}

namespace TNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        lolme() {
            console.log("lolme");
        }
    }

    export class Builder extends BaseNode.Builder implements Node.Builder<Data, ScratchData> {
        buildData(data: BaseNode.Data): Data {
            return { ...data, kaka: "kaka" };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {};
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

namespace T2Node {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends BaseNode.Class<D, S> {
        lolme() {
            console.log("lolme");
        }
    }

    export class Builder
        extends BaseNode.Builder
        implements Node.Builder<Data, ScratchData, TNode.Data, TNode.ScratchData>
    {
        buildData(data: TNode.Data): Data {
            return { ...data, kaka2: "kaka" };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {...scratchData, piu: "piu"};
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
        kaka2: string;
    }

    export interface ScratchData extends BaseNode.ScratchData {
        piu: string;
    }
}

const graph = Graph.create().setEdgeIdGenerator(new IncrementingIdGenerator());
const n1 = graph.addNode("n1");
const n2 = graph.addNode("n2");
const n3 = graph.addNode("n3");
const n4 = graph.addNode("n4");
const n5 = graph.addNode("n5");
const n6 = graph.addNode("n6");
const n7 = graph.addNode("n7");

const e1 = graph.addEdge(n1, n2, "1");
const e2 = graph.addEdge(n2, n3, "2");
const e3 = graph.addEdge(n3, n4, "3");
const e4 = graph.addEdge(n1, n5, "4");
const e5 = graph.addEdge(n5, n6, "5");
const e6 = graph.addEdge(n6, n7, "6");

for (const e of EdgeCollection.from(e4, e2, e3, e1).sort((a, b) => parseInt(a.id) - parseInt(b.id))) {
    console.log(e.id);
}


// console.log(graph.nodes2[10].id);

function a(bn: BaseNode.Class, tn: TNode.Class, t2n: T2Node.Class) {
    // BaseNode.Class<TNode.Data, TNode.ScratchData>
    const tb = tn.toCollection().union(bn.toCollection());
    tb.allAs(BaseNode);
    const bt = bn.toCollection().union(tn.toCollection());
    bt.allAs(BaseNode);
    const tt = tn.toCollection().union(tn.toCollection());
    const bb = bn.toCollection().union(bn.toCollection());

    const t2t = t2n.toCollection().union(tn.toCollection());
    t2t.allAs(BaseNode);
    const tt2 = tn.toCollection().union(t2n.toCollection());


    const d = tn.toCollection().difference(bn.toCollection());
}


// const a = graph.nodes2.expectAll(TNode).allAs(BaseNode);

// graph.nodes2.union(a.(BaseNode), a, graph.nodes2.filterIs(TNode), graph.nodes2);

// graph.nodes2.expectAll(TNode).union(graph.nodes2);

// graph.nodes2.filterIs(TNode).allAs(TNode);

// console.log(graph.nodes2[5].outgoers[0].id);

// graph.nodes2.as(T2Node);

// [[]][10].at(0);


// console.log(1000 in graph.toCy().nodes());
// for (const n in graph.toCy().nodes()) {
//     console.log(n);
// }

// const a__ = graph.toCy().nodes();
// delete a__[0];
// console.log(0 in a__);
// let a: any = {
//     b: 1,
//     c: 2,
//     [0]: 5,
// };
// delete a.b;
// console.log(a);

// graph[0];
// const coll = graph.nodes as any as NodeCollection<TNode.Data, TNode.ScratchData>;
// coll.as(TNode);
// for (const node of coll) {
// }

// for (const n in coll) {
//     console.log(n);
// }


// delete ( as any).$id;

// for (const { node, distance } of n1.search(new DijkstraSearch((e) => parseInt(e.id)))) {
//     console.log(`Node ${node.id} at distance ${distance}`);
// }

const formatter = new DefaultDotFormatter().addNodeAttrs((n) => ({
    color: n.id.endsWith("b") ? "red" : "blue",
}));
graph.expect(TGraph).toFile(formatter, "out/graph.dot");
