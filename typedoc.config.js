import { fileURLToPath } from "url";

export default {
    extends: [fileURLToPath(import.meta.resolve("lara-js/typedoc.base.json"))],
    entryPoints: ["src/"],
    tsconfig: "tsconfig.json",
    intentionallyNotExported: ["_Case"],
};
