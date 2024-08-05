import BaseEdge from "lara-flow/graph/BaseEdge";
import BaseNode from "lara-flow/graph/BaseNode";
import Node from "lara-flow/graph/Node";

/**
 * Represents a visit to a node during Dijkstra's algorithm.
 */
export interface DijkstraSearchVisit extends Node.SearchVisit {
    /**
     * The minimum weight from the root node to the current node.
     */
    distance: number;
}

/**
 * Performs Dijsktra's algorithm lazily, yielding one node visit at a time.
 *
 * Can have a custom propagation function to determine which edges to follow,
 * effectively pruning the search tree.
 *
 * Can be set to be undirected, in which case it will also use incoming edges
 * to traverse the graph, disregarding edge direction.
 * 
 * Weights must be non-negative.
 *
 * @todo This implementation uses an array, which is not efficient. A better
 * data structure should be used instead.
 */
export default class DijkstraSearch implements Node.Search<DijkstraSearchVisit> {
    /**
     * A function that returns the weight of an edge. Must not return negative values.
     */
    weight: (edge: BaseEdge.Class) => number;
    /**
     * A function that determines whether to propagate a given edge.
     */
    propagate: (edge: BaseEdge.Class) => boolean;
    /**
     * Whether the search is to be considered directed or undirected.
     */
    directed: boolean;

    /**
     * Creates a new Dijsktra's algorithm.
     *
     * @param weight A function that returns the weight of an edge. Must not return negative values.
     * By default, all edges have a weight of 1.
     * @param propagate A function that determines whether to propagate a given edge.
     */
    constructor(
        weight?: (edge: BaseEdge.Class) => number,
        propagate?: (edge: BaseEdge.Class) => boolean,
    ) {
        this.weight = weight ?? (() => 1);
        this.propagate = propagate ?? (() => true);
        this.directed = true;
    }

    /**
     * Sets the weight function for the edges.
     * The weight function should return a number that represents the weight of the edge.
     *
     * @param weight The weight function to set. Must not return negative values.
     * @returns This search instance, for chaining.
     */
    setWeight(weight: (edge: BaseEdge.Class) => number): this {
        this.weight = weight;
        return this;
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
     *
     * @returns This search instance, for chaining.
     */
    undirected(): this {
        this.directed = false;
        return this;
    }

    *search(root: BaseNode.Class): Generator<DijkstraSearchVisit> {
        const distances = new Map<string, number>();
        const paths = new Map<string, BaseEdge.Class[]>();
        const queue: BaseNode.Class[] = [root];
        const visited: Set<string> = new Set();
        distances.set(root.id, 0);
        paths.set(root.id, []);
        let index = 0;

        const enqueue = (n: BaseNode.Class, distance: number) => {
            for (let i = 0; i < queue.length; i++) {
                if (queue[i].id === n.id) {
                    queue.splice(i, 1);
                }
            }
            for (let i = 0; i < queue.length; i++) {
                if (distances.get(queue[i].id)! > distance) {
                    queue.splice(i, 0, n);
                    return;
                }
            }
            queue.push(n);
        };

        while (queue.length > 0) {
            const closest = queue.shift()!;
            
            yield { node: closest, path: paths.get(closest.id)!, index, distance: distances.get(closest.id)! };
            index++;
            visited.add(closest.id);

            let neighbors: [BaseEdge.Class, BaseNode.Class][] = closest.outgoers.toArray().map(e => [e, e.target]);
            if (!this.directed) {
                const incomers: [BaseEdge.Class, BaseNode.Class][] = closest.incomers.toArray().map(e => [e, e.source]);
                neighbors.push(...incomers);
            }
            neighbors = neighbors.filter(([e, n]) => this.propagate(e) && !visited.has(n.id));
            for (const [e, neighbor] of neighbors) {
                const bestDist = distances.get(neighbor.id);
                const newDist = distances.get(closest.id)! + this.weight(e);
                
                if (bestDist === undefined || newDist < bestDist) {
                    distances.set(neighbor.id, newDist);
                    paths.set(neighbor.id, [...paths.get(closest.id)!, e]);
                    enqueue(neighbor, newDist);
                }
            }
        }
    }
}
