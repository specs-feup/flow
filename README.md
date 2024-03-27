Boilerplate to extend a Node:

```typescript
namespace __SUB_NODE__ {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends __SUPER_NODE__.Class<D, S> {
        /* Add methods here */
    }

    export class Builder
        extends __SUPER_NODE__.Builder
        implements NodeBuilder<Data, ScratchData>
    {
        constructor(/* ... */) {
            super(/* ... */);
            /* ... */
        }

        buildData(data: BaseNode.Data): Data {
            return {
                ...super.buildData(data),
                /* Build data fields here */
            };
        }

        buildScratchData(scratchData: BaseNode.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
                /* Build scratch data fields here */
            };
        }
    }

    export const TypeGuard: NodeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseNode.Data): data is Data {
            if (!__SUPER_NODE__.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            /* Add data checks here */
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseNode.ScratchData,
        ): scratchData is ScratchData {
            if (!__SUPER_NODE__.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            const s = scratchData as ScratchData;
            /* Add scratch data checks here */
            return true;
        },
    };

    export interface Data extends __SUPER_NODE__.Data {
        /* Add data fields here */
    }

    export interface ScratchData extends __SUPER_NODE__.ScratchData {
        /* Add scratch data fields here */
    }
}

export default __SUB_NODE__;
```

Boilerplate to extend an Edge:
    
```typescript
namespace __SUB_EDGE__ {
    export class Class<
        D extends Data = Data,
        S extends ScratchData = ScratchData,
    > extends __SUPER_EDGE__.Class<D, S> {
        /* Add methods here */
    }

    export class Builder
        extends __SUPER_EDGE__.Builder
        implements EdgeBuilder<Data, ScratchData>
    {
        constructor(/* ... */) {
            super(/* ... */);
            /* ... */
        }

        buildData(data: BaseEdge.Data): Data {
            return {
                ...super.buildData(data),
                /* Build data fields here */
            };
        }

        buildScratchData(scratchData: BaseEdge.ScratchData): ScratchData {
            return {
                ...super.buildScratchData(scratchData),
                /* Build scratch data fields here */
            };
        }
    }

    export const TypeGuard: EdgeTypeGuard<Data, ScratchData> = {
        isDataCompatible(data: BaseEdge.Data): data is Data {
            if (!__SUPER_EDGE__.TypeGuard.isDataCompatible(data)) return false;
            const d = data as Data;
            /* Add data checks here */
            return true;
        },

        isScratchDataCompatible(
            scratchData: BaseEdge.ScratchData,
        ): scratchData is ScratchData {
            if (!__SUPER_EDGE__.TypeGuard.isScratchDataCompatible(scratchData)) return false;
            const s = scratchData as ScratchData;
            /* Add scratch data checks here */
            return true;
        },
    };

    export interface Data extends __SUPER_EDGE__.Data {
        /* Add data fields here */
    }

    export interface ScratchData extends __SUPER_EDGE__.ScratchData {
        /* Add scratch data fields here */
    }
}

export default __SUB_EDGE__;
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
