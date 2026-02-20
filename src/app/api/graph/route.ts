import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getWorkspacePath } from "@/lib/memories";

interface Entity {
  id: string;
  label: string;
  type: "person" | "project" | "tool" | "other";
  count: number;
  snippets: { file: string; text: string }[];
}

const KNOWN_PEOPLE = new Set(["aaron", "grace"]);
const KNOWN_PROJECTS = new Set(["orgnext", "recall", "clawmemory", "openclaw memory manager"]);
const KNOWN_TOOLS = new Set(["openclaw", "claude code", "claude", "cursor", "github", "git", "npm", "next.js", "nextjs", "tailwind", "shadcn", "elevenlabs"]);

function classifyEntity(name: string): Entity["type"] {
  const lower = name.toLowerCase();
  if (KNOWN_PEOPLE.has(lower)) return "person";
  if (KNOWN_PROJECTS.has(lower)) return "project";
  if (KNOWN_TOOLS.has(lower)) return "tool";
  return "other";
}

function extractEntities(content: string, fileName: string): { name: string; snippet: string }[] {
  const entities: { name: string; snippet: string }[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Headings
    const hm = line.match(/^#{1,3}\s+(.+)/);
    if (hm) {
      const val = hm[1].replace(/[*_`]/g, "").trim();
      if (val.length > 1 && val.length < 50) {
        entities.push({ name: val, snippet: line.trim() });
      }
    }

    // Bold text
    const boldMatches = line.matchAll(/\*\*([^*]+)\*\*/g);
    for (const m of boldMatches) {
      const val = m[1].trim();
      if (val.length > 1 && val.length < 50) {
        entities.push({ name: val, snippet: line.trim() });
      }
    }
  }

  // Also match known entities anywhere in content
  const allKnown = [...KNOWN_PEOPLE, ...KNOWN_PROJECTS, ...KNOWN_TOOLS];
  for (const known of allKnown) {
    const regex = new RegExp(`\\b${known.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
    const match = content.match(regex);
    if (match) {
      // Find a context line
      const idx = content.toLowerCase().indexOf(known.toLowerCase());
      const start = content.lastIndexOf("\n", idx) + 1;
      const end = content.indexOf("\n", idx);
      const snippet = content.slice(start, end === -1 ? start + 100 : end).trim();
      entities.push({ name: match[0], snippet });
    }
  }

  return entities;
}

export async function GET() {
  const ws = getWorkspacePath();
  const entityMap = new Map<string, Entity>();
  const fileEntities = new Map<string, Set<string>>(); // file -> entity ids

  const processFile = (filePath: string, relativePath: string) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const extracted = extractEntities(content, relativePath);
      const fileEntityIds = new Set<string>();

      for (const { name, snippet } of extracted) {
        const id = name.toLowerCase().replace(/\s+/g, "-");
        if (id.length < 2) continue;
        
        if (!entityMap.has(id)) {
          entityMap.set(id, {
            id,
            label: name,
            type: classifyEntity(name),
            count: 0,
            snippets: [],
          });
        }
        const entity = entityMap.get(id)!;
        entity.count++;
        if (entity.snippets.length < 5) {
          entity.snippets.push({ file: relativePath, text: snippet.slice(0, 200) });
        }
        fileEntityIds.add(id);
      }
      fileEntities.set(relativePath, fileEntityIds);
    } catch {}
  };

  // Process MEMORY.md
  const memoryPath = path.join(ws, "MEMORY.md");
  if (fs.existsSync(memoryPath)) processFile(memoryPath, "MEMORY.md");

  // Process memory/*.md
  const memDir = path.join(ws, "memory");
  if (fs.existsSync(memDir)) {
    for (const entry of fs.readdirSync(memDir)) {
      if (!entry.endsWith(".md")) continue;
      processFile(path.join(memDir, entry), `memory/${entry}`);
    }
  }

  // Filter to entities appearing 2+ times or are known
  const nodes = [...entityMap.values()]
    .filter(e => e.count >= 2 || e.type !== "other")
    .map(e => ({ id: e.id, label: e.label, type: e.type, val: e.count, snippets: e.snippets }));

  const nodeIds = new Set(nodes.map(n => n.id));

  // Build edges: two entities in same file
  const linkMap = new Map<string, number>();
  for (const [, ids] of fileEntities) {
    const arr = [...ids].filter(id => nodeIds.has(id));
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const key = [arr[i], arr[j]].sort().join("||");
        linkMap.set(key, (linkMap.get(key) || 0) + 1);
      }
    }
  }

  const links = [...linkMap.entries()].map(([key, value]) => {
    const [source, target] = key.split("||");
    return { source, target, value };
  });

  return NextResponse.json({ nodes, links });
}
