import { NextRequest, NextResponse } from "next/server";
import { readMemory, writeMemory } from "@/lib/memories";
import { openclawIndex } from "@/lib/openclaw";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");
  try {
    const content = await readMemory(filePath);
    return NextResponse.json({ path: filePath, content });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join("/");
  const { content } = await req.json();
  try {
    await writeMemory(filePath, content);
    // Fire-and-forget reindex — don't block the save response
    openclawIndex().catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
