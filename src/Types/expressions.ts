export type EmptyNode = {
  type: "empty";
  op: null;
};

export type VarNode = {
  type: "var";
  value: string;
  op: null;
};

export type BottomNode = {
  type: "bottom";
  op: null;
};

export type BinaryOperator = "&&" | "||" | "-->" | "<->";

export type UnaryOperator = "!" | "Box" | "Diamond";

export type OpNode = {
  type: "op";
  op: BinaryOperator;
  left: Expr;
  right: Expr;
};

export type UnaryNode = {
  type: "unary";
  op: UnaryOperator;
  expr: Expr;
};

export type Expr =
  | EmptyNode
  | VarNode
  | BottomNode
  | OpNode
  | UnaryNode;

export function createEmpty(): EmptyNode {
  return { type: "empty", op: null };
}

export function exprToString(node: Expr): string {
  if (node.type === "empty") return "";
  if (node.type === "var") return node.value;
  if (node.type === "bottom") return "⊥";
  if (node.type === "unary") {
    return `${node.op}(${exprToString(node.expr)})`;
  }

  return `(${exprToString(node.left)} ${node.op} ${exprToString(node.right)})`;
}
