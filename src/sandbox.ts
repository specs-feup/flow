// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";
import { Joinpoint, Program } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import FlowGraph from "clava-flow/flow/FlowGraph";
import DefaultFlowGraphDotFormatter from "clava-flow/dot/DefaultFlowGraphDotFormatter";

const graph = FlowGraph.generate(Query.root() as Program);
graph.toDotFile(new DefaultFlowGraphDotFormatter, "out/woven_code/sandbox/graph.dot");
