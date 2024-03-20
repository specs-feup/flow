// Without this import, clava-js does not work for some reason
import FlowGraphBuilder from "clava-flow/flow/FlowGraphBuilder";
import "clava-js/api/Joinpoints.js";
import { Joinpoint } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import DefaultDotFormatter from "clava-flow/dot/DefaultDotFormatter";

const graph = new FlowGraphBuilder(Query.root() as Joinpoint).build();

graph.toDotFile(new DefaultDotFormatter, "out/woven_code/sandbox/graph.dot");
