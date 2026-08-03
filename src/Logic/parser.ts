import type { Expr, BinaryOperator, UnaryOperator } from "../Types/expressions";
import { createEmpty } from "../Types/expressions";

type Token =
  | { type: "op"; value: BinaryOperator }
  | { type: "unary"; value: UnaryOperator }
  | { type: "paren"; value: "(" | ")" }
  | { type: "var"; value: string }
  | { type: "bottom" };


export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const current = input[index];

    if (/\s/.test(current)) {
      index += 1;
      continue;
    }

    if (input.startsWith("<->", index)) {
      tokens.push({ type: "op", value: "<->" });
      index += 3;
      continue;
    }

    if (input.startsWith("-->", index)) {
      tokens.push({ type: "op", value: "-->" });
      index += 3;
      continue;
    }

    if (input.startsWith("&&", index)) {
      tokens.push({ type: "op", value: "&&" });
      index += 2;
      continue;
    }

    if (input.startsWith("||", index)) {
      tokens.push({ type: "op", value: "||" });
      index += 2;
      continue;
    }

    if (current === "!" || current === "◇" || current === "(" || current === ")") {
      if (current === "!" || current === "◇") {
        tokens.push({ type: "unary", value: current === "!" ? "!" : "Diamond" });
      } else {
        tokens.push({ type: "paren", value: current });
      }
      index += 1;
      continue;
    }

    if (current === "⊥") {
      tokens.push({ type: "bottom" });
      index += 1;
      continue;
    }

     if (input.startsWith("Bottom", index) || input.startsWith("bottom", index)) {
      tokens.push({ type: "bottom" });
      index += 6;
      continue;
    }

    const identifierMatch = /^[A-Za-z][A-Za-z0-9_]*/.exec(input.slice(index));
    if (identifierMatch) {
      const value = identifierMatch[0];
      tokens.push(value === "Box" || value === "Diamond" ? { type: "unary", value: value } : { type: "var", value });
      index += value.length;
      continue;
    }

    throw new Error(`Unexpected character: ${current}`);
  }

  return tokens;
}

export function parseTextExpression(input: string): Expr {
  const trimmed = input.trim();

  if (trimmed === "") {
    return createEmpty();
  }

  const tokens = tokenize(trimmed);
  let position = 0;

  function peek(): Token | undefined {
    return tokens[position];
  }

  function consume(): Token {
    const token = tokens[position];
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    position += 1;
    return token;
  }

  function parsePrimary(): Expr {
    const token = peek();

    if (!token) {
      throw new Error("Expected an expression");
    }

    if (token.type === "bottom") {
      consume();
      return { type: "bottom", op: null };
    }

    if (token.type === "var") {
      consume();
      return { type:"var", value: token.value, op: null };
    }

    if (token.type === "paren" && token.value === "(") {
      consume();
      const expr = parseIff();
      const closing = consume();

      if (closing.type !== "paren" || closing.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }

      return expr;
    }

    throw new Error("Expected a variable, bottom, or parenthesized expression");
  }


    function parseUnary(): Expr {
    const token = peek();

    if (token?.type === "unary") {
      consume();
      return { type: "unary", op: token.value, expr: parseUnary() };
    }

    return parsePrimary();
  }

  function parseAnd(): Expr {
    let left = parseUnary();

    while (true) {
      const token = peek();

      if (!token || token.type !== "op" || token.value !== "&&") {
        break;
      }

      consume();
      left = { type: "op", op: "&&", left, right: parseUnary() };
    }

    return left;
  }

  function parseOr(): Expr {
    let left = parseAnd();

    while (true) {
      const token = peek();

      if (!token || token.type !== "op" || token.value !== "||") {
        break;
      }

      consume();
      left = { type: "op", op: "||", left, right: parseAnd() };
    }

    return left;
  }

  function parseImplication(): Expr {
    let left = parseOr();

    while (true) {
      const token = peek();

      if (!token || token.type !== "op" || token.value !== "-->") {
        break;
      }

      consume();
      left = { type: "op", op: "-->", left, right: parseOr() };
    }

    return left;
  }

  function parseIff(): Expr {
    let left = parseImplication();

    while (true) {
      const token = peek();

      if (!token || token.type !== "op" || token.value !== "<->") {
        break;
      }

      consume();
      left = { type: "op", op: "<->", left, right: parseImplication() };
    }

    return left;
  }

  const expr = parseIff();

  if (position !== tokens.length) {
    throw new Error("Unexpected trailing input");
  }

  return expr;
}
  