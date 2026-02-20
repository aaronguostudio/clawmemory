import { NextRequest, NextResponse } from "next/server";
import { searchMemories } from "@/lib/memories";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);
  const results = await searchMemories(q);
  return NextResponse.json(results);
}
