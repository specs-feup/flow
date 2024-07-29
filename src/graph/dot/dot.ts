/**
 * Sanitizes a string to be a valid ID in dot.
 * This function is not necessarily meant to be perfect, but to shield against common
 * pitfalls so that the resulting dot file does not become invalid. The user is heavily
 * encouraged to use valid IDs in the first place.
 * 
 * The following changes are performed:
 * - Keywords "node", "edge", "graph", "digraph", "subgraph", "strict" are wrapped
 * in double quotes.
 * - HTML-like strings that have unbalanced brackets have the excess brackets escaped.
 * - Unquoted strings that are not numeral or alphanumeric are wrapped in double quotes.
 * - Unescaped double-quote characters in the middle of a double-quoted string are escaped.
 * 
 * @param s The input string.
 * @returns The sanitized string.
 */
function sanitize(s: string): string {
    const isNumeral = /^-?(?:\.\d+|\d+(?:\.\d*)?)$/.test(s);
    if (isNumeral) {
        return s;
    }

    const isAlphanumeric = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);
    if (isAlphanumeric) {
        if (
            ["node", "edge", "graph", "digraph", "subgraph", "strict"].includes(s.toLowerCase())
        ) {
            return `\"${s}\"`;
        }
        return s;
    }

    const isHtml = s.startsWith("<") && s.endsWith(">");
    if (isHtml) {
        let openBrackets = 0;
        let escaped = "";
        for (let i = 1; i < s.length - 1; i++) {
            if (s[i] === "<") {
                openBrackets++;
            } else if (s[i] === ">") {
                if (openBrackets === 0) {
                    escaped += "&gt;";
                    continue;
                } else {
                    openBrackets--;
                }
            }
            escaped += s[i];
        }
        s = `<${escaped}>`;
        openBrackets = 0;
        escaped = "";
        // Note that we will now iterate in reverse
        for (let i = s.length-2; i > 0; i--) {
            if (s[i] === ">") {
                openBrackets++;
            } else if (s[i] === "<") {
                if (openBrackets === 0) {
                    escaped += ";tl&";
                    continue;
                } else {
                    openBrackets--;
                }
            }
            escaped += s[i];
        }
        return `<${[...escaped].reverse().join("")}>`;
    }

    const isQuoted = s.startsWith('"') && s.endsWith('"');
    if (!isQuoted) {
        s = `"${s}"`;
    }

    // (?<!^) - Does not match beginning of string
    // (?!$) - Does not match end of string
    // (?<!\\)((\\\\)*)" - Matches '"' preceded by an even number 
    // of backslashes(0, 2, 4, ...)
    //
    // $1\\" - Replaces match with the first group (even number of backslashes),
    // one additional backslash, and the double-quote.
    return s.replace(/(?<!^)(?<!\\)((\\\\)*)"(?!$)/g, '$1\\"');
}

function indent(indentation: number, s: string): string {
    return `${" ".repeat(indentation)}${s}`;
}

function attrsToDot(attrs: Record<string, string>): string {
    const formattedAttrs = Object
        .entries(attrs)
        .map(([key, value]) => `${sanitize(key)}=${sanitize(value)}`)
        .join(" ");
    
    if (formattedAttrs === "") {
        return "";
    }
    
    return `[${formattedAttrs}]`;
}

function statementToDot(indentation: number, ...tokens: string[]): string {
    const t = tokens.filter((t) => t !== "").join(" ");
    return indent(indentation, `${t};`);
}

function nodeIdToDot(node: NodeIdentification): string {
    if (typeof node === "string") {
        node = { id: node };
    }
    let id = sanitize(node.id);
    if (node.port !== undefined) {
        id += `:${sanitize(node.port)}`;
    }
    if (node.compass_pt !== undefined) {
        id += `:${node.compass_pt}`;
    }
    return id;
}

export interface DotStatement {
    toDotString(directed: boolean, indentation: number): string;
}

export type NodeIdentification =
    | string
    | {
          id: string;
          port?: string;
          compass_pt?: CompassPorts;
      };

export enum CompassPorts {
    N = "n",
    NE = "ne",
    E = "e",
    SE = "se",
    S = "s",
    SW = "sw",
    W = "w",
    NW = "nw",
    C = "c",
    _ = "_",
}

export enum AttributesType {
    GRAPH = "graph",
    NODE = "node",
    EDGE = "edge",
}

export class DotAttributes implements DotStatement {
    type: AttributesType;
    attrList: Record<string, string>;

    constructor(type: AttributesType, attrs: Record<string, string> = {}) {
        this.type = type;
        this.attrList = attrs;
    }

    attr(key: string, value: string): this {
        this.attrList[key] = value;
        return this;
    }

    attrs(attrs: Record<string, string>): this {
        this.attrList = { ...this.attrList, ...attrs };
        return this;
    }

    toDotString(_: boolean, indentation: number = 0): string {
        return statementToDot(
            indentation,
            this.type.toString(),
            attrsToDot(this.attrList),
        );
    }
}

export class DotNode implements DotStatement {
    id: NodeIdentification;
    attrList: Record<string, string>;

    constructor(id: NodeIdentification, attrs: Record<string, string> = {}) {
        this.id = id;
        this.attrList = attrs;
    }

    attr(key: string, value: string): this {
        this.attrList[key] = value;
        return this;
    }

    attrs(attrs: Record<string, string>): this {
        this.attrList = { ...this.attrList, ...attrs };
        return this;
    }

    toDotString(_: boolean, indentation: number = 0): string {
        return statementToDot(
            indentation,
            nodeIdToDot(this.id),
            attrsToDot(this.attrList),
        );
    }
}

// For simplicity, shorthands like `n1 -> n2 -> n3` or `{n1; n2} -> {n3; n4}`
// are not supported. Instead, you must create an edge for each pair of nodes. 
export class DotEdge implements DotStatement {
    source: NodeIdentification;
    target: NodeIdentification;
    attrList: Record<string, string>;

    constructor(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs: Record<string, string> = {},
    ) {
        this.source = source;
        this.target = target;
        this.attrList = attrs;
    }

    attr(key: string, value: string): this {
        this.attrList[key] = value;
        return this;
    }

    attrs(attrs: Record<string, string>): this {
        this.attrList = { ...this.attrList, ...attrs };
        return this;
    }

    toDotString(directed: boolean, indentation: number = 0): string {
        return statementToDot(
            indentation,
            nodeIdToDot(this.source),
            directed ? "->" : "--",
            nodeIdToDot(this.target),
            attrsToDot(this.attrList),
        );
    }
}

// subgraph label may start with 'cluster'
export class DotSubgraph implements DotStatement {
    label?: string;
    statementList: DotStatement[];

    constructor(label?: string, statements: DotStatement[] = []) {
        this.label = label;
        this.statementList = statements;
    }

    statements(...statement: DotStatement[]): this {
        this.statementList.push(...statement);
        return this;
    }

    node(id: NodeIdentification, attrs?: Record<string, string>): this {
        this.statements(new DotNode(id, attrs));
        return this;
    }

    edge(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs?: Record<string, string>,
    ): this {
        this.statements(new DotEdge(source, target, attrs));
        return this;
    }

    graphAttr(key: string, value: string): this {
        this.graphAttrs({ [key]: value });
        return this;
    }

    graphAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.GRAPH, attrs));
        return this;
    }

    nodeAttr(key: string, value: string): this {
        this.nodeAttrs({ [key]: value });
        return this;
    }

    nodeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.NODE, attrs));
        return this;
    }

    edgeAttr(key: string, value: string): this {
        this.edgeAttrs({ [key]: value });
        return this;
    }

    edgeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.EDGE, attrs));
        return this;
    }

    toDotString(directed: boolean, indentation: number = 0): string {
        let tokens: string[] = [];
        tokens.push(`${" ".repeat(indentation)}subgraph`);
        if (this.label !== undefined) {
            tokens.push(sanitize(this.label));
        }
        const dotStatements = this.statementList.map((s) =>
            s.toDotString(directed, indentation + 2),
        );
        tokens.push(`{\n${dotStatements.join("\n")}\n${" ".repeat(indentation)}}\n`);

        return tokens.join(" ");
    }
}

// While it would be convenient for DotGraph to extend DotSubGraph,
// that would violate the Liskov Substitution Principle: you may not
// use a DotGraph wherever a DotSubGraph is expected.
export class DotGraph {
    directed: boolean;
    strict: boolean;
    label?: string;
    statementList: DotStatement[];

    constructor(label?: string, directed: boolean = true, strict: boolean = false, statements: DotStatement[] = []) {
        this.directed = directed;
        this.label = label;
        this.strict = strict;
        this.statementList = statements;
    }

    statements(...statement: DotStatement[]): this {
        this.statementList.push(...statement);
        return this;
    }

    node(id: NodeIdentification, attrs?: Record<string, string>): this {
        this.statements(new DotNode(id, attrs));
        return this;
    }

    edge(source: NodeIdentification, target: NodeIdentification, attrs?: Record<string, string>): this {
        this.statements(new DotEdge(source, target, attrs));
        return this;
    }

    graphAttr(key: string, value: string): this {
        this.graphAttrs({ [key]: value });
        return this;
    }

    graphAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.GRAPH, attrs));
        return this;
    }

    nodeAttr(key: string, value: string): this {
        this.nodeAttrs({ [key]: value });
        return this;
    }

    nodeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.NODE, attrs));
        return this;
    }

    edgeAttr(key: string, value: string): this {
        this.edgeAttrs({ [key]: value });
        return this;
    }

    edgeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.EDGE, attrs));
        return this;
    }

    toDotString(): string {
        let tokens: string[] = [];
        if (this.strict) {
            tokens.push("strict");
        }
        tokens.push(this.directed ? "digraph" : "graph");
        if (this.label !== undefined) {
            tokens.push(sanitize(this.label));
        }
        const dotStatements = this.statementList.map((s) => s.toDotString(this.directed, 2));
        tokens.push(`{\n${dotStatements.join("\n")}\n}\n`);

        return tokens.join(" ");
    }
}

export default class Dot {
    static graph(
        label?: string,
        directed: boolean = true,
        strict: boolean = false,
        statements: DotStatement[] = [],
    ): DotGraph {
        return new DotGraph(label, directed, strict, statements);
    }

    static subgraph(label?: string, statements: DotStatement[] = []): DotSubgraph {
        return new DotSubgraph(label, statements);
    }

    static edge(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs?: Record<string, string>,
    ): DotEdge {
        return new DotEdge(source, target, attrs);
    }

    static node(id: NodeIdentification, attrs?: Record<string, string>): DotNode {
        return new DotNode(id, attrs);
    }

    static nodeId(id: string, port?: string, compass_pt?: CompassPorts): NodeIdentification {
        return { id, port, compass_pt };
    }

    static nodeAttrs(attrs: Record<string, string>): DotAttributes {
        return new DotAttributes(AttributesType.NODE, attrs);
    }

    static edgeAttrs(attrs: Record<string, string>): DotAttributes {
        return new DotAttributes(AttributesType.EDGE, attrs);
    }

    static graphAttrs(attrs: Record<string, string>): DotAttributes {
        return new DotAttributes(AttributesType.GRAPH, attrs);
    }
}
