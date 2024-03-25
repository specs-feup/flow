import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";
import Graph from "clava-flow/graph/Graph";
import { NodeBuilder, NodeConstructor, NodeTypeGuard } from "clava-flow/graph/Node";

namespace BaseNode {
    export class Class<D extends Data = Data, S extends ScratchData = ScratchData> {
        #graph: Graph;
        #node: cytoscape.NodeSingular;

        // _d and _sd are a hack to force typescript to typecheck
        // D and S in .as() method.
        constructor(graph: Graph, node: cytoscape.NodeSingular, _d: D = {} as any, _sd: S = {} as any) {
            this.#graph = graph;
            this.#node = node;
        }

        get data(): D {
            return this.#node.data();
        }

        get scratchData(): S {
            return this.#node.scratch(Graph.scratchNamespace);
        }

        get id(): string {
            return this.#node.id();
        }

        is<D2 extends Data, S2 extends ScratchData>(
            guard: NodeTypeGuard<D2, S2>,
        ): this is BaseNode.Class<D2, S2> {
            const data = this.data;
            const scratchData = this.scratchData;
            const result =
                guard.isDataCompatible(data) &&
                guard.isScratchDataCompatible(scratchData);

            // Have typescript statically check that the types are correct
            // in the implementation of this function.
            result && (data satisfies D2) && (scratchData satisfies S2);

            return result;
        }

        as<N extends BaseNode.Class<D, S>>(
            NodeType: NodeConstructor<D, S, N>
        ): N {
            return new NodeType(this.#graph, this.#node, this.data, this.scratchData);
        }

        // TODO
        init(builder: NodeBuilder<N>): N {
            builder.buildData(this.data);
            builder.buildScratchData(this.scratchData);
            return builder.Class(this.#graph, this.#node);
        }

        toCy(): cytoscape.NodeSingular {
            return this.#node;
        }
    }

    export class Builder extends NodeBuilder {}

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            return true;
        },

        isScratchDataCompatible(sData: BaseNode.ScratchData): sData is ScratchData {
            return true;
        },
    };

    export interface Data {
        id: string;
    }

    export interface ScratchData {}
}

export default BaseNode;
