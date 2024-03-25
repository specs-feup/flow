import BaseNode from "clava-flow/graph/BaseNode";
import Graph from "clava-flow/graph/Graph";
import cytoscape from "lara-js/api/libs/cytoscape-3.26.0.js";

export abstract class NodeBuilder {}

export type NodeConstructor<
    D extends BaseNode.Data,
    S extends BaseNode.ScratchData,
    N extends BaseNode.Class<D, S>,
> = new (graph: Graph, node: cytoscape.NodeSingular, _d: D, _sd: S) => N;

export interface NodeTypeGuard<D extends BaseNode.Data, S extends BaseNode.ScratchData> {
    isDataCompatible(data: BaseNode.Data): data is D;
    isScratchDataCompatible(sData: BaseNode.ScratchData): sData is S;
}
