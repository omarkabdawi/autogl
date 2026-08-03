  import type { Expr } from "../Types/expressions";

  
export function normalize(node: Expr): Expr {
  if (!node) return node;

  // base cases
  if (node.type === "var" || node.type === "bottom" || node.type === "empty") {
    return node;
  }

  // unary

  
  if (node.type === "unary") {
    if (node.op === "!") {
      // ¬A = A → ⊥
      return normalize({
        type: "op",
        op: "-->",
        left: node.expr,
        right: {   type: "bottom", op: null },
      });
    }
    if (node.op === "Diamond") {
      return normalize({
        type: "unary",
        op: "!",
        expr: {
          type: "unary",
          op: "Box",
          expr: {
            type: "unary",
            op: "!",
            expr: node.expr,
          },
        },
      });
    }
    // Box stays the same
    if (node.op === "Box") {
      return {
        type: "unary",
        op: "Box",
        expr: normalize(node.expr),
      };
    }
  }

  // binary
  if (node.type === "op") {
    const A = node.left;
    const B = node.right;

    // implication stays the same
    if (node.op === "-->") {
      return {
        type: "op",
        op: "-->",
        left: normalize(A),
        right: normalize(B),
      };
    }

    // AND: A ∧ B = ¬(A → ¬B)
    if (node.op === "&&") {
      return normalize({
        type: "unary",
        op: "!",
        expr: {
          type: "op",
          op: "-->",
          left: A,
          right: {
            type: "unary",
            op: "!",
            expr: B,
          },
        },
      });
    }

    // OR: A ∨ B = (¬A → B)
    if (node.op === "||") {
      return normalize({
        type: "op",
        op: "-->",
        left: {
          type: "unary",
          op: "!",
          expr: A,
        },
        right: B,
      });
    }

    // IFF: A ↔ B = (A → B) ∧ (B → A)
    if (node.op === "<->") {
      return normalize({
        type: "op",
        op: "&&",
        left: {
          type: "op",
          op: "-->",
          left: A,
          right: B,
        },
        right: {
          type: "op",
          op: "-->",
          left: B,
          right: A,
        },
      });
    }
  }

  return node;
}