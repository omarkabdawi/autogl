/// <reference types="node" />
import { normalize } from "../Logic/normalizer";
import { createTreeSeq } from "../Types/treeSeq";
import { AutoGL } from "../Logic/AutomatedGL";
import { serializeExpr } from "../Logic/serializer";
import { generateExpr } from "./formulaGenerator";
import type { Expr } from "../Types/expressions";

/**
 * A single benchmark run result.
 * - `formula`: original generated formula as string
 * - `normalized`: normalized form of the formula as string
 * - `timeMs`: duration in milliseconds the prover took
 * - `result`: boolean result returned by `AutoGL`
 * - `error`: optional error message when the run failed
 */
export type BenchmarkResult = {
	formula: string;
	normalized: string;
	nodeCount: number;
	timeMs: number;
	result: boolean;
	error?: string;
};

/** Count nodes in an Expr tree (includes operator/unary nodes and leaves) */
function countNodes(node: Expr | undefined | null): number {
	if (!node) return 0;
	if (node.type === "var" || node.type === "bottom" || node.type === "empty") return 1;
	if (node.type === "unary") return 1 + countNodes(node.expr);
	// op
	return 1 + countNodes(node.left) + countNodes(node.right);
}

/**
 * Combined result used for series runs. Extends `BenchmarkResult` with
 * an optional `n` field indicating the formula size used to generate it.
 */
type CombinedResult = BenchmarkResult & { n?: number };

/**
 * Save benchmark results to a CSV file on disk (Node-only).
 * The function constructs a CSV with header (optionally including `n`)
 * and writes it to `filename` (or a timestamped default) in the current
 * working directory.
 *
 * @param results - array of results to write (may include `n` column)
 * @param filename - optional filename to write; defaults to timestamped name
 */
export async function saveResultsCSV(results: CombinedResult[], filename?: string): Promise<void> {
	const hasN = results.length > 0 && typeof results[0].n === "number";
	const header = hasN ? ["n", "formula", "normalized", "nodeCount", "timeMs", "result", "error"] : ["formula", "normalized", "nodeCount", "timeMs", "result", "error"];

	const rows = results.map(r => {
		const base = hasN ? [String(r.n ?? ""), r.formula, r.normalized, String(r.nodeCount), r.timeMs.toString(), String(r.result)] : [r.formula, r.normalized, String(r.nodeCount), r.timeMs.toString(), String(r.result)];
		return [...base, r.error ?? ""];
	});
	const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
	const csv = [header.join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
	const name = filename ?? `benchmark_${Date.now()}.csv`;
	try {
		const fs = await import("fs");
		const path = await import("path");
		const cwd = (globalThis as any).process ? (globalThis as any).process.cwd() : ".";
		const fullPath = path.join(cwd, name);
		await fs.promises.writeFile(fullPath, csv, "utf8");
		// eslint-disable-next-line no-console
		console.log("Saved CSV to", fullPath);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error("Failed to save CSV:", err);
		throw err;
	}
}

/**
 * Run `count` benchmarks for a single formula size `n`.
 * For each run this function:
 * - generates a formula with `generateExpr(n)`
 * - normalizes it with `normalize`
 * - creates a tree sequent and runs `AutoGL`
 * - records timing and result
 *
 * If `save` is truthy or a filename string is provided, the results
 * will be written to CSV using `saveResultsCSV`.
 *
 * @param n - target formula size/depth
 * @param count - number of formulas to test (default 20)
 * @param save - `false` (no save), `true` (auto filename), or filename string
 */
export async function runBenchmark(n: number, count = 20, save: boolean | string = false): Promise<BenchmarkResult[]> {
	const results: BenchmarkResult[] = [];
	for (let i = 0; i < count; i++) {
		let record: BenchmarkResult;
		try {
			const expr = generateExpr(n);
			const normalized = normalize(expr);
				const nodeCount = countNodes(normalized);
			const seq = createTreeSeq(normalized);

			const start = performance.now();
			const result = AutoGL(seq, () => {});
			const end = performance.now();
			const time = end - start;

			record = {
				formula: serializeExpr(expr),
				normalized: serializeExpr(normalized),
				nodeCount,
				timeMs: time,
				result,
			};
			// eslint-disable-next-line no-console
			console.log(`#${i + 1}:`, record.formula, "=>", record.normalized, "time:", time.toFixed(3) + "ms", "result:", result);
		} catch (err: any) {
			const errMsg = err instanceof Error ? err.message : String(err);
			// on error, record a failed entry but continue
			record = {
				formula: "",
				normalized: "",
				nodeCount: -1,
				timeMs: -1,
				result: false,
				error: errMsg,
			};
			// eslint-disable-next-line no-console
			console.error(`Run ${i + 1} failed for n=${n}:`, errMsg);
		}
		results.push(record);
	}

	if (save) {
		const filename = typeof save === "string" ? save : `benchmark_n_${n}_${Date.now()}.csv`;
		await saveResultsCSV(results, filename);
	}

	return results;
}

/**
 * Run a series of benchmarks incrementing `n` from `startN` to `endN` (inclusive).
 * Aggregates all results into a single CSV file which includes the `n` column
 * so results can be analyzed across sizes.
 *
 * @param startN - starting formula size
 * @param endN - ending formula size (inclusive)
 * @param count - number of formulas per size (default 20)
 * @param outFilename - optional output CSV filename; defaults to timestamped name
 */
export async function runBenchmarkSeries(startN: number, endN: number, count = 20, outFilename?: string): Promise<void> {
	const aggregated: CombinedResult[] = [];
	let n = startN;
	while (n <= endN) {
		// eslint-disable-next-line no-console
		console.log(`Running benchmark for n=${n}`);
		try {
			const results = await runBenchmark(n, count, false);
			for (const r of results) {
				aggregated.push({ ...r, n });
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error(`Benchmark failed for n=${n}:`, err);
		}
		n++;
	}

	const filename = outFilename ?? `benchmark_series_${startN}_to_${endN}_${Date.now()}.csv`;
	await saveResultsCSV(aggregated, filename);
}
