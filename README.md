# Recall

> A beautiful, focused UI for managing [OpenClaw](https://openclaw.ai) AI agent memory files.

![License](https://img.shields.io/badge/license-MIT-blue)

## What is this?

Recall is a memory management interface for OpenClaw — the AI agent framework. It gives you a clean, modern UI to browse, edit, search, and explore your agent's memory files (`MEMORY.md` + `memory/*.md`).

This is **not** another generic dashboard. It's purpose-built for the OpenClaw memory system.

## Features

- 📁 **Memory Browser** — File tree with markdown rendering and inline editing
- 📅 **Timeline** — Daily memory files displayed as a scrollable timeline
- 🔍 **Search** — Full-text search across all memory files
- 🌙 **Dark mode** — Default dark theme, clean and minimal
- ⚡ **Fast** — Built on Next.js 15 with App Router

## Quick Start

```bash
git clone https://github.com/aaronsb/recall.git
cd recall
cp .env.example .env.local
# Edit .env.local to point to your OpenClaw workspace
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [react-markdown](https://github.com/remarkjs/react-markdown) with GFM support

## Configuration

Set the `OPENCLAW_WORKSPACE` environment variable to your OpenClaw workspace directory:

```
OPENCLAW_WORKSPACE=~/.openclaw/workspace
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories` | List all memory files |
| GET | `/api/memories/[path]` | Read a memory file |
| PUT | `/api/memories/[path]` | Update a memory file |
| GET | `/api/search?q=query` | Search across all files |

## Roadmap

- [ ] Markdown preview with syntax highlighting
- [ ] File creation (new daily notes)
- [ ] Diff view for file changes
- [ ] Memory graph visualization
- [ ] Tags and categories
- [ ] Export/import
- [ ] Multi-workspace support

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
