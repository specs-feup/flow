import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import DefaultDotFormatter from "lara-flow/graph/dot/DefaultDotFormatter";
import DotFormatter from "lara-flow/graph/dot/DotFormatter";
import Graph from "lara-flow/graph/Graph";
import IncrementingIdGenerator from "lara-flow/graph/id/IncrementingIdGenerator";
import Node from "lara-flow/graph/Node";

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

    export interface Data extends TNode.Data {
        kaka2: string;
    }

    export interface ScratchData extends TNode.ScratchData {
        piu: string;
    }
}

const graph = Graph.create();
const a = graph.addNode("a");
const b = graph.addNode("b");
const c = graph.addNode("c");
const aa = graph.addNode("aa", a);
const ab = graph.addNode("ab", a);
const ac = graph.addNode("ac", a);
const aba = graph.addNode("aba", ab);
const abb = graph.addNode("abb", ab);
const abc = graph.addNode("abc", ab);

const e1 = graph.addEdge(a, b, "graph");
const e2 = graph.addEdge(b, c, "\"<B>e2</B>\"");
const e3 = graph.addEdge(c, b, "e3");
const e4 = graph.addEdge(c, b, "<<B>e2</B>>");
const e5 = graph.addEdge(aa, aba, "e5");
    
const formatter = new DefaultDotFormatter().addNodeAttrs((n) => ({
    color: n.id.endsWith("b") ? "red" : "blue",
}));
graph.toFile(formatter, "out/graph.dot");
