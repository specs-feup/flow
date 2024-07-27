import BaseGraph from "lara-flow/graph/BaseGraph";
import BaseNode from "lara-flow/graph/BaseNode";
import Graph from "lara-flow/graph/Graph";
import Node from "lara-flow/graph/Node";

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
const node = graph.addNode();
// node.init(new TNode.Builder());
node
    .init(new TNode.Builder())
    .init(new T2Node.Builder());
