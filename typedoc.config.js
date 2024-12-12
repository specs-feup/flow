export default {
    // Ref: https://github.com/Gerrit0/typedoc-packages-example
    $schema: "https://typedoc.org/schema.json",
    theme: "default",
    entryPointStrategy: "expand",
    includeVersion: true,
    entryPoints: ["src/"],
    tsconfig: "tsconfig.json",
    intentionallyNotExported: ["_Case"],
};
