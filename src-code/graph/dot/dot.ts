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
    // Numeral stays the same
    const isNumeral = /^-?(?:\.\d+|\d+(?:\.\d*)?)$/.test(s);
    if (isNumeral) {
        return s;
    }

    // Alphanumeric stays the same, except keywords
    // Keywords must be wrapped in double quotes
    const isAlphanumeric = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s);
    if (isAlphanumeric) {
        if (
            ["node", "edge", "graph", "digraph", "subgraph", "strict"].includes(s.toLowerCase())
        ) {
            return `\"${s}\"`;
        }
        return s;
    }

    // HTML-like strings must have balanced brackets
    const isHtml = s.startsWith("<") && s.endsWith(">");
    if (isHtml) {
        let openBrackets = 0;
        let escaped = "";
        // First we iterate forward, escaping excess > brackets
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
        // Now we iterate backwards, escaping excess < brackets
        for (let i = s.length-2; i > 0; i--) {
            if (s[i] === ">") {
                openBrackets++;
            } else if (s[i] === "<") {
                if (openBrackets === 0) {
                    // We are iterating in reverse,
                    // so the string is added in reverse
                    // Reverse of &lt; is ;tl&
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

    // Everything else must be wrapped in double quotes
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
    //
    // In short: Escapes unescaped double-quotes in the middle of the string
    // by adding an additional backslash if it is preceeded by an even number
    // of backslashes (or 0).
    return s.replace(/(?<!^)(?<!\\)((\\\\)*)"(?!$)/g, '$1\\"');
}

/**
 * Indents a string by a given number of spaces.
 * 
 * @param indentation The number of spaces to indent.
 * @param s The string to indent.
 * @returns The indented string.
 */
function indent(indentation: number, s: string): string {
    return `${" ".repeat(indentation)}${s}`;
}

/**
 * Converts a record of attributes to a dot string of attributes.
 * 
 * @param attrs The attributes to convert.
 * @returns The dot string of attributes.
 */
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

/**
 * Converts a list of tokens to a dot statement.
 * 
 * Example:
 * `statementToDot(4, "n1", "->", "n2", "[label=\"Hello\"]");`
 * becomes:
 * "    n1 -> n2 [label=\"Hello\"];"
 * 
 * @param indentation The number of spaces to indent.
 * @param tokens The tokens to convert.
 * @returns The dot statement.
 */
function statementToDot(indentation: number, ...tokens: string[]): string {
    const t = tokens.filter((t) => t !== "").join(" ");
    return indent(indentation, `${t};`);
}

/**
 * Converts a node identification to a dot string.
 * 
 * @param node The node identification to convert.
 * @returns The dot string.
 */
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

/**
 * A statement in a dot file. Can be used inside graphs or subgraphs.
 */
export interface DotStatement {
    toDotString(directed: boolean, indentation: number): string;
}

/**
 * NodeItentification may either be a string, representing the node ID,
 * or an object with id, port, and compass_pt properties, representing
 * id:port:compass_pt.
 */
export type NodeIdentification =
    | string
    | {
          id: string;
          port?: string;
          compass_pt?: CompassPorts;
      };

/**
 * Valid compass points for ports.
 */
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

/**
 * Valid attributes types for attribute statements.
 * graph [...];
 * node [...];
 * edge [...];
 */
export enum AttributesType {
    GRAPH = "graph",
    NODE = "node",
    EDGE = "edge",
}

/**
 * An attribute statement, such as `graph [label="Hello"];`.
 */
export class DotAttributes implements DotStatement {
    /**
     * The type of attributes: graph, node, or edge.
     */
    type: AttributesType;
    /**
     * The list of attributes.
     */
    attrList: Record<string, string>;

    /**
     * Creates a new attribute statement.
     * 
     * @param type The type of attributes: graph, node, or edge.
     * @param attrs The list of attributes.
     */
    constructor(type: AttributesType, attrs: Record<string, string> = {}) {
        this.type = type;
        this.attrList = attrs;
    }

    /**
     * Adds an attribute to the attribute list.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This attribute statement, for chaining.
     */
    attr(key: string, value: string): this {
        this.attrList[key] = value;
        return this;
    }

    /**
     * Adds multiple attributes to the attribute list.
     * 
     * @param attrs The attributes to add.
     * @returns This attribute statement, for chaining.
     */
    attrs(attrs: Record<string, string>): this {
        this.attrList = { ...this.attrList, ...attrs };
        return this;
    }

    /**
     * Converts the attribute statement to a dot string.
     * 
     * @param _ Whether the graph is directed (unused).
     * @param indentation The number of spaces to indent.
     * @returns The dot string of the attribute statement.
     */
    toDotString(_: boolean, indentation: number = 0): string {
        return statementToDot(
            indentation,
            this.type.toString(),
            attrsToDot(this.attrList),
        );
    }
}

/**
 * A node statement in a dot graph.
 */
export class DotNode implements DotStatement {
    /**
     * The ID of the node.
     */
    id: NodeIdentification;
    /**
     * The list of attributes of the node.
     */
    attrList: Record<string, string>;

    /**
     * Creates a new node statement.
     * 
     * @param id The ID of the node.
     * @param attrs The list of attributes of the node.
     */
    constructor(id: NodeIdentification, attrs: Record<string, string> = {}) {
        this.id = id;
        this.attrList = attrs;
    }

    /**
     * Adds an attribute to the attribute list of the node.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This node statement, for chaining.
     */
    attr(key: string, value: string): this {
        this.attrList[key] = value;
        return this;
    }

    /**
     * Adds multiple attributes to the attribute list of the node.
     * 
     * @param attrs The attributes to add.
     * @returns This node statement, for chaining.
     */
    attrs(attrs: Record<string, string>): this {
        this.attrList = { ...this.attrList, ...attrs };
        return this;
    }

    /**
     * Converts the node statement to a dot string.
     * 
     * @param _ Whether the graph is directed (unused).
     * @param indentation The number of spaces to indent.
     * @returns The dot string of the node statement.
     */
    toDotString(_: boolean, indentation: number = 0): string {
        return statementToDot(
            indentation,
            nodeIdToDot(this.id),
            attrsToDot(this.attrList),
        );
    }
}

/**
 * An edge statement in a dot graph.
 * 
 * For simplicity, shorthands like `n1 -> n2 -> n3` or `{n1; n2} -> {n3; n4}`
 * are not supported. Instead, you must create an edge for each pair of nodes. 
 */
export class DotEdge implements DotStatement {
    /**
     * The ID of the source node of the edge.
     */
    source: NodeIdentification;
    /**
     * The ID of the target node of the edge.
     */
    target: NodeIdentification;
    /**
     * The list of attributes of the edge.
     */
    attrList: Record<string, string>;

    /**
     * Creates a new edge statement.
     * 
     * @param source The ID of the source node of the edge.
     * @param target The ID of the target node of the edge.
     * @param attrs The list of attributes of the edge.
     */
    constructor(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs: Record<string, string> = {},
    ) {
        this.source = source;
        this.target = target;
        this.attrList = attrs;
    }

    /**
     * Adds an attribute to the attribute list of the edge.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This edge statement, for chaining.
     */
    attr(key: string, value: string): this {
        this.attrList[key] = value;
        return this;
    }

    /**
     * Adds multiple attributes to the attribute list of the edge.
     * 
     * @param attrs The attributes to add.
     * @returns This edge statement, for chaining.
     */
    attrs(attrs: Record<string, string>): this {
        this.attrList = { ...this.attrList, ...attrs };
        return this;
    }

    /**
     * Converts the edge statement to a dot string.
     * 
     * @param directed Whether the graph is directed.
     * @param indentation The number of spaces to indent.
     * @returns The dot string of the edge statement.
     */
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

/**
 * A subgraph statement in a dot graph.
 * 
 * A subgraph label may start with 'cluster' to represent a cluster,
 * which is a special kind of subgraph that is visible in rendering.
 * 
 * A cluster acts like a container of nodes, and may be used to model
 * nodes with children.
 */
export class DotSubgraph implements DotStatement {
    /**
     * The label of the subgraph.
     */
    label?: string;
    /**
     * The list of statements inside the subgraph.
     */
    statementList: DotStatement[];

    /**
     * Creates a new subgraph statement.
     * 
     * @param label The label of the subgraph.
     * @param statements The list of statements inside the subgraph.
     */
    constructor(label?: string, statements: DotStatement[] = []) {
        this.label = label;
        this.statementList = statements;
    }

    /**
     * Whether the subgraph may be interpreted as a cluster by the
     * rendering engine.
     * 
     * For that, it must have a label that starts with 'cluster'.
     * 
     * @returns Whether the subgraph is a cluster.
     */
    get isCluster(): boolean {
        return this.label !== undefined && this.label.startsWith("cluster");
    }

    /**
     * Adds statements to the subgraph, nested.
     * 
     * @param statement The statements to add.
     * @returns This subgraph statement, for chaining.
     */
    statements(...statement: DotStatement[]): this {
        this.statementList.push(...statement);
        return this;
    }

    /**
     * Adds a node to the subgraph.
     * 
     * @param id The ID of the node.
     * @param attrs The list of attributes of the node.
     * @returns This subgraph statement, for chaining.
     */
    node(id: NodeIdentification, attrs?: Record<string, string>): this {
        this.statements(new DotNode(id, attrs));
        return this;
    }

    /**
     * Adds an edge to the subgraph.
     * 
     * @param source The ID of the source node of the edge.
     * @param target The ID of the target node of the edge.
     * @param attrs The list of attributes of the edge.
     * @returns This subgraph statement, for chaining.
     */
    edge(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs?: Record<string, string>,
    ): this {
        this.statements(new DotEdge(source, target, attrs));
        return this;
    }

    /**
     * Adds an attribute to the subgraph.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This subgraph statement, for chaining.
     */
    graphAttr(key: string, value: string): this {
        this.graphAttrs({ [key]: value });
        return this;
    }

    /**
     * Adds multiple attributes to the subgraph.
     * 
     * @param attrs The attributes to add.
     * @returns This subgraph statement, for chaining.
     */
    graphAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.GRAPH, attrs));
        return this;
    }

    /**
     * Adds an attribute to the nodes of the subgraph.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This subgraph statement, for chaining.
     */
    nodeAttr(key: string, value: string): this {
        this.nodeAttrs({ [key]: value });
        return this;
    }

    /**
     * Adds multiple attributes to the nodes of the subgraph.
     * 
     * @param attrs The attributes to add.
     * @returns This subgraph statement, for chaining.
     */
    nodeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.NODE, attrs));
        return this;
    }

    /**
     * Adds an attribute to the edges of the subgraph.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This subgraph statement, for chaining.
     */
    edgeAttr(key: string, value: string): this {
        this.edgeAttrs({ [key]: value });
        return this;
    }

    /**
     * Adds multiple attributes to the edges of the subgraph.
     * 
     * @param attrs The attributes to add.
     * @returns This subgraph statement, for chaining.
     */
    edgeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.EDGE, attrs));
        return this;
    }

    /**
     * Converts the subgraph statement to a dot string.
     * 
     * @param directed Whether the graph is directed.
     * @param indentation The number of spaces to indent.
     * @returns The dot string of the subgraph statement.
     */
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

/**
 * A dot graph.
 * 
 * While it would be convenient for DotGraph to extend {@link DotSubgraph},
 * that would violate the Liskov Substitution Principle: you may not
 * use a DotGraph wherever a {@link DotSubgraph} is expected.
 */
export class DotGraph {
    /**
     * Whether the graph is directed.
     */
    directed: boolean;
    /**
     * Whether the graph is marked with the strict keyword.
     *
     * A strict graph may not have multiple edges between the same nodes:
     * they are merged into a single edge.
     */
    strict: boolean;
    /**
     * The label of the graph
     */
    label?: string;
    /**
     * The list of statements inside the graph.
     */
    statementList: DotStatement[];

    /**
     * Creates a new dot graph.
     *
     * @param label The label of the graph.
     * @param directed Whether the graph is directed.
     * @param strict Whether the graph is strict. A strict graph may not have
     * multiple edges between the same nodes: they are merged into a single edge.
     * @param statements The list of statements inside the graph.
     */
    constructor(
        label?: string,
        directed: boolean = true,
        strict: boolean = false,
        statements: DotStatement[] = [],
    ) {
        this.directed = directed;
        this.label = label;
        this.strict = strict;
        this.statementList = statements;
    }

    /**
     * Adds statements to the graph.
     *
     * @param statement The statements to add.
     * @returns This graph, for chaining
     */
    statements(...statement: DotStatement[]): this {
        this.statementList.push(...statement);
        return this;
    }

    /**
     * Adds a node to the graph.
     * 
     * @param id The ID of the node.
     * @param attrs The list of attributes of the node.
     * @returns This graph, for chaining.
     */
    node(id: NodeIdentification, attrs?: Record<string, string>): this {
        this.statements(new DotNode(id, attrs));
        return this;
    }

    /**
     * Adds an edge to the graph.
     * 
     * @param source The ID of the source node of the edge.
     * @param target The ID of the target node of the edge.
     * @param attrs The list of attributes of the edge.
     * @returns This graph, for chaining.
     */
    edge(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs?: Record<string, string>,
    ): this {
        this.statements(new DotEdge(source, target, attrs));
        return this;
    }

    /**
     * Adds an attribute to the graph.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This graph, for chaining.
     */
    graphAttr(key: string, value: string): this {
        this.graphAttrs({ [key]: value });
        return this;
    }

    /**
     * Adds multiple attributes to the graph.
     * 
     * @param attrs The attributes to add.
     * @returns This graph, for chaining.
     */
    graphAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.GRAPH, attrs));
        return this;
    }

    /**
     * Adds an attribute to the nodes of the graph.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     */
    nodeAttr(key: string, value: string): this {
        this.nodeAttrs({ [key]: value });
        return this;
    }

    /**
     * Adds multiple attributes to the nodes of the graph.
     * 
     * @param attrs The attributes to add.
     * @returns This graph, for chaining
     */
    nodeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.NODE, attrs));
        return this;
    }

    /**
     * Adds an attribute to the edges of the graph.
     * 
     * @param key The key of the attribute.
     * @param value The value of the attribute.
     * @returns This graph, for chaining.
     */
    edgeAttr(key: string, value: string): this {
        this.edgeAttrs({ [key]: value });
        return this;
    }

    /**
     * Adds multiple attributes to the edges of the graph.
     * 
     * @param attrs The attributes to add.
     * @returns This graph, for chaining.
     */
    edgeAttrs(attrs: Record<string, string>): this {
        this.statements(new DotAttributes(AttributesType.EDGE, attrs));
        return this;
    }

    /**
     * Converts the graph to a dot string.
     * 
     * @returns The dot string representation of the graph.
     */
    toDotString(): string {
        let tokens: string[] = [];
        if (this.strict) {
            tokens.push("strict");
        }
        tokens.push(this.directed ? "digraph" : "graph");
        if (this.label !== undefined) {
            tokens.push(sanitize(this.label));
        }
        const dotStatements = this.statementList.map((s) =>
            s.toDotString(this.directed, 2),
        );
        tokens.push(`{\n${dotStatements.join("\n")}\n}\n`);

        return tokens.join(" ");
    }
}

/**
 * A factory class for creating dot graphs, subgraphs, nodes, and edges.
 */
export default class Dot {
    /**
     * Creates a new dot graph.
     * 
     * Example: "digraph myGraph { ... }"
     * 
     * @param label The label of the graph.
     * @param directed Whether the graph is directed.
     * @param strict Whether the graph is strict. A strict graph may not have
     * multiple edges between the same nodes: they are merged into a single edge.
     * @param statements The list of statements inside the graph.
     * @returns The created dot graph.
     */
    static graph(
        label?: string,
        directed: boolean = true,
        strict: boolean = false,
        statements: DotStatement[] = [],
    ): DotGraph {
        return new DotGraph(label, directed, strict, statements);
    }

    /**
     * Creates a new dot subgraph.
     * 
     * Example: "subgraph cluster_0 { ... }"
     * 
     * @param label The label of the subgraph.
     * @param statements The list of statements inside the subgraph.
     * @returns The created dot subgraph.
     */
    static subgraph(label?: string, statements: DotStatement[] = []): DotSubgraph {
        return new DotSubgraph(label, statements);
    }

    /**
     * Creates a new dot edge.
     * 
     * Example: "n1 -> n2 [label="Hello"];"
     * 
     * @param source The ID of the source node of the edge.
     * @param target The ID of the target node of the edge.
     * @param attrs The list of attributes of the edge.
     * @returns The created dot edge.
     */
    static edge(
        source: NodeIdentification,
        target: NodeIdentification,
        attrs?: Record<string, string>,
    ): DotEdge {
        return new DotEdge(source, target, attrs);
    }

    /**
     * Creates a new dot node.
     * 
     * Example: "n1 [label=\"Hello\"];"
     * 
     * @param id The ID of the node.
     * @param attrs The list of attributes of the node.
     * @returns The created dot node.
     */
    static node(id: NodeIdentification, attrs?: Record<string, string>): DotNode {
        return new DotNode(id, attrs);
    }

    /**
     * Creates a new node identification.
     * 
     * Examples: "n1", "n1:nw"
     * 
     * @param id The ID of the node.
     * @param port The port of the node.
     * @param compass_pt The compass point of the node.
     * @returns The created node identification.
     */
    static nodeId(id: string, port?: string, compass_pt?: CompassPorts): NodeIdentification {
        return { id, port, compass_pt };
    }

    /**
     * Creates a new dot attributes statement for nodes.
     * 
     * Example: "node [shape=point];"
     * 
     * @param attrs The list of attributes.
     * @returns The created dot attributes statement.
     */
    static nodeAttrs(attrs: Record<string, string>): DotAttributes {
        return new DotAttributes(AttributesType.NODE, attrs);
    }

    /**
     * Creates a new dot attributes statement for edges.
     * 
     * Example: "edge [color=red];"
     * 
     * @param attrs The list of attributes.
     * @returns The created dot attributes statement.
     */
    static edgeAttrs(attrs: Record<string, string>): DotAttributes {
        return new DotAttributes(AttributesType.EDGE, attrs);
    }

    /**
     * Creates a new dot attributes statement for graphs.
     * 
     * Example: "graph [label=\"Hello\"];"
     * 
     * @param attrs The list of attributes.
     * @returns The created dot attributes statement.
     */
    static graphAttrs(attrs: Record<string, string>): DotAttributes {
        return new DotAttributes(AttributesType.GRAPH, attrs);
    }
}
