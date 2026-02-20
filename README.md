# ClawMemory

> A clean, focused UI for managing [OpenClaw](https://openclaw.ai) AI agent memory files.

![License](https://img.shields.io/badge/license-MIT-blue)

## What is this?

ClawMemory is a memory management interface for OpenClaw — the AI agent framework. It gives you a modern UI to browse, edit, and search your agent's memory files (`MEMORY.md` + `memory/*.md`).

## Features

- **Memory Browser** — Resizable sidebar with markdown rendering and inline editing
- **Full-Text Search** — FTS5-powered search across all indexed memory chunks
- **Daily Filter** — Toggle between all files and daily memory notes
- **Index Status** — Live view of indexed files and chunks from OpenClaw's SQLite database
- **Auto-Reindex** — Triggers `openclaw memory index` after saving edits
- **Dark Mode** — Default dark theme

## Quick Start

```bash
git clone https://github.com/aaronguostudio/clawmemory.git
cd clawmemory
cp .env.example .env.local
# Edit .env.local to point to your OpenClaw workspace
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Set the `OPENCLAW_WORKSPACE` environment variable to your OpenClaw workspace directory:

```
OPENCLAW_WORKSPACE=~/.openclaw/workspace
```

ClawMemory reads the OpenClaw SQLite database at `~/.openclaw/memory/main.sqlite` for search and index status. No API keys are needed for browsing, editing, or searching.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for direct SQLite reads
- [react-markdown](https://github.com/remarkjs/react-markdown) with GFM support

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories` | List all memory files |
| GET | `/api/memories/[path]` | Read a memory file |
| PUT | `/api/memories/[path]` | Update a memory file (triggers reindex) |
| GET | `/api/search?q=query` | Full-text search via FTS5 |
| GET | `/api/status` | Index health (files indexed, chunk count) |

## License

[MIT](LICENSE)
