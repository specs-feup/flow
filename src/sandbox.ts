// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";
import { Joinpoint } from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import DefaultDotFormatter from "clava-flow/dot/DefaultDotFormatter";
import FlowGraphGenerator from "clava-flow/flow/builder/FlowGraphBuilder";
import InstructionNode from "clava-flow/flow/node/instruction/InstructionNode";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";
import BaseNode from "clava-flow/graph/BaseNode";
import FlowNode from "clava-flow/flow/node/FlowNode";
import { AbstractNodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";

const graph = new FlowGraphGenerator(Query.root() as Joinpoint).build();

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

let a: AbstractNodeBuilder<BaseNode.Data, BaseNode.ScratchData> = new BaseNode.Builder();

node
    .init(
        new InstructionNode.Builder(
            Query.root() as Joinpoint,
            InstructionNode.Type.COMMENT,
        ),
    )
    .as(InstructionNode.Class).id;
