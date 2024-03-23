import Edge from "clava-flow/graph/Edge";
import Graph from "clava-flow/graph/Graph";
import Node from "clava-flow/graph/Node";


abstract class DotFormatter {
    static defaultGraphName: string = "clava_graph";

    abstract formatNode(node: Node.Class): DotFormatter.Node;

    abstract formatEdge(edge: Edge): DotFormatter.Edge;

    static #sanitizeDotLabel(label: string) {
        return label.replaceAll("\n", "\\l").replaceAll("\r", "");
    }

    #formatAttrs(attrs: [string, string][]): string {
        return attrs
            .map(([key, value]) => `${key}="${DotFormatter.#sanitizeDotLabel(value)}"`)
            .join(" ");
    }

    format(graph: Graph, label?: string): string {
        const graphName = label ?? DotFormatter.defaultGraphName;

        const nodes = graph.nodes
            .map((node) => {
                const { id, attrs } = this.formatNode(node);
                const formattedAttrs = this.#formatAttrs(Object.entries(attrs));
                return `"${id}" [${formattedAttrs}];\n`;
            })
            .join("");

        const edges = graph.edges
            .map((edge) => {
                const { source, target, attrs } = this.formatEdge(edge);
                const formattedAttrs = this.#formatAttrs(Object.entries(attrs));

                return `"${source}" -> "${target}" [${formattedAttrs}];\n`;
            })
            .join("");

        return `digraph ${graphName} {\n${nodes}${edges}}\n`;
    }
}

namespace DotFormatter {
    export interface Attrs {
        label: string;
        shape: string;
        [key: string]: string;
    }

    export interface Node {
        id: string;
        attrs: {
            label: string;
            shape: string;
            [key: string]: string;
        };
    }

    export interface Edge {
        source: string;
        target: string;
        attrs: {
            label: string;
            [key: string]: string;
        };
    }
}

export default DotFormatter;
