export {};

const baseUrl = process.env.LOADTEST_URL ?? "http://localhost:3000";
const concurrency = Number(process.env.LOADTEST_CONCURRENCY ?? 50);
const requests = Number(process.env.LOADTEST_REQUESTS ?? 500);

type Result = { ok: boolean; ms: number };

async function hit(path: string): Promise<Result> {
  const start = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "user-agent": "outbid-load-test/1.0" },
    });
    return { ok: response.ok, ms: performance.now() - start };
  } catch {
    return { ok: false, ms: performance.now() - start };
  }
}

async function main() {
  const results: Result[] = [];
  for (let offset = 0; offset < requests; offset += concurrency) {
    const batch = Array.from({ length: Math.min(concurrency, requests - offset) }, (_, index) =>
      hit((offset + index) % 10 === 0 ? "/api/health" : "/"),
    );
    results.push(...(await Promise.all(batch)));
  }

  const durations = results.map((result) => result.ms).sort((a, b) => a - b);
  const percentile = (value: number) => durations[Math.min(durations.length - 1, Math.floor(durations.length * value))];
  console.log(JSON.stringify({
    target: baseUrl,
    requests,
    concurrency,
    succeeded: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    p50Ms: Math.round(percentile(0.5)),
    p95Ms: Math.round(percentile(0.95)),
    p99Ms: Math.round(percentile(0.99)),
  }, null, 2));
}

void main();
