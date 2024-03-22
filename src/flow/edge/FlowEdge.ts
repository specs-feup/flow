// Replace FlowNode with node class name

import Edge from "clava-flow/graph/Edge";
import Node from "clava-flow/graph/Node";
import WithId from "clava-flow/graph/WithId";

class FlowEdge<
    D extends WithId<FlowEdge.Data> = WithId<FlowEdge.Data>,
    S extends FlowEdge.ScratchData = FlowEdge.ScratchData,
> extends Edge<D, S> {}

namespace FlowEdge {
    export enum Type {
        CONTROL_FLOW = "control_flow",
        DATA_FLOW = "data_flow",
    }

    export interface Data extends Edge.Data {
        flowEdgeType: Type;
    }

    export interface ScratchData extends Edge.ScratchData {}
}

export default FlowEdge;
