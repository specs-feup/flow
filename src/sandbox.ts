// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";
import { Joinpoint } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import DefaultDotFormatter from "clava-flow/dot/DefaultDotFormatter";
import FlowGraphBuilder from "clava-flow/flow/builder/FlowGraphBuilder";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import FlowNode from "clava-flow/flow/node/FlowNode";
import { NodeTypeGuard } from "clava-flow/graph/Node";

const graph = new FlowGraphBuilder(Query.root() as Joinpoint).build();

graph.toDotFile(new DefaultDotFormatter(), "out/woven_code/sandbox/graph.dot");

// graph.addNode(
//     InstructionNode.build(Query.root() as Joinpoint, InstructionNode.Type.COMMENT, "1"),
// );
// graph
//     .addNode("1")
//     .init(
//         InstructionNode.Builder(Query.root() as Joinpoint, InstructionNode.Type.COMMENT),
//     );

const node = graph.nodes[0]; 

const instructionNode = node.as(FlowNode.Class);

if (node.is(InstructionNode.TypeGuard)) {
    // node: Base<Inst>
    // FlowNode<FlowNode>
    // res: FlowNode<Inst>
    const instructionNode = node.as(FlowNode.Class);

    if (node.is({} as NodeTypeGuard<ConditionNode.Data, ConditionNode.ScratchData>)) {
        const conditionNode = node.as(ConditionNode.Class);
        const l = conditionNode.as(InstructionNode.Class);
    }

    const l = instructionNode.as(InstructionNode.Class);
    const i = l.as(FlowNode.Class);

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
