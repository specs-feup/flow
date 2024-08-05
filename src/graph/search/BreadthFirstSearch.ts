import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseNode from "lara-flow/graph/BaseNode";
import Node from "lara-flow/graph/Node";
        
/**
 * A breadth-first search algorithm.
 * 
 * Can have a custom propagation function to determine which edges to follow,
 * effectively pruning the search tree.
 * 
 * Can be set to be undirected, in which case it will also use incoming edges
 * to traverse the graph, disregarding edge direction.
 * 
 * @todo This implementation uses an array as a queue, which is not efficient.
 *      A proper queue implementation should be used instead.
 */
export default class BreadthFirstSearch implements Node.Search {
    /**
     * A function that determines whether to propagate a given edge.
     */
    propagate: (edge: BaseEdge.Class) => boolean;
    /**
     * Whether the search is to be considered directed or undirected.
     */
    directed: boolean;

    /**
     * Creates a new breadth-first search algorithm.
     *
     * @param propagate A function that determines whether to propagate a given edge.
     */
    constructor(propagate?: (edge: BaseEdge.Class) => boolean) {
        this.propagate = propagate ?? (() => true);
        this.directed = true;
    }

    /**
     * Sets the propagation function for the edges.
     * The propagation function should return a boolean that determines whether to propagate the edge.
     *
     * @param propagate The propagation function to set.
     * @returns This search instance, for chaining.
     */
    setPropagate(propagate: (edge: BaseEdge.Class) => boolean): this {
        this.propagate = propagate;
        return this;
    }

    /**
     * Sets the search to be undirected.
     * An undirected search may travel through edges in both directions,
     * so it can also use incoming edges.
     */
    undirected(): this {
        this.directed = false;
        return this;
    }

    *search(root: BaseNode.Class): Generator<Node.SearchVisit> {
        // Array of [node, path] pairs to visit
        // Initially we want to visit the root node
        const toVisit: [BaseNode.Class, BaseEdge.Class[]][] = [[root, []]];
        const visited = new Set();
        let index = 0;

        while (toVisit.length > 0) {
            const [node, path] = toVisit.shift()!;
            if (visited.has(node.id)) {
                continue;
            }
            if (path.length > 0 && !this.propagate(path[path.length - 1])) {
                continue;
            }

            yield { node, path, index };
            index++;
            visited.add(node.id);

            for (const e of node.outgoers) {
                toVisit.push([e.target, [...path, e]]);
            }
            if (!this.directed) {
                for (const e of node.incomers) {
                    toVisit.push([e.source, [...path, e]]);
                }
            }
        }
    }
}
