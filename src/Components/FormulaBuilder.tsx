import type { Expr, UnaryOperator, BinaryOperator, UnaryNode} from "../Types/expressions";
import { serializeExpr } from "../Logic/serializer";
import { parseTextExpression } from "../Logic/parser";
import { createEmpty } from "../Types/expressions";
import { normalize } from "../Logic/normalizer";
import { AutoGL } from "../Logic/AutomatedGL";
import { createTreeSeq, printTreeSeq } from "../Types/treeSeq";
import React, { useState } from "react";

type InputMode = "buttons" | "text";


export function FormulaBuilder() {
  const [expr, setExpr] = useState<Expr>(createEmpty());
  const [history, setHistory] = useState<Expr[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>("buttons");
  const [textValue, setTextValue] = useState<string>(serializeExpr(createEmpty()));
  const [textError, setTextError] = useState<string | null>(null);
  const [solverOutput, setSolverOutput] = useState<string>("");
  const [LogOutput, setLogOutput] = useState<string>("");
  const [enableAutoGLLog, setEnableAutoGLLog] = useState<boolean>(true);
  const [showAutoGLLog, setShowAutoGLLog] = useState<boolean>(true);
  const [validFormulas, setValidFormulas] = useState<string[] | null>(null);
  const [loadingValid, setLoadingValid] = useState(false);
  const [invalidFormulas, setInvalidFormulas] = useState<string[] | null>(null);
  const [loadingInvalid, setLoadingInvalid] = useState(false);

function updateExpr(newExpr: Expr): void {
    setHistory((prev) => [...prev, expr]);
    setExpr(newExpr);
}

function log(message: string): void {
    setLogOutput((prev) => prev + message + "\n");
    
}

  function dontLog(): void {
    // no-op

}

  function runAutoGL(): void {
    const normalizedExpr = normalize(expr);
    const seq = createTreeSeq(normalizedExpr);
    const initialSequent = printTreeSeq(seq);
    const logger = enableAutoGLLog ? log : dontLog;

    setLogOutput("");

    setSolverOutput([
      "Input sequent:",
      initialSequent,
      "Running AutoGL...",
    ].join("\n"));
//if conditon log or dont log based on user preference
    try {
      const result = AutoGL(seq, logger);

      setSolverOutput([
        "Input sequent:",
        initialSequent,
        `AutoGL result: ${result ? "true" : "false"}`,
      ].join("\n"));
    } catch (error) {
      setSolverOutput([
        "Input sequent:",
        initialSequent,
        `AutoGL error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ].join("\n"));
    }
  }

  // Simple CSV line parser supporting quoted fields
  function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        i++; // skip opening quote
        let field = '';
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          if (line[i] === '"') {
            i++;
            break;
          }
          field += line[i++];
        }
        // skip optional comma
        if (line[i] === ',') i++;
        fields.push(field);
      } else {
        // unquoted
        let j = line.indexOf(',', i);
        if (j === -1) j = line.length;
        fields.push(line.slice(i, j).trim());
        i = j + 1;
      }
    }
    return fields;
  }

  async function loadValidFormulas(): Promise<string[]> {
    if (validFormulas) return validFormulas;
    setLoadingValid(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}269validFormulae.csv`);
      const txt = await res.text();
      const lines = txt.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) return [];
      const data: string[] = [];
      // skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        // second element if present, otherwise first
        const formulaField = fields[1] ?? fields[0] ?? '';
        data.push(formulaField.trim());
      }
      setValidFormulas(data);
      return data;
    } finally {
      setLoadingValid(false);
    }
  }

  async function loadInvalidFormulas(): Promise<string[]> {
    if (invalidFormulas) return invalidFormulas;
    setLoadingInvalid(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}1192invalidFormulae.csv`);
      const txt = await res.text();
      const lines = txt.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) return [];
      const data: string[] = [];
      // skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        const formulaField = fields[1] ?? fields[0] ?? '';
        data.push(formulaField.trim());
      }
      setInvalidFormulas(data);
      return data;
    } finally {
      setLoadingInvalid(false);
    }
  }

  async function insertRandomValid(): Promise<void> {
    try {
      const data = await loadValidFormulas();
      if (!data || data.length === 0) {
        setTextError('No valid formulas found in CSV');
        return;
      }
      const choice = data[Math.floor(Math.random() * data.length)];
      // try parse
      try {
        const parsed = parseTextExpression(choice);
        setTextError(null);
        setHistory((prev) => [...prev, expr]);
        setExpr(parsed);
        setTextValue(serializeExpr(parsed));
      } catch (err: any) {
        // fallback: insert as text input if parsing fails
        setTextValue(choice);
        setTextError(err instanceof Error ? err.message : 'Failed to parse formula');
      }
    } catch (err: any) {
      setTextError(err instanceof Error ? err.message : String(err));
    }
  }

  async function insertRandomInvalid(): Promise<void> {
    try {
      const data = await loadInvalidFormulas();
      if (!data || data.length === 0) {
        setTextError('No invalid formulas found in CSV');
        return;
      }
      const choice = data[Math.floor(Math.random() * data.length)];
      try {
        const parsed = parseTextExpression(choice);
        setTextError(null);
        setHistory((prev) => [...prev, expr]);
        setExpr(parsed);
        setTextValue(serializeExpr(parsed));
      } catch (err: any) {
        setTextValue(choice);
        setTextError(err instanceof Error ? err.message : 'Failed to parse formula');
      }
    } catch (err: any) {
      setTextError(err instanceof Error ? err.message : String(err));
    }
  }

  function toggleAutoGLLogVisibility(): void {
    setShowAutoGLLog((prev) => !prev);
  }

  function switchInputMode(): void {
    if (inputMode === "buttons") {
      setTextValue(serializeExpr(expr));
      setTextError(null);
      setInputMode("text");
      return;
    }

    setTextError(null);
    setInputMode("buttons");
  }

  function handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
    const nextValue = event.target.value;
    setTextValue(nextValue);

    try {
      const nextExpr = parseTextExpression(nextValue);
      setTextError(null);
      setHistory((prev) => [...prev, expr]);
      setExpr(nextExpr);
    } catch (error) {
      setTextError(error instanceof Error ? error.message : "Invalid expression");
    }
  }

  function insertBottom() {
  updateExpr(fill(expr, { type: "bottom" ,op: null  }));
}

  function undo() {
    if (history.length > 0) {
      setHistory((prev) => {
        const newHistory = [...prev];
        const prevExpr = newHistory.pop();
        if (prevExpr) { setExpr(prevExpr);}
        return newHistory;
      });
    }
  }

function fill(node: Expr, value: string | Expr): Expr {
    let filled = false;

    function walk(current: Expr): Expr {
      if (!current) return current;

      if (current.type === "empty") {
        if (filled) return current;
        filled = true;
        return typeof value === "string" ? { type: "var", value, op: null}: { ...value};
      }

      if (current.type === "op") {
        const left = walk(current.left);
        const right = filled ? current.right : walk(current.right);
        return { ...current, left, right };
      }

      if (current.type === "unary") {
        const expr = walk(current.expr);
        return { ...current, expr };
      }

      return current;
    }

    return walk(node);
  }


 function insertOperator(op: BinaryOperator): void {
    updateExpr({
      type: "op",
      op,
      left: expr,
      right: createEmpty()
    });
  }


  function insertUnary(op: UnaryOperator): void {
   const unaryNode: UnaryNode = {
    type: "unary",
    op,
    expr: createEmpty()
  };

  // try to fill an empty spot
  function tryFill(node: Expr): { result: Expr; didFill: boolean } {
    let didFill = false;

    function walk(current: Expr): Expr {
      if (!current) return current;

      if (current.type === "empty") {
        if (didFill) return current;
        didFill = true;
        return unaryNode;
      }

      if (current.type === "op") {
        const left = walk(current.left);
        const right = didFill ? current.right : walk(current.right);
        return { ...current, left, right };
      }

      if (current.type === "unary") {
        return { ...current, expr: walk(current.expr) };
      }

      return current;
    }

    const result = walk(node);
    return { result, didFill };
  }

  const { result, didFill } = tryFill(expr);

  if (didFill) {
    updateExpr(result);
  } else {
    // fallback: wrap whole expression
    updateExpr({
      type: "unary",
      op,
      expr: expr,
    });
  }
}

 function insertVar(v: string): void {
  updateExpr(fill(expr, v));
}

  
const colors = [
  "#7369BE", // Violet you're turning violet!
  "#D20F41", // Red 
  "#C85000",  // Orange
  "#FFC700", // Yellow
  "#0A777F" // Turkish
];
function renderExpr(node: Expr, depth = 0): React.ReactNode {
  const color = colors[depth % colors.length];

  if (node.type === "empty") return "____";
  if (node.type === "var") return node.value;
  if (node.type === "bottom") return "⊥";
  if (node.type === "op") {
    return (
      <>
        <span style={{ color }}>(</span>
        {renderExpr(node.left, depth + 1)} {node.op} {renderExpr(node.right, depth + 1)}
        <span style={{ color }}>)</span>
      </>
    );
  }

  if (node.type === "unary") {
    return (
      <>
        {node.op}
        <span style={{ color }}>(</span>
        {renderExpr(node.expr, depth + 1)}
        <span style={{ color }}>)</span>
      </>
    );
  }

  return null;
}

  return (
    <div className="formula-builder" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h3 className="formula-builder-title" style={{ margin: 0 }}>Formula Builder</h3>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <button className="formula-builder-switch-button" onClick={switchInputMode}>
            {inputMode === "buttons" ? "Switch to Text Input" : "Switch to Button Input"}
          </button>
          <button className="formula-builder-log-toggle-button" onClick={toggleAutoGLLogVisibility}>
            {showAutoGLLog ? "Hide AutoGL Log" : "Show AutoGL Log"}
          </button>
        </span>
      </div>

      {inputMode === "text" ? (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={textValue}
            onChange={handleTextChange}
            placeholder="Example: !(p && Diamond(q)) --> ⊥"
            rows={4}
            className="formula-builder-textarea"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              font: "inherit",
              resize: "vertical",
            }}
          />
          <div style={{ minHeight: 20, marginTop: 8, color: textError ? "#c1121f" : "#001450" }}>
            {textError ? textError : "Use !, Box, Diamond, &&, ||, -->, <->, parentheses, and ⊥."}
          </div>
        </div>
      ) : null}

      {inputMode === "buttons" ? (
        <>
          {/* binary ops */}
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => insertOperator("&&")}>&&</button>
            <button onClick={() => insertOperator("||")}>||</button>
            <button onClick={() => insertOperator("-->")}>→</button>
            <button onClick={() => insertOperator("<->")}>↔</button>
          </div>

          {/* unary ops */}
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => insertUnary("!")}>NOT (!)</button>
            <button onClick={() => insertUnary("Box")}>Box</button>
            <button onClick={() => {insertUnary("Diamond");console.log("karimre7towe7sha")}}>Diamond</button>
          </div>

          {/* variables */}
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => insertVar("p")}>p</button>
            <button onClick={() => insertVar("q")}>q</button>
            <button onClick={() => insertVar("r")}>r</button>
            <button onClick={() => insertVar("s")}>s</button>
            <button onClick={insertBottom}>⊥</button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <button className="formula-builder-clear-button" onClick={() => updateExpr(createEmpty())}>Clear</button>
            <button className="formula-builder-undo-button" onClick={undo} disabled={history.length === 0}>Undo</button>
          </div>
        </>
      ) : null}

      <div style={{ fontSize: 20 }}>
        {renderExpr(expr)}
      </div>

      <div style={{ marginBottom: 10, marginTop: 16 }}>
        <button className="formula-builder-random-button" onClick={insertRandomValid} disabled={loadingValid}>
            {loadingValid ? 'Loading…' : 'Random Valid Formula'}
          </button>
          <button className="formula-builder-random-button" onClick={insertRandomInvalid} disabled={loadingInvalid}>
            {loadingInvalid ? 'Loading…' : 'Random Invalid Formula'}
          </button>
      </div>
      <div style={{ marginBottom: 10, marginTop: 16, marginLeft: 125 }}>
        <button className="formula-builder-normalize-button" onClick={() => updateExpr(normalize(expr))}>Normalize</button>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
          <button className="formula-builder-run-button" onClick={runAutoGL}>Check Validity</button>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              className="formula-builder-log-checkbox"
              checked={enableAutoGLLog}
              onChange={(event) => setEnableAutoGLLog(event.target.checked)}
            />
            <span style={{ color: "#001450" }}>Build Log</span>
          </label>
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#001450" }}>AutoGL Output </h4>
        <pre
          className="formula-builder-output"
          style={{
            whiteSpace: "pre-wrap",
            background: "#D0D5DC",
            border: "1px solid #d0d7de",
            borderRadius: 8,
            padding: 12,
            minHeight: 160,
            margin: 0,
            overflowX: "auto",
            color: "#000000",
          }}
        >
          {solverOutput || "Run AutoGL to see the input sequent and result here. True means the formula is valid, false means it is not valid."}
        </pre>
      </div>

      {showAutoGLLog ? (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#001450" }}>AutoGL Log</h4>
          <pre
            className="formula-builder-log"
            style={{
              whiteSpace: "pre-wrap",
              background: "#D0D5DC",
              border: "1px solid #d0d7de",
              borderRadius: 8,
              padding: 12,
              minHeight: 160,
              margin: 0,
              overflowX: "auto",
              color: "#000000",
            }}
          >
            {LogOutput || "Logs from AutoGL will appear here. The sequent is represented internally as: Tel, Gamma ⊢ Delta where Tel is a set of relations between worlds, and Gamma and Delta are sets of labelled formulae."}
          </pre>
        </div>
      ) : null}
    </div>
  );
}



