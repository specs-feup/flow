Boilerplate to extend a Node:

```typescript
// Replace SUBNODE with node class name
// Replace SUPERNODE with parent node class name
class SUBNODE<
    D extends WithId<SUBNODE.Data> = WithId<SUBNODE.Data>,
    S extends SUBNODE.ScratchData = SUBNODE.ScratchData,
> extends SUPERNODE<D, S> {
    // If this is an "abstract" Node type with subtypes, you may ommit the `build` method
    static build(/* build arguments */): Node.Builder<SUBNODE.Data, SUBNODE.ScratchData, SUBNODE> {
        const s = super.build(/* superclass build arguments */);
        return {
            data: {
                ...s.data,
                // Add fields here
            },
            scratchData: {
                ...s.scratchData,
                // Add fields here
            },
            className: this,
        };
    }

    // Add utility methods here - it is encouraged to add methods to manipulate the node's data
    // so that the use of `.data()` can be avoided
}

namespace SUBNODE {
    export interface Data extends Node.Data {
        // Add fields here
    }

    export interface ScratchData extends Node.ScratchData {
        // Add fields here
    }
}
```

Boilerplate to extend an Edge:
    
```typescript
// Replace SUBEDGE with edge class name
// Replace SUPERNODE with parent node class name
class SUBEDGE<
    D extends Edge.WithId<SUBEDGE.Data> = Edge.WithId<SUBEDGE.Data>,
    S extends Edge.ScratchData = Edge.ScratchData,
> extends SUPEREDGE<D, S> {
    // If this is an "abstract" Edge type with subtypes, you may ommit the `build` method
    static build(/* build arguments */): Edge.Builder<SUBEDGE.Data, SUBEDGE.ScratchData, SUBEDGE> {
        const s = super.build(/* superclass build arguments */);
        return {
            data: {
                ...s.data,
                // Add fields here
            },
            scratchData: {
                ...s.scratchData,
                // Add fields here
            },
            className: this,
        };
    }

    // Add utility methods here - it is encouraged to add methods to manipulate the edge's data
    // so that the use of `.data()` can be avoided
}

namespace SUBEDGE {
    export interface Data extends Edge.Data {
        // Add fields here
    }

    export interface ScratchData extends Edge.ScratchData {
        // Add fields here
    }
}
```

Boilerplate to extend a Graph:

```typescript
// Replace SUBEDGE with edge class name
// Replace SUPERNODE with parent node class name
class SUBGRAPH<
    D extends SUBGRAPH.Data = SUBGRAPH.Data,
    S extends SUBGRAPH.ScratchData = SUBGRAPH.ScratchData,
> extends SUPERGRAPH<D, S> {
    // Add utility methods here - it is encouraged to add methods to manipulate the edge's data
    // so that the use of `.data()` can be avoided
}

namespace SUBGRAPH {
    export interface Data {
        // Add fields here
    }

    export interface ScratchData {
        // Add fields here
    }
}
```
