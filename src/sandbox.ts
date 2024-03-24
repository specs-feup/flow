// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";
import { Joinpoint } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import DefaultDotFormatter from "clava-flow/dot/DefaultDotFormatter";
import Graph from "clava-flow/graph/Graph";
import Node from "clava-flow/graph/Node";
import Edge from "clava-flow/graph/Edge";
import FlowGraphBuilder from "clava-flow/flow/builder/FlowGraphBuilder";
import FlowNode from "clava-flow/flow/node/FlowNode";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import WithId from "clava-flow/graph/WithId";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";

const graph = new FlowGraphBuilder(Query.root() as Joinpoint).build();

graph.toDotFile(new DefaultDotFormatter, "out/woven_code/sandbox/graph.dot");

const node = graph.nodes[0];

if (node.is(InstructionNode.TypeGuard)) {
    const instructionNode = node.as(InstructionNode.Class);
    console.log(instructionNode.data.instructionFlowNodeType);
} else {
    
}


// const graph = new Graph();
// const node1 = graph.addNode(Node.build("1"));
// const node2 = graph.addNode(Node.build("2"));
// const node3 = graph.addNode(Node.build());
// const edge = graph.addEdge(Edge.build(node1, node2, "ala"));
// edge.source = node3;
// edge.target = node1;

// graph.toDotFile(new DefaultDotFormatter, "out/woven_code/sandbox/graph.dot");

