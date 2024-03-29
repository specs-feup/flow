import ControlFlowEdge from "clava-flow/flow/edge/ControlFlowEdge";
import FlowNode from "clava-flow/flow/node/FlowNode";
import BaseEdge from "clava-flow/graph/BaseEdge";
import BaseNode from "clava-flow/graph/BaseNode";
import { NodeBuilder, NodeTypeGuard } from "clava-flow/graph/Node";
import { Joinpoint } from "clava-js/api/Joinpoints.js";

namespace InstructionNode {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends FlowNode.Class<D, S> {
        get nextEdge(): ControlFlowEdge.Class | undefined {
            if (this.data.nextEdgeId === undefined) {
                return undefined;
            }
            // Data and scratchdata should be BaseEdge
            const edge = this.graph.getEdgeById(this.data.nextEdgeId);

            if (edge === undefined) {
                this.data.nextEdgeId = undefined;
                return undefined;
            }

            return (
                edge as BaseEdge.Class<ControlFlowEdge.Data, ControlFlowEdge.ScratchData>
            ).as(ControlFlowEdge.Class);
        }

        set nextEdge(edge: ControlFlowEdge.Class | undefined) {}

        get nextNode(): BaseNode.Class | undefined {
            return this.nextEdge?.target;
        }

        set nextNode(node: BaseNode.Class | undefined) {
            if (this.nextEdge === undefined && node === undefined) {
            } else if (this.nextEdge === undefined && node !== undefined) {
                this.nextEdge = this.graph
                    .addEdge(this, node)
                    .init(new ControlFlowEdge.Builder());
            } else if (this.nextEdge !== undefined && node === undefined) {
            } else {
            }
        }
    }

    export abstract class Builder
        extends FlowNode.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        #instructionFlowNodeType: Type;

        constructor(type: Type, $jp?: Joinpoint) {
            super(FlowNode.Type.INSTRUCTION, $jp);
            this.#instructionFlowNodeType = type;
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...(super.buildData(data) as FlowNode.Data & {
                    flowNodeType: FlowNode.Type.INSTRUCTION;
                }),
                instructionFlowNodeType: this.#instructionFlowNodeType,
                nextEdgeId: undefined,
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!FlowNode.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            if (d.flowNodeType !== FlowNode.Type.INSTRUCTION) return false;
            if (!Object.values(Type).includes(d.instructionFlowNodeType as Type))
                return false;
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!FlowNode.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            return true;
        },
    };

    export interface Data extends FlowNode.Data {
        flowNodeType: FlowNode.Type.INSTRUCTION;
        instructionFlowNodeType: Type;
        nextEdgeId: string | undefined;
    }

    export interface ScratchData extends FlowNode.ScratchData {}

    // ------------------------------------------------------------

    export enum Type {
        FUNCTION_ENTRY = "function_entry",
        FUNCTION_EXIT = "function_exit",
        SCOPE_START = "scope_start",
        SCOPE_END = "scope_end",
        STATEMENT = "statement",
        COMMENT = "comment",
        UNKNOWN = "unknown",
    }
}

export default InstructionNode;
