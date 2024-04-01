import FlowGraph from "clava-flow/flow/FlowGraph";
import {
    FunctionJp,
    Joinpoint,
    Program,
    FileJp,
    Scope,
    WrapperStmt,
    DeclStmt,
    Empty,
    EmptyStmt,
    ExprStmt,
    If,
    Loop,
    Switch,
    Case,
    ReturnStmt,
    Break,
    Continue,
    GotoStmt,
    LabelStmt,
    Comment,
} from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import UnknownInstructionNode from "clava-flow/flow/node/instruction/UnknownInstructionNode";
import CommentNode from "clava-flow/flow/node/instruction/CommentNode";
import FlowNode from "clava-flow/flow/node/FlowNode";
import ConditionNode from "clava-flow/flow/node/condition/ConditionNode";
import BaseNode from "clava-flow/graph/BaseNode";

interface ProcessJpResult {
    headNode: FlowNode.Class;
    tailNodes: FlowNode.Class[];
}

interface ProcessJpContext {
    continueNode?: FlowNode.Class;
    breakNode?: FlowNode.Class;
    caseNodes?: FlowNode.Class[];
    returnNode?: FlowNode.Class;
}

function newProcessJpResult(
    headNode: FlowNode.Class,
    tailNodes?: FlowNode.Class[],
): ProcessJpResult {
    if (tailNodes === undefined) {
        tailNodes = [headNode];
    }
    return { headNode, tailNodes };
}

export default class FlowGraphGenerator {
    #$jp: Joinpoint;
    #graph: FlowGraph.Class;
    #temporaryNodes: UnknownInstructionNode.Class[];
    // #idGenerator: IdGenerator;

    constructor(
        $jp: Program | FileJp | FunctionJp,
        graph: FlowGraph.Class,
        // deterministicIds: boolean = false,
    ) {
        this.#$jp = $jp;
        this.#graph = graph;
        this.#temporaryNodes = [];
        // this.#idGenerator = deterministicIds
        //     ? new SequentialIdGenerator()
        //     : new UndefinedGenerator();
    }

    #createTemporaryNode(): UnknownInstructionNode.Class {
        const node = this.#graph
            .addNode()
            .init(new UnknownInstructionNode.Builder())
            .as(UnknownInstructionNode.Class);
        this.#temporaryNodes.push(node);
        return node;
    }

    #processJp($jp: Joinpoint, context?: ProcessJpContext): ProcessJpResult {
        if ($jp instanceof FunctionJp) {
            // TODO instead of this create an "addFunction" that accepts parameters and body
            //      same for scope
            const [function_entry, function_exit] = this.#graph.addFunctionPair($jp);

            for (const param of $jp.params) {
                // TODO VarDeclNode
                const param_node = this.#graph
                    .addNode()
                    .init(new UnknownInstructionNode.Builder(param))
                    .as(UnknownInstructionNode.Class);
                function_exit.insertBefore(param_node);
            }

            const body = this.#processJp($jp.body, { returnNode: function_exit });
            // TODO not good to insert before, due to returns
            function_exit.insertSubgraphBefore(body.headNode, body.tailNodes);

            return newProcessJpResult(function_entry, [function_exit]);
        } else if ($jp instanceof Scope) {
            const [scope_start, scope_end] = this.#graph.addScopePair($jp);
            for (const child of $jp.children) {
                const processedChild = this.#processJp(child as Joinpoint, context);
                scope_end.insertSubgraphBefore(
                    processedChild.headNode,
                    processedChild.tailNodes,
                );
            }

            return newProcessJpResult(scope_start, [scope_end]);
        } else if ($jp instanceof WrapperStmt) {
            if ($jp.kind === "comment") {
                const node = this.#graph
                    .addNode()
                    .init(new CommentNode.Builder($jp.content as Comment))
                    .as(CommentNode.Class);

                return newProcessJpResult(node);
            } else if ($jp.kind === "pragma") {
                // TODO PragmaNode
                const node = this.#graph
                    .addNode()
                    .init(new UnknownInstructionNode.Builder($jp.content))
                    .as(UnknownInstructionNode.Class);

                return newProcessJpResult(node);
            } else {
                throw new Error(
                    `Cannot build graph for wrapper statement "${$jp.joinPointType}:${$jp.kind}"`,
                );
            }
        } else if ($jp instanceof DeclStmt) {
            // TODO VarDeclNode
            const node = this.#graph
                .addNode()
                .init(new UnknownInstructionNode.Builder($jp))
                .as(UnknownInstructionNode.Class);

            return newProcessJpResult(node);
        } else if ($jp instanceof EmptyStmt) {
            // TODO not Unknown
            const node = this.#graph
                .addNode()
                .init(new UnknownInstructionNode.Builder($jp))
                .as(UnknownInstructionNode.Class);

            return newProcessJpResult(node);
        } else if ($jp instanceof LabelStmt) {
            // TODO not Unknown
            const node = this.#graph
                .addNode()
                .init(new UnknownInstructionNode.Builder($jp))
                .as(UnknownInstructionNode.Class);

            return newProcessJpResult(node);
        } else if ($jp instanceof ExprStmt) {
            // TODO not Unknown
            const node = this.#graph
                .addNode()
                .init(new UnknownInstructionNode.Builder($jp))
                .as(UnknownInstructionNode.Class);

            return newProcessJpResult(node);
        } else if ($jp instanceof If) {
            const $cond = $jp.cond;
            const $iftrue = $jp.then as Scope;
            // Type conversion necessary because the return type is incorrect
            const $iffalse = $jp.else as Scope | undefined;

            const iftrue = this.#processJp($iftrue, context);

            let iffalse: ProcessJpResult;
            if ($iffalse !== undefined) {
                iffalse = this.#processJp($iffalse, context);
            } else {
                iffalse = newProcessJpResult(this.#createTemporaryNode());
            }

            const node = this.#graph.addCondition($jp, iftrue.headNode, iffalse.headNode);

            return newProcessJpResult(node, [...iftrue.tailNodes, ...iffalse.tailNodes]);
        } else if ($jp instanceof Loop) {
            const continueNode = this.#createTemporaryNode();
            const breakNode = this.#createTemporaryNode();
            const body = this.#processJp($jp.body, {
                ...context,
                breakNode,
                continueNode,
            });

            // TODO
            // if ($jp.kind !== "foreach") {
            //     const cond = this.#processJp($jp.cond, context);
            // }

            const node = this.#graph.addLoop(
                $jp,
                body.headNode,
                body.tailNodes,
                breakNode,
            );

            let head: FlowNode.Class;
            if ($jp.kind === "for") {
                const init = this.#processJp($jp.init, context);
                const step = this.#processJp($jp.step, context);
                continueNode.insertBefore(init.headNode);
                node.insertBefore(step.headNode);

                head = init.headNode;
            } else if ($jp.kind == "dowhile") {
                head = body.headNode;
            } else if ($jp.kind == "while") {
                head = continueNode;
            } else {
                // TODO perguntar ao stor como fazer com o foreach
                throw new Error(`Unsupported loop kind "${$jp.kind}"`);
            }

            node.insertBefore(continueNode);

            return newProcessJpResult(head, [breakNode]);
        } else if ($jp instanceof Switch) {
            const $cond = $jp.condition;
            const $body = $jp.getChild(1);

            const node = this.#graph
                .addNode()
                .init(new UnknownInstructionNode.Builder($jp))
                .as(UnknownInstructionNode.Class);

            // TODO process cases

            const body = this.#processJp($body);
            body.headNode.insertBefore(node);
            return newProcessJpResult(node, body.tailNodes);
        } else if ($jp instanceof Case) {
            // TODO not Unknown
            const node = this.#graph
                .addNode()
                .init(new UnknownInstructionNode.Builder($jp))
                .as(UnknownInstructionNode.Class);

            return newProcessJpResult(node);
        } else if ($jp instanceof ReturnStmt) {
            return newProcessJpResult({} as any, []);
        } else if ($jp instanceof Break) {
            return newProcessJpResult({} as any, []);
        } else if ($jp instanceof Continue) {
            return newProcessJpResult({} as any, []);
        } else if ($jp instanceof GotoStmt) {
            return newProcessJpResult({} as any, []);
        } else {
            // TODO maybe be silent when inside recursive calls?
            throw new Error(`Cannot build graph for joinpoint "${$jp.joinPointType}"`);
        }
    }

    build(): FlowGraph.Class {
        if (this.#$jp instanceof Program || this.#$jp instanceof FileJp) {
            for (const $function of Query.searchFrom(this.#$jp, "function", {
                isImplementation: true,
            })) {
                this.#processJp($function as Joinpoint);
            }
        } else if (this.#$jp instanceof FunctionJp) {
            this.#processJp(this.#$jp);
        }

        // this.#addScopeAuxComments();
        // this.#createNodes();

        // this._fillNodes();
        // this.#connectNodes();

        // this.#clean();

        // TODO: Check graph invariants
        // 1. Each node has either one unconditional outgoing edge,
        // or two outgoing edges that must be a pair true/false,
        // or if there is no outgoing edge must be the end node

        return this.#graph;
    }

    // /**
    //  * Inserts comments that specify the beginning and end of a scope
    //  */
    // #addScopeAuxComments() {
    //     for (const $jp of this.#$jp.descendants) {
    //         if ($jp instanceof Scope) {
    //             this.#temporaryJpBuilder.newComment($jp.insertBegin, "SCOPE_START");
    //             this.#temporaryJpBuilder.newComment($jp.insertEnd, "SCOPE_END");
    //         }
    //     }
    // }

    // /**
    //  * Creates nodes (except start and end), with only the leader statement
    //  */
    // #createNodes() {
    //     for (const $jp of Query.searchFromInclusive(this.#$jp, "statement")) {
    //         const $stmt = $jp as Statement;
    //         this.#addNode($stmt);
    //     }
    // }

    // /**
    //  * Returns the node corresponding to this statement, or creates a new one if one does not exist yet.
    //  */
    // #addNode($stmt: Statement) {
    //     if (this.nodes.get($stmt.astId) !== undefined) {
    //         return;
    //     }

    //     const nodeType = CfgUtils.getNodeType($stmt);
    //     const nodeId = this.#idGenerator.next();

    //     const node = this.#graph.addNode(this.dataFactory.newData(nodeType, $stmt, nodeId, this.#splitInstList));

    //     // Associate all statements of graph node
    //     for (const $nodeStmt of (node.data() as CfgNodeData).stmts) {
    //         // Check if it has not been already added
    //         if (this.nodes.get($nodeStmt.astId) !== undefined) {
    //             throw new Error(`Adding mapping twice for statement ${$nodeStmt.astId}@${$nodeStmt.location}`);
    //         }

    //         this.nodes.set($nodeStmt.astId, node);
    //     }
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "if" statement.
    //  * @param node - Node whose type is "IF"
    //  */
    // #connectIfNode(node: cytoscape.NodeSingular) {
    //     const ifStmt = (node.data() as IfData).if;

    //     if (ifStmt === undefined) {
    //         throw new Error("If statement is undefined");
    //     }

    //     const thenStmt = ifStmt.then;

    //     if (thenStmt === undefined) {
    //         throw new Error("Then statement is undefined");
    //     }

    //     const thenNode = this.nodes.get(thenStmt.astId);

    //     if (thenNode === undefined) {
    //         throw new Error("Node for then statement is undefined: " + thenStmt.astId);
    //     }

    //     this.addEdge(node, thenNode, CfgEdgeType.TRUE);

    //     const elseStmt = ifStmt.else;

    //     if (elseStmt !== undefined) {
    //         const elseNode = this.nodes.get(elseStmt.astId);

    //         if (elseNode === undefined) {
    //             throw new Error(
    //                 "Node for else statement is undefined: " + elseStmt.astId,
    //             );
    //         }

    //         this.addEdge(node, elseNode, CfgEdgeType.FALSE);
    //     } else {
    //         // Usually there should always be a sibling, because of inserted comments
    //         // However, if an arbitary statement is given as the starting point,
    //         // sometimes there might not be nothing after. In this case, connect to the
    //         // end node.
    //         const afterNode = this.#nextNodes.nextExecutedNode(ifStmt);

    //         // Add edge
    //         this.addEdge(node, afterNode, CfgEdgeType.FALSE);
    //     }
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "loop" statement.
    //  * @param node - Node whose type is "LOOP"
    //  */
    // #connectLoopNode(node: cytoscape.NodeSingular) {
    //     const $loop = (node.data() as LoopData).loop;

    //     if ($loop === undefined) {
    //         throw new Error("Loop statement is undefined");
    //     }

    //     let afterStmt = undefined;

    //     switch ($loop.kind) {
    //         case "for":
    //             afterStmt = $loop.init;
    //             break;
    //         case "while":
    //             afterStmt = $loop.cond;
    //             break;
    //         case "dowhile":
    //             afterStmt = $loop.body;
    //             break;
    //         default:
    //             throw new Error("Case not defined for loops of kind " + $loop.kind);
    //     }

    //     const afterNode = this.nodes.get(afterStmt.astId) ?? this.#endNode;

    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * Connects a node associated with a statement that is part of a loop header and corresponds to the loop condition
    //  * @param node - Node whose type is "COND"
    //  */
    // #connectCondNode(node: cytoscape.NodeSingular) {
    //     // Get kind of loop
    //     const $condStmt = (node.data() as HeaderData).nodeStmt;

    //     if ($condStmt === undefined) {
    //         throw new Error("Cond statement is undefined");
    //     }

    //     const $loop = $condStmt.parent;

    //     if ($loop === undefined) {
    //         throw new Error("Loop is undefined");
    //     }

    //     if (!($loop instanceof Loop)) {
    //         throw new Error("$loop is not an instance of Loop");
    //     }

    //     // True - first stmt of the loop body
    //     const trueNode = this.nodes.get($loop.body.astId) ?? this.#endNode;
    //     this.addEdge(node, trueNode, CfgEdgeType.TRUE);

    //     // False - next stmt of the loop
    //     const falseNode = this.#nextNodes.nextExecutedNode($loop);

    //     // Create edge
    //     this.addEdge(node, falseNode, CfgEdgeType.FALSE);
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "break" statement.
    //  * @param node - Node whose type is "BREAK"
    //  */
    // #connectBreakNode(node: cytoscape.NodeSingular) {
    //     const $breakStmt = (node.data() as CfgNodeData<Break>).nodeStmt;

    //     if ($breakStmt === undefined) {
    //         throw new Error("Break statement is undefined");
    //     }

    //     const $loop = $breakStmt.getAncestor("loop") as Loop | undefined;

    //     if ($loop === undefined) {
    //         throw new Error("Loop is undefined");
    //     }

    //     const $switch = $breakStmt.getAncestor("switch") as Switch | undefined;

    //     if ($switch === undefined) {
    //         throw new Error("Switch is undefined");
    //     }

    //     const loopDepth = $loop !== undefined ? $loop.depth : -1;
    //     const switchDepth = $switch !== undefined ? $switch.depth : -1;
    //     let afterNode = undefined;

    //     if (loopDepth > switchDepth)
    //         // Statement is used to terminate a loop
    //         afterNode = this.#nextNodes.nextExecutedNode($loop);
    //     // Statement is used to exit a switch block
    //     else afterNode = this.#nextNodes.nextExecutedNode($switch);

    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "continue" statement.
    //  * @param node - Node whose type is "CONTINUE"
    //  */
    // #connectContinueNode(node: cytoscape.NodeSingular) {
    //     const $continueStmt = (node.data() as CfgNodeData<Continue>).nodeStmt;

    //     if ($continueStmt === undefined) {
    //         throw new Error("Continue statement is undefined");
    //     }

    //     const $loop = $continueStmt.getAncestor("loop") as Loop | undefined;

    //     if ($loop === undefined) {
    //         throw new Error("Loop is undefined");
    //     }

    //     const $afterStmt = $loop.kind === "for" ? $loop.step : $loop.cond;
    //     const afterNode = this.nodes.get($afterStmt.astId) ?? this.#endNode;

    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "switch" statement.
    //  * @param node - Node whose type is "SWITCH"
    //  */
    // #connectSwitchNode(node: cytoscape.NodeSingular) {
    //     const $switchStmt = (node.data() as SwitchData).switch;

    //     if ($switchStmt === undefined) {
    //         throw new Error("Switch statement is undefined");
    //     }

    //     let firstReachedCase = undefined;

    //     // The first reached case is the first non-default case.
    //     // If the switch only has one case statement, and it is the default case, then this default case will be the first reached case
    //     for (const $case of $switchStmt.cases) {
    //         firstReachedCase = this.nodes.get($case.astId);

    //         if (!$case.isDefault) {
    //             break;
    //         }
    //     }

    //     if (firstReachedCase) {
    //         this.addEdge(node, firstReachedCase, CfgEdgeType.UNCONDITIONAL);
    //     }
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "case" statement.
    //  * @param node - Node whose type is "CASE"
    //  */
    // #connectCaseNode(node: cytoscape.NodeSingular) {
    //     const $caseStmt = (node.data() as CaseData).case;

    //     if ($caseStmt === undefined) {
    //         throw new Error("Case statement is undefined");
    //     }

    //     const $switchStmt = $caseStmt.getAncestor("switch") as Switch | undefined;

    //     if ($switchStmt === undefined) {
    //         throw new Error("Switch statement is undefined");
    //     }

    //     const numCases = $switchStmt.cases.length;
    //     const hasIntermediateDefault =
    //         $switchStmt.hasDefaultCase && !$switchStmt.cases[numCases - 1].isDefault;

    //     // Connect the node to the first instruction to be executed
    //     const firstExecutedInst = this.#nextNodes.nextExecutedNode($caseStmt);
    //     if ($caseStmt.isDefault)
    //         this.addEdge(node, firstExecutedInst, CfgEdgeType.UNCONDITIONAL);
    //     else this.addEdge(node, firstExecutedInst, CfgEdgeType.TRUE);

    //     let falseNode = undefined;
    //     if ($caseStmt.nextCase !== undefined) {
    //         // Not the last case

    //         // If the next case is an intermediate default case, the node should be connected to the CASE node following the default case
    //         if (hasIntermediateDefault && $caseStmt.nextCase.isDefault)
    //             falseNode = this.nodes.get($caseStmt.nextCase.nextCase.astId);
    //         else if (!$caseStmt.isDefault)
    //             // Else, if it is not an intermediate default case, it should be connected to the next case
    //             falseNode = this.nodes.get($caseStmt.nextCase.astId);
    //     } else if (!$caseStmt.isDefault) {
    //         // Last case but not a default case

    //         // If switch statement has an intermediate default case, connect the current statement to the default case
    //         if (hasIntermediateDefault)
    //             falseNode = this.nodes.get($switchStmt.getDefaultCase.astId);
    //         // Else, connect it to the statement following the switch
    //         else falseNode = this.#nextNodes.nextExecutedNode($switchStmt);
    //     }

    //     if (falseNode !== undefined) this.addEdge(node, falseNode, CfgEdgeType.FALSE);
    // }

    // /**
    //  * Connects a node associated with a statement that is part of a loop header and corresponds to the loop initialization
    //  * @param node - Node whose type is "INIT"
    //  */
    // #connectInitNode(node: cytoscape.NodeSingular) {
    //     const $initStmt = (node.data() as HeaderData).nodeStmt;

    //     if ($initStmt === undefined) {
    //         throw new Error("Init statement is undefined");
    //     }

    //     const $loop = $initStmt.parent;

    //     if ($loop === undefined) {
    //         throw new Error("Loop is undefined");
    //     }

    //     if (!($loop instanceof Loop)) {
    //         throw new Error("$loop is not an instance of Loop");
    //     }

    //     if ($loop.kind !== "for") {
    //         throw new Error("Not implemented for loops of kind " + $loop.kind);
    //     }

    //     const $condStmt = $loop.cond;
    //     if ($condStmt === undefined) {
    //         throw new Error(
    //             "Not implemented when for loops do not have a condition statement",
    //         );
    //     }

    //     const afterNode = this.nodes.get($condStmt.astId) ?? this.#endNode;
    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * Connects a node associated with a statement that is part of a loop header and corresponds to the loop step
    //  * @param node - Node whose type is "STEP"
    //  */
    // #connectStepNode(node: cytoscape.NodeSingular) {
    //     // Get loop
    //     const $stepStmt = (node.data() as HeaderData).nodeStmt;

    //     if ($stepStmt === undefined) {
    //         throw new Error("Step statement is undefined");
    //     }

    //     const $loop = $stepStmt.parent;

    //     if ($loop === undefined) {
    //         throw new Error("Loop is undefined");
    //     }

    //     if (!($loop instanceof Loop)) {
    //         throw new Error("$loop is not an instance of Loop");
    //     }

    //     if ($loop.kind !== "for") {
    //         throw new Error("Not implemented for loops of kind " + $loop.kind);
    //     }

    //     const $condStmt = $loop.cond;
    //     if ($condStmt === undefined) {
    //         throw new Error(
    //             "Not implemented when for loops do not have a condition statement",
    //         );
    //     }

    //     const afterNode = this.nodes.get($condStmt.astId) ?? this.#endNode;
    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * @param node - Node whose type is "INST_LIST"
    //  */
    // #connectInstListNode(node: cytoscape.NodeSingular) {
    //     const $lastStmt = (node.data() as InstListNodeData).getLastStmt();

    //     if ($lastStmt === undefined) {
    //         throw new Error("Last statement is undefined");
    //     }

    //     const afterNode = this.#nextNodes.nextExecutedNode($lastStmt);
    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "return" statement.
    //  * @param node - Node whose type is "RETURN"
    //  */
    // #connectReturnNode(node: cytoscape.NodeSingular) {
    //     this.addEdge(node, this.#endNode, CfgEdgeType.UNCONDITIONAL);
    // }

    // /**
    //  * Connects a node associated with a statement that is an instance of a "scope" statement.
    //  * @param node - Node whose type is "SCOPE", "THEN" or "ELSE"
    //  */
    // #connectScopeNode(node: cytoscape.NodeSingular) {
    //     const $scope = (node.data() as ScopeNodeData).scope;

    //     // Scope connects to its own first statement that will be an INST_LIST
    //     const afterNode = this.nodes.get($scope.firstStmt.astId);

    //     if (afterNode === undefined) {
    //         throw new Error(
    //             "Node for first statement of scope is undefined: " +
    //                 $scope.firstStmt.astId,
    //         );
    //     }

    //     this.addEdge(node, afterNode, CfgEdgeType.UNCONDITIONAL);
    // }
}
