import CallEdge from "lara-flow/flow/CallEdge";
import ControlFlowEdge from "lara-flow/flow/ControlFlowEdge";
import ControlFlowNode from "lara-flow/flow/ControlFlowNode";
import FlowDotFormatter from "lara-flow/flow/dot/FlowDotFormatter";
import FlowGraph from "lara-flow/flow/FlowGraph";
import FunctionNode from "lara-flow/flow/FunctionNode";
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

    export class Builder implements Graph.Builder<Data, ScratchData> {
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

    export class Builder implements Node.Builder<Data, ScratchData> {
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

// const graph = Graph.create().setEdgeIdGenerator(new IncrementingIdGenerator());
// const n1 = graph.addNode("n1");
// const n2 = graph.addNode("n2");
// const n3 = graph.addNode("n3");
// const n4 = graph.addNode("n4");
// const n5 = graph.addNode("n5");
// const n6 = graph.addNode("n6");
// const n7 = graph.addNode("n7");

// const e1 = graph.addEdge(n1, n2, "1");
// const e2 = graph.addEdge(n2, n3, "2");
// const e3 = graph.addEdge(n3, n4, "3");
// const e4 = graph.addEdge(n1, n5, "4");
// const e5 = graph.addEdge(n5, n6, "5");
// const e6 = graph.addEdge(n6, n7, "6");

// for (const { node, distance } of n1.search(new DijkstraSearch((e) => parseInt(e.id)))) {
//     console.log(`Node ${node.id} at distance ${distance}`);
// }

// const formatter = new DefaultDotFormatter().addNodeAttrs((n) => ({
//     color: n.id.endsWith("b") ? "red" : "blue",
// }));
// graph.expect(TGraph).toFile(formatter, "out/graph.dot");

//=======================
// const graph = Graph.create().init(new FlowGraph.Builder()).as(FlowGraph);

// const f1 = graph.addFunction("f1", graph.addNode("f1"));

// const n1 = graph.addNode("n1");
// const n2 = graph.addNode("n2");
// const n3 = graph.addNode("n3");
// const n4 = graph.addNode("n4");
// const n5 = graph.addNode("n5");
// const n6 = graph.addNode("n6");
// const n7 = graph.addNode("n7");

// const e1 = graph.addEdge(n1, n2, "1");
// const e2 = graph.addEdge(n2, n3, "2");
// const e3 = graph.addEdge(n3, n4, "3");
// const e4 = graph.addEdge(n1, n5, "4");
// const e5 = graph.addEdge(n5, n6, "5");
// const e6 = graph.addEdge(n6, n7, "6");

// for (const { node, distance } of n1.search(new DijkstraSearch((e) => parseInt(e.id)))) {
//     console.log(`Node ${node.id} at distance ${distance}`);
// }

// const formatter = new DefaultDotFormatter().addNodeAttrs((n) => ({
//     color: n.id.endsWith("b") ? "red" : "blue",
// }));
// graph.expect(TGraph).toFile(formatter, "out/graph.dot");
//=======================

const graph = Graph
    .create()
    .init(new FlowGraph.Builder())
    .as(FlowGraph);

const f1 = graph.addFunction("f1");
const f2 = graph.addFunction("f2");

const c1 = graph.addEdge(f1, f2, "c1").init(new CallEdge.Builder());
const c2 = graph.addEdge(f2, f2, "c2").init(new CallEdge.Builder());

const cf1 = graph.addNode("cf1").init(new ControlFlowNode.Builder(f1));
const cf2 = graph.addNode("cf2").init(new ControlFlowNode.Builder(f1));
const cf3 = graph.addNode("cf3").init(new ControlFlowNode.Builder(f1));

const cfe1 = graph.addEdge(cf1, cf2, "cfe1").init(new ControlFlowEdge.Builder());
const cfe2 = graph.addEdge(cf2, cf3, "cfe2").init(new ControlFlowEdge.Builder().fake());
const cfe3 = graph.addEdge(cf2, cf2, "cfe3").init(new ControlFlowEdge.Builder());

f1.cfgEntryNode = cf1.as(ControlFlowNode);

const formatter = new FlowDotFormatter();
graph.toFile(formatter, "out/graph.dot");
