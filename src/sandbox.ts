import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
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
const n1 = graph.addNode();
const e1 = graph.addEdge(n1, n1);
