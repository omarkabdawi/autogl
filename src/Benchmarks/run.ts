import { runBenchmarkSeries } from "./benchmark";

async function main() {
    await runBenchmarkSeries(
        3,          // starting n
        17,        // ending n
        100,        // formulas per n
        "benchmarkFINAL.csv"
    );
}

main().catch(console.error);