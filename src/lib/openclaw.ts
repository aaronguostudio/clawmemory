import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import Database from "better-sqlite3";

const exec = promisify(execFile);

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || "openclaw";

function getMemoryDbPath(): string {
  const home = process.env.HOME || "";
  return path.join(home, ".openclaw", "memory", "main.sqlite");
}

export interface IndexResult {
  success: boolean;
  output: string;
}

export interface SearchResult {
  file: string;
  chunk: string;
  score: number;
}

export interface MemoryStatus {
  filesIndexed: number;
  totalFiles: number;
  totalChunks: number;
  raw: string;
}

/**
 * Run `openclaw memory index` to reindex memory files.
 */
export async function openclawIndex(): Promise<IndexResult> {
  try {
    const { stdout, stderr } = await exec(OPENCLAW_BIN, ["memory", "index"], {
      timeout: 30000,
    });
    const output = (stdout + stderr).trim();
    return { success: true, output };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Index failed";
    return { success: false, output: message };
  }
}

/**
 * Search memory chunks using SQLite FTS5 full-text search.
 * No API key needed — reads the local index directly.
 */
export function openclawSearch(query: string): SearchResult[] {
  try {
    const dbPath = getMemoryDbPath();
    const db = new Database(dbPath, { readonly: true });
    try {
      // Escape double quotes in query for FTS5 safety
      const safeQuery = query.replace(/"/g, '""');
      const rows = db.prepare(`
        SELECT path, snippet(chunks_fts, 0, '', '', '…', 40) AS chunk, rank
        FROM chunks_fts
        WHERE chunks_fts MATCH ?
        ORDER BY rank
        LIMIT 20
      `).all(`"${safeQuery}"`);
      return (rows as { path: string; chunk: string; rank: number }[]).map((r) => ({
        file: r.path,
        chunk: r.chunk,
        score: 0,
      }));
    } finally {
      db.close();
    }
  } catch {
    return [];
  }
}

/**
 * Read index status directly from OpenClaw's SQLite database.
 * No API key needed — just a local DB read.
 */
export function openclawStatus(): MemoryStatus {
  try {
    const dbPath = getMemoryDbPath();
    const db = new Database(dbPath, { readonly: true });
    try {
      const fileCount = (db.prepare("SELECT COUNT(*) AS c FROM files").get() as { c: number }).c;
      const chunkCount = (db.prepare("SELECT COUNT(*) AS c FROM chunks").get() as { c: number }).c;
      return {
        filesIndexed: fileCount,
        totalFiles: fileCount,
        totalChunks: chunkCount,
        raw: `${fileCount} files indexed, ${chunkCount} chunks`,
      };
    } finally {
      db.close();
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Status check failed";
    return { filesIndexed: 0, totalFiles: 0, totalChunks: 0, raw: message };
  }
}
