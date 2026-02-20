import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getWorkspacePath } from "@/lib/memories";

export async function GET() {
  const ws = getWorkspacePath();
  const tagMap = new Map<string, Set<string>>(); // tag -> set of file paths

  const processFile = (filePath: string, relativePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const tags = new Set<string>();

      for (const line of content.split("\n")) {
        // Headings
        const hm = line.match(/^#{1,3}\s+(.+)/);
        if (hm) {
          const val = hm[1].replace(/[*_`#]/g, "").trim().toLowerCase();
          if (val.length > 1 && val.length < 40) tags.add(val);
        }
        // Bold text
        for (const m of line.matchAll(/\*\*([^*]+)\*\*/g)) {
          const val = m[1].trim().toLowerCase();
          if (val.length > 1 && val.length < 40) tags.add(val);
        }
      }

      for (const tag of tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, new Set());
        tagMap.get(tag)!.add(relativePath);
      }
    } catch {}
  };

  const memoryPath = path.join(ws, "MEMORY.md");
  if (fs.existsSync(memoryPath)) processFile(memoryPath, "MEMORY.md");

  const memDir = path.join(ws, "memory");
  if (fs.existsSync(memDir)) {
    for (const entry of fs.readdirSync(memDir)) {
      if (!entry.endsWith(".md")) continue;
      processFile(path.join(memDir, entry), `memory/${entry}`);
    }
  }

  const tags = [...tagMap.entries()]
    .map(([tag, files]) => ({ tag, count: files.size, files: [...files] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return NextResponse.json(tags);
}
