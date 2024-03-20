import { Comment, Joinpoint } from "clava-js/api/Joinpoints.js";
import ClavaJoinPoints from "clava-js/api/clava/ClavaJoinPoints.js";

export type JoinpointInserter = ($jp: Joinpoint) => Joinpoint;

export default class TemporaryJoinpointsBuilder {
    #$jps: Map<string, Joinpoint>;

    constructor() {
        this.#$jps = new Map();
    }

    new(inserter: JoinpointInserter, $jp: Joinpoint): Joinpoint {
        const $newJp = inserter($jp);
        this.#$jps.set($newJp.astId, $newJp);
        return $newJp;
    }

    newComment(inserter: JoinpointInserter, comment: string): Comment {
        return this.new(inserter, ClavaJoinPoints.comment(comment)) as Comment;
    }

    clean() {
        for (const $jp of this.#$jps.values()) {
            $jp.detach();
        }

        // Remove temporary instructions from the instList nodes and this.#nodes
        // for (const node of this.nodes.values()) {
        //     const nodeData = node.data() as InstListNodeData;

        //     // Only inst lists need to be cleaned
        //     if (nodeData.type !== CfgNodeType.INST_LIST) {
        //         const tempStmts = nodeData.stmts.filter(
        //             ($stmt) => this.#temporaryStmts[$stmt.astId] !== undefined,
        //         );
        //         if (tempStmts.length > 0) {
        //             console.log(
        //                 "Node '" +
        //                     nodeData.type.toString() +
        //                     "' has temporary stmts: " +
        //                     tempStmts.toString(),
        //             );
        //         }
        //         continue;
        //     }

        //     // Filter stmts that are temporary statements

        //     const filteredStmts = [];
        //     for (const $stmt of nodeData.stmts) {
        //         // If not a temporary stmt, add to filtered list
        //         if (this.#temporaryStmts[$stmt.astId] === undefined) {
        //             filteredStmts.push($stmt);
        //         }
        //         // Otherwise, remove from this.#nodes
        //         else {
        //             this.nodes.delete($stmt.astId);
        //         }
        //     }

        //     if (filteredStmts.length !== nodeData.stmts.length) {
        //         nodeData.stmts = filteredStmts;
        //     }
        // }
    }
}
