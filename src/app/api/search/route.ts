import { NextRequest, NextResponse } from "next/server";
import { openclawSearch } from "@/lib/openclaw";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return NextResponse.json([]);
  const results = openclawSearch(q);
  return NextResponse.json(results);
}
