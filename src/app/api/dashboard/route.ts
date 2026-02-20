import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { getWorkspacePath } from "@/lib/memories";

function getDbPath() {
  return path.join(process.env.HOME || "", ".openclaw", "memory", "main.sqlite");
}

export async function GET() {
  const ws = getWorkspacePath();
  const memDir = path.join(ws, "memory");

  // SQLite stats
  let totalFiles = 0, totalSize = 0, totalChunks = 0, lastIndexed = "";
  try {
    const db = new Database(getDbPath(), { readonly: true });
    totalFiles = (db.prepare("SELECT COUNT(*) AS c FROM files").get() as { c: number }).c;
    totalSize = (db.prepare("SELECT COALESCE(SUM(size),0) AS s FROM files").get() as { s: number }).s;
    totalChunks = (db.prepare("SELECT COUNT(*) AS c FROM chunks").get() as { c: number }).c;
    const meta = db.prepare("SELECT value FROM meta WHERE key='last_indexed'").get() as { value: string } | undefined;
    lastIndexed = meta?.value || "";
    db.close();
  } catch {}

  // Scan daily files for heatmap + stale detection
  const dailyFiles: { date: string; size: number; modified: number }[] = [];
  const allFiles: { name: string; path: string; size: number; modified: number }[] = [];
  
  try {
    // MEMORY.md
    const memoryMdPath = path.join(ws, "MEMORY.md");
    if (fs.existsSync(memoryMdPath)) {
      const st = fs.statSync(memoryMdPath);
      allFiles.push({ name: "MEMORY.md", path: "MEMORY.md", size: st.size, modified: st.mtimeMs });
    }

    if (fs.existsSync(memDir)) {
      for (const entry of fs.readdirSync(memDir)) {
        if (!entry.endsWith(".md")) continue;
        const st = fs.statSync(path.join(memDir, entry));
        allFiles.push({ name: entry, path: `memory/${entry}`, size: st.size, modified: st.mtimeMs });
        const m = entry.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
        if (m) dailyFiles.push({ date: m[1], size: st.size, modified: st.mtimeMs });
      }
    }
  } catch {}

  // Heatmap data: date -> size
  const heatmap: Record<string, number> = {};
  for (const f of dailyFiles) heatmap[f.date] = f.size;

  // Stale files (not updated in 30+ days)
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const staleFiles = allFiles
    .filter(f => now - f.modified > thirtyDays)
    .map(f => ({ name: f.name, path: f.path, daysSinceUpdate: Math.floor((now - f.modified) / (24*60*60*1000)) }));

  // Coverage gaps: days in past 30 with no daily note
  const gaps: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now - i * 24*60*60*1000);
    const ds = d.toISOString().slice(0, 10);
    if (!heatmap[ds]) gaps.push(ds);
  }

  // MEMORY.md size vs daily notes total
  const memoryMdSize = allFiles.find(f => f.name === "MEMORY.md")?.size || 0;
  const dailyTotalSize = dailyFiles.reduce((s, f) => s + f.size, 0);

  return NextResponse.json({
    totalFiles,
    totalSize,
    totalChunks,
    lastIndexed,
    heatmap,
    staleFiles,
    coverageGaps: gaps,
    memoryMdSize,
    dailyTotalSize,
    fileCount: allFiles.length,
  });
}
