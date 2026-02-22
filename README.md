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

## Roadmap

### ✅ v0.1 — Foundation (Done)
- Memory Browser with inline editing
- Full-text search (FTS5)
- Auto-reindex on save
- Index status display

### 🔨 v0.2 — Intelligence Layer (In Progress)
- Health Dashboard — stats, activity heatmap, stale file detection, gap analysis
- Memory Graph — force-directed entity visualization
- Enhanced Search — semantic + full-text, side-by-side mode
- Memory Templates — one-click daily/project/person notes
- Tags & Smart Filters — auto-extracted tag cloud

### 🧠 v0.3 — AI-Powered Journal
- **Quick Capture** — Send a message to your agent, auto-archived to today's journal
- **AI Prompts** — Agent asks follow-up questions during daily sync ("What was your biggest win today? What's blocking you?")
- **Weekly/Monthly Reviews** — Auto-generated summaries with trends, decisions, and highlights
- **Mood & Energy Tracking** — Optional tags to track how you felt, visualized over time
- **Streak & Habit Tracking** — Visualize consistency of daily journaling

### 🔮 v0.4 — Deep Memory
- Semantic search visualization (what was searched, what matched, scores)
- Memory relationship graph with AI-detected connections
- Multi-agent memory comparison
- Memory analytics (growth, topics, frequency trends)
- "This day last month/year" — resurface old memories

### 🌐 v0.5 — Ecosystem
- ClawHub skill integration
- Export / backup (ZIP, PDF, Obsidian-compatible)
- Import from other journal apps
- Shareable read-only memory snapshots
- Mobile-friendly responsive UI

## License

[MIT](LICENSE)
