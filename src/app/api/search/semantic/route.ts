import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);

  try {
    const { stdout } = await exec(
      process.env.OPENCLAW_BIN || "openclaw",
      ["memory", "search", q, "--json"],
      { timeout: 15000 }
    );
    const results = JSON.parse(stdout);
    return NextResponse.json(results);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Semantic search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
