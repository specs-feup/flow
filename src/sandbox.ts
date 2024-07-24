import BaseGraph from "lara-flow/graph/BaseGraph";
import Graph from "lara-flow/graph/Graph";

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
            return data as any;
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

const graph = Graph.create();

graph.match(
    [TGraph, (g: TGraph.Class) => console.log("1a")],
    [BaseGraph, (g: BaseGraph.Class) => console.log("1b")],
);

graph.switch(
    Graph.Case(TGraph, (g) => console.log("2a")),
    Graph.Case(BaseGraph, (g) => console.log("2b")),
)



