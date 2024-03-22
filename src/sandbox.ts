// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";
import { Joinpoint } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import DefaultDotFormatter from "clava-flow/dot/DefaultDotFormatter";
import Graph from "clava-flow/graph/Graph";
import Node from "clava-flow/graph/Node";
import Edge from "clava-flow/graph/Edge";
import FlowGraphBuilder from "clava-flow/flow/builder/FlowGraphBuilder";

const graph = new FlowGraphBuilder(Query.root() as Joinpoint).build();

graph.toDotFile(new DefaultDotFormatter, "out/woven_code/sandbox/graph.dot");

const node = graph.nodes[0];



// const graph = new Graph();
// const node1 = graph.addNode(Node.build("1"));
// const node2 = graph.addNode(Node.build("2"));
// const node3 = graph.addNode(Node.build());
// const edge = graph.addEdge(Edge.build(node1, node2, "ala"));
// edge.source = node3;
// edge.target = node1;

// graph.toDotFile(new DefaultDotFormatter, "out/woven_code/sandbox/graph.dot");

