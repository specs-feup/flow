Boilerplate to extend a Node:

```typescript
// Replace SUBNODE with node class name
// Replace SUPERNODE with parent node class name
class SUBNODE<
    D extends Node.WithId<SUBNODE.Data> = Node.WithId<SUBNODE.Data>,
    S extends SUBNODE.ScratchData = SUBNODE.ScratchData,
> extends SUPERNODE<D, S> {
    static build(): Node.Builder<SUBNODE.Data, SUBNODE.ScratchData, SUBNODE> {
        const s = super.build();
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
