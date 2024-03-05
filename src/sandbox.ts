// Without this import, clava-js does not work for some reason
import "clava-js/api/Joinpoints.js";

import Query from "lara-js/api/weaver/Query.js";

console.log(Query.root().dump);
