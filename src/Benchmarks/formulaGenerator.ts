import type {
    Expr,
    UnaryOperator,
    BinaryOperator,
    UnaryNode,
} from "../Types/expressions";

function randInt(max: number): number {
    return Math.floor(Math.random() * max);
}

function choice<T>(arr: T[]): T {
    return arr[randInt(arr.length)];
}

const VAR_NAMES = [
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
];

const BINARY_OPS: BinaryOperator[] = [
    "&&",
    "||",
    "-->",
    "<->",
];

const UNARY_OPS: UnaryOperator[] = [
    "!",
    "Box",
    "Diamond",
];

/**
 * Generates a random formula with EXACTLY `nodes` AST nodes.
 *
 * Every operator counts as one node.
 * Every variable counts as one node.
 * Bottom counts as one node.
 */
export function generateExpr(nodes: number): Expr {
    if (nodes < 1) {
        throw new Error("generateExpr(): nodes must be >= 1");
    }

    // Base case: exactly one node -> leaf
    if (nodes === 1) {
        if (Math.random() < 0.8) {
            return {
                type: "var",
                value: choice(VAR_NAMES),
                op: null,
            };
        }

        return {
            type: "bottom",
            op: null,
        };
    }

    // With only two nodes, the only possibility is a unary operator.
    if (nodes === 2) {
        const node: UnaryNode = {
            type: "unary",
            op: choice(UNARY_OPS),
            expr: generateExpr(1),
        };

        return node;
    }

    // For >=3 nodes, randomly choose unary or binary.
    const useUnary = Math.random() < 0.35;

    if (useUnary) {
        const node: UnaryNode = {
            type: "unary",
            op: choice(UNARY_OPS),
            expr: generateExpr(nodes - 1),
        };

        return node;
    }

    // Binary node
    const remaining = nodes - 1;

    // Give each child at least one node.
    const leftNodes = 1 + randInt(remaining - 1);
    const rightNodes = remaining - leftNodes;

    return {
        type: "op",
        op: choice(BINARY_OPS),
        left: generateExpr(leftNodes),
        right: generateExpr(rightNodes),
    };
}