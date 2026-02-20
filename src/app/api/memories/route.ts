import { NextResponse } from "next/server";
import { listMemories } from "@/lib/memories";

export async function GET() {
  const files = await listMemories();
  return NextResponse.json(files);
}
