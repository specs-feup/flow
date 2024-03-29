import DotFormatter from "clava-flow/dot/DotFormatter";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";
import CommentNode from "clava-flow/flow/node/instruction/CommentNode";
import FunctionEntryNode from "clava-flow/flow/node/instruction/FunctionEntryNode";
import FunctionExitNode from "clava-flow/flow/node/instruction/FunctionExitNode";
import ScopeEndNode from "clava-flow/flow/node/instruction/ScopeEndNode";
import ScopeStartNode from "clava-flow/flow/node/instruction/ScopeStartNode";
import StatementNode from "clava-flow/flow/node/instruction/StatementNode";
import UnknownInstructionNode from "clava-flow/flow/node/instruction/UnknownInstructionNode";
import BaseEdge from "clava-flow/graph/BaseEdge";
import BaseNode from "clava-flow/graph/BaseNode";

export default class DefaultFlowGraphDotFormatter extends DotFormatter {
    override formatNode(node: BaseNode.Class): DotFormatter.Node {
        let label;
        let shape = "box";
        if (node.is(ConditionNode.TypeGuard)) {
            const conditionNode = node.as(ConditionNode.Class);
            shape = "diamond";
            label = `Condition:\n${conditionNode.jp.code}`;
        } else if (node.is(CommentNode.TypeGuard)) {
            const commentNode = node.as(CommentNode.Class);
            label = `Comment:\n${commentNode.jp.code}`;
        } else if (node.is(FunctionEntryNode.TypeGuard)) {
            const functionEntryNode = node.as(FunctionEntryNode.Class);
            label = `Function Entry\n(${functionEntryNode.jp.name})`;
        } else if (node.is(FunctionExitNode.TypeGuard)) {
            const functionExitNode = node.as(FunctionExitNode.Class);
            label = `Function Exit\n(${functionExitNode.jp.name})`;
        } else if (node.is(ScopeStartNode.TypeGuard)) {
            label = `Scope Start`;
        } else if (node.is(ScopeEndNode.TypeGuard)) {
            label = `Scope End`;
        } else if (node.is(StatementNode.TypeGuard)) {
            const statementNode = node.as(StatementNode.Class);
            label = `Statement:\n${statementNode.jp.code}`;
        } else if (node.is(StatementNode.TypeGuard)) {
            const statementNode = node.as(StatementNode.Class);
            label = `Statement:\n${statementNode.jp.code}`;
        } else if (node.is(UnknownInstructionNode.TypeGuard)) {
            const unknownInstructionNode = node.as(UnknownInstructionNode.Class);
            if (unknownInstructionNode.jp !== undefined) {
                label = `Unknown Instruction:\n${unknownInstructionNode.jp.code}`;
            } else {
                label = `Unknown Instruction`;
            }
        } else {
            label = "Not flow node";
        }

        return {
            id: node.id,
            attrs: {
                label,
                shape,
            },
        };
    }

    override formatEdge(edge: BaseEdge.Class): DotFormatter.Edge {
        return {
            source: edge.source.id,
            target: edge.target.id,
            attrs: {},
        };
    }
}