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
} from "clava-js/api/Joinpoints.js";
import Query from "lara-js/api/weaver/Query.js";
import UnknownInstructionNode from "clava-flow/flow/node/instruction/UnknownInstructionNode";

export default class FlowGraphGenerator {
    #$jp: Joinpoint;
    #graph: FlowGraph.Class;
    // #idGenerator: IdGenerator;

    constructor(
        $jp: Joinpoint,
        graph: FlowGraph.Class,
        // deterministicIds: boolean = false,
    ) {
        this.#$jp = $jp;
        this.#graph = graph;
        // this.#idGenerator = deterministicIds
        //     ? new SequentialIdGenerator()
        //     : new UndefinedGenerator();
    }

    #processJp($jp: Joinpoint) {
        if ($jp instanceof Program || $jp instanceof FileJp) {
            for (const $function of Query.searchFrom($jp, "function", {
                isImplementation: true,
            })) {
                this.#processJp($function as Joinpoint);
            }
        } else if ($jp instanceof FunctionJp) {
            const [function_entry, function_exit] = this.#graph.addFunctionPair($jp);

            for (const param of $jp.params) {
                // TODO not UnknownInstructionNode
                const param_node = this.#graph
                    .addNode()
                    .init(new UnknownInstructionNode.Builder(param))
                    .as(UnknownInstructionNode.Class);
                function_exit.insertBefore(param_node);
            }

            // TODO
            this.#processJp($jp.body);
            // const currNode = this.#graph.addNode($jp.body.code).init(new BaseNode.Builder);
        } else if ($jp instanceof Scope) {
            const [scope_start, scope_end] = this.#graph.addScopePair($jp);
            console.log($jp.dump);
            for (const child of $jp.children) {
                
                const node = this.#graph.addNode().init(new UnknownInstructionNode.Builder(child)).as(UnknownInstructionNode.Class);
                scope_end.insertBefore(node);
            }
        } else if ($jp instanceof WrapperStmt) {
            if ($jp.kind === "comment") {

            } else if ($jp.kind === "pragma") {

            }
        } else if ($jp instanceof DeclStmt) {

        } else if ($jp instanceof EmptyStmt) {
        } else if ($jp instanceof LabelStmt) {

        } else if ($jp instanceof ExprStmt) {
        } else if ($jp instanceof If) {

        } else if ($jp instanceof Loop) {
        
        } else if ($jp instanceof Switch) {

        } else if ($jp instanceof Case) {

        } else if ($jp instanceof ReturnStmt) {

        } else if ($jp instanceof Break) {

        } else if ($jp instanceof Continue) {

        } else if ($jp instanceof GotoStmt) {

        
            
        } else {
            // TODO maybe be silent when inside recursive calls?
            throw new Error(`Cannot build graph for joinpoint "${$jp.joinPointType}"`);
        }
    }

    build(): FlowGraph.Class {
        this.#processJp(this.#$jp);

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

    // /**
    //  * Connects the leader statement nodes according to their type
    //  */
    // #connectNodes() {
    //     // Connect start
    //     let $firstStatement = this.#$jp;

    //     if (!($firstStatement instanceof Statement)) {
    //         throw new Error(
    //             "Not defined how to connect the Start node to an AST node of type " +
    //                 this.#$jp.joinPointType,
    //         );
    //     }

    //     const firstStatementNode = this.nodes.get($firstStatement.astId);

    //     if (firstStatementNode === undefined) {
    //         throw new Error(
    //             "Node for first statement of scope is undefined: " + $firstStatement.astId,
    //         );
    //     }

    //     // Add edge
    //     this.#graph.addEdge(this.#startNode, firstStatementNode);

    //     for (const astId of this.nodes.keys()) {
    //         const node = this.nodes.get(astId);

    //         if (node === undefined) {
    //             throw new Error("Node is undefined for astId " + astId);
    //         }

    //         const nodeData = node.data() as CfgNodeData;
    //         const nodeStmt = nodeData.nodeStmt;

    //         if (nodeStmt === undefined) {
    //             throw new Error("Node statement is undefined");
    //         }

    //         // Only add connections for astIds of leader statements
    //         if (nodeStmt.astId !== astId) {
    //             continue;
    //         }

    //         const nodeType = nodeData.type;

    //         if (nodeType === undefined) {
    //             throw new Error("Node type is undefined: ");
    //         }

    //         switch (nodeType) {
    //             case CfgNodeType.IF:
    //                 this.#connectIfNode(node);
    //                 break;
    //             case CfgNodeType.LOOP:
    //                 this.#connectLoopNode(node);
    //                 break;
    //             case CfgNodeType.COND:
    //                 this.#connectCondNode(node);
    //                 break;
    //             case CfgNodeType.BREAK:
    //                 this.#connectBreakNode(node);
    //                 break;
    //             case CfgNodeType.CONTINUE:
    //                 this.#connectContinueNode(node);
    //                 break;
    //             case CfgNodeType.SWITCH:
    //                 this.#connectSwitchNode(node);
    //                 break;
    //             case CfgNodeType.CASE:
    //                 this.#connectCaseNode(node);
    //                 break;
    //             case CfgNodeType.INIT:
    //                 this.#connectInitNode(node);
    //                 break;
    //             case CfgNodeType.STEP:
    //                 this.#connectStepNode(node);
    //                 break;
    //             case CfgNodeType.INST_LIST:
    //                 this.#connectInstListNode(node);
    //                 break;
    //             case CfgNodeType.RETURN:
    //                 this.#connectReturnNode(node);
    //                 break;
    //             case CfgNodeType.SCOPE:
    //             case CfgNodeType.THEN:
    //             case CfgNodeType.ELSE:
    //                 this.#connectScopeNode(node);
    //                 break;
    //         }
    //     }
    // }

    // #clean() {
    //     // Remove temporary instructions from the code
    //     for (const stmtId in this.#temporaryStmts) {
    //         this.#temporaryStmts[stmtId].detach();
    //     }

    //     // Remove temporary instructions from the instList nodes and this.#nodes
    //     for (const node of this.nodes.values()) {
    //         const nodeData = node.data() as InstListNodeData;

    //         // Only inst lists need to be cleaned
    //         if (nodeData.type !== CfgNodeType.INST_LIST) {
    //             const tempStmts = nodeData.stmts.filter(
    //                 ($stmt) => this.#temporaryStmts[$stmt.astId] !== undefined,
    //             );
    //             if (tempStmts.length > 0) {
    //                 console.log(
    //                     "Node '" +
    //                         nodeData.type.toString() +
    //                         "' has temporary stmts: " +
    //                         tempStmts.toString(),
    //                 );
    //             }
    //             continue;
    //         }

    //         // Filter stmts that are temporary statements

    //         const filteredStmts = [];
    //         for (const $stmt of nodeData.stmts) {
    //             // If not a temporary stmt, add to filtered list
    //             if (this.#temporaryStmts[$stmt.astId] === undefined) {
    //                 filteredStmts.push($stmt);
    //             }
    //             // Otherwise, remove from this.#nodes
    //             else {
    //                 this.nodes.delete($stmt.astId);
    //             }
    //         }

    //         if (filteredStmts.length !== nodeData.stmts.length) {
    //             nodeData.stmts = filteredStmts;
    //         }
    //     }

    //     // Remove empty instList CFG nodes
    //     for (const node of this.#graph.nodes()) {
    //         const nodeData = node.data() as CfgNodeData;

    //         // Only nodes that are inst lists
    //         if (nodeData.type !== CfgNodeType.INST_LIST) {
    //             continue;
    //         }

    //         // Only empty nodes
    //         if (nodeData.stmts.length > 0) {
    //             continue;
    //         }

    //         // Remove node, replacing the connections with a new connection of the same type and the incoming edge
    //         // of the node being removed
    //         Graphs.removeNode(
    //             this.#graph,
    //             node,
    //             (incoming) => new CfgEdge((incoming.data() as CfgEdge).type),
    //         );
    //     }

    //     // Remove nodes that have no incoming edge and are not start
    //     for (const node of this.#graph.nodes()) {
    //         const nodeData = node.data() as CfgNodeData;

    //         // Only nodes that are not start
    //         if (nodeData.type === CfgNodeType.START) {
    //             continue;
    //         }

    //         // Ignore nodes with incoming edges
    //         if (node.incomers().length > 0) {
    //             continue;
    //         }

    //         // Remove node
    //         debug(
    //             "[CfgBuilder] Removing statement that is not executed (e.g. is after a return): " +
    //                 nodeData.stmts.toString(),
    //         );

    //         // Removes nodes. As there are no incoming edges, the edge handler is a dummy as it is not called
    //         Graphs.removeNode(
    //             this.#graph,
    //             node,
    //             () => new CfgEdge(CfgEdgeType.UNCONDITIONAL),
    //         );
    //     }
    // }
}
