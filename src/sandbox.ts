// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";
import { Program } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import FlowGraph from "clava-flow/flow/FlowGraph";
import DefaultFlowGraphDotFormatter from "clava-flow/dot/DefaultFlowGraphDotFormatter";
import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseNode from "clava-flow/graph/BaseNode";

const graph = FlowGraph.generate(Query.root() as Program);
graph.toDotFile(new DefaultFlowGraphDotFormatter, "out/woven_code/sandbox/graph.dot");

const node = graph.nodes[0];

if (!node.is(FlowNode.TypeGuard)) {
    throw new Error("Node is not a FlowNode");
}



const n = (node as BaseNode.Class<FlowNode.Data, FlowNode.ScratchData>).as(FlowNode.Class);
