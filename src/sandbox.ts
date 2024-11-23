import CallEdge from "@specs-feup/flow/flow/CallEdge";
import ControlFlowEdge from "@specs-feup/flow/flow/ControlFlowEdge";
import ControlFlowNode from "@specs-feup/flow/flow/ControlFlowNode";
import FlowDotFormatter from "@specs-feup/flow/flow/dot/FlowDotFormatter";
import FlowGraph from "@specs-feup/flow/flow/FlowGraph";
import FunctionNode from "@specs-feup/flow/flow/FunctionNode";
import BaseEdge from "@specs-feup/flow/graph/BaseEdge";
import BaseGraph from "@specs-feup/flow/graph/BaseGraph";
import BaseNode from "@specs-feup/flow/graph/BaseNode";
import DefaultDotFormatter from "@specs-feup/flow/graph/dot/DefaultDotFormatter";
import DotFormatter from "@specs-feup/flow/graph/dot/DotFormatter";
import { EdgeCollection } from "@specs-feup/flow/graph/EdgeCollection";
import Graph from "@specs-feup/flow/graph/Graph";
import IncrementingIdGenerator from "@specs-feup/flow/graph/id/IncrementingIdGenerator";
import Node from "@specs-feup/flow/graph/Node";
import { NodeCollection } from "@specs-feup/flow/graph/NodeCollection";
import BreadthFirstSearch from "@specs-feup/flow/graph/search/BreadthFirstSearch";
import DepthFirstSearch from "@specs-feup/flow/graph/search/DepthFirstSearch";
import DijkstraSearch from "@specs-feup/flow/graph/search/DijkstraSearch";

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
            return { ...scratchData, piu: "piu" };
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

//=======================

const graph = Graph.create().init(new FlowGraph.Builder()).as(FlowGraph);

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
graph.toFile(formatter, "out/graph3.dot");
