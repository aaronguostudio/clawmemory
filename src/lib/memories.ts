import fs from "fs/promises";
import path from "path";

export function getWorkspacePath(): string {
  const env = process.env.OPENCLAW_WORKSPACE;
  if (env) {
    return env.replace(/^~/, process.env.HOME || "");
  }
  return path.join(process.env.HOME || "", ".openclaw", "workspace");
}

export interface MemoryFile {
  name: string;
  path: string;
  isDaily: boolean;
  date?: string;
  size: number;
  modified: string;
}

export async function listMemories(): Promise<MemoryFile[]> {
  const ws = getWorkspacePath();
  const files: MemoryFile[] = [];

  // Check MEMORY.md
  try {
    const stat = await fs.stat(path.join(ws, "MEMORY.md"));
    files.push({
      name: "MEMORY.md",
      path: "MEMORY.md",
      isDaily: false,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch {}

  // Check memory/*.md
  const memDir = path.join(ws, "memory");
  try {
    const entries = await fs.readdir(memDir);
    for (const entry of entries) {
      if (!entry.endsWith(".md")) continue;
      const stat = await fs.stat(path.join(memDir, entry));
      const dateMatch = entry.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
      files.push({
        name: entry,
        path: `memory/${entry}`,
        isDaily: !!dateMatch,
        date: dateMatch ? dateMatch[1] : undefined,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  } catch {}

  return files.sort((a, b) => b.modified.localeCompare(a.modified));
}

export async function readMemory(filePath: string): Promise<string> {
  const ws = getWorkspacePath();
  const safe = path.normalize(filePath);
  if (safe.startsWith("..")) throw new Error("Invalid path");
  return fs.readFile(path.join(ws, safe), "utf-8");
}

export async function writeMemory(
  filePath: string,
  content: string
): Promise<void> {
  const ws = getWorkspacePath();
  const safe = path.normalize(filePath);
  if (safe.startsWith("..")) throw new Error("Invalid path");
  const full = path.join(ws, safe);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf-8");
}