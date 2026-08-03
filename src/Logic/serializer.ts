import type { Expr } from "../Types/expressions";
import { exprToString } from "../Types/expressions";

export function serializeExpr(node: Expr): string {
  return exprToString(node);
}