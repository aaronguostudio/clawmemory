"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { FileText, Pencil, Save, X, RefreshCw, Search, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MemoryFile {
  name: string;
  path: string;
  isDaily: boolean;
  date?: string;
  size: number;
  modified: string;
}

interface SearchResult {
  file: string;
  chunk: string;
  score: number;
}

interface IndexStatus {
  filesIndexed: number;
  totalFiles: number;
  totalChunks: number;
  raw: string;
}

type Filter = "all" | "daily";

export default function MemoryBrowser() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [reindexing, setReindexing] = useState(false);

  // Sidebar resize
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const dragging = useRef(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const clamped = Math.min(Math.max(e.clientX, 200), 480);
      setSidebarWidth(clamped);
    };
    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResize = () => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // Index status
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);

  const loadFiles = useCallback(async () => {
    const res = await fetch("/api/memories");
    const data = await res.json();
    setFiles(data);
    // Auto-select first file on initial load
    if (!selected && data.length > 0) {
      const first = data[0];
      setSelected(first.path);
      const fileRes = await fetch(`/api/memories/${first.path}`);
      const fileData = await fileRes.json();
      setContent(fileData.content);
    }
  }, [selected]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setIndexStatus(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadFiles();
    loadStatus();
  }, [loadFiles, loadStatus]);

  const filteredFiles = filter === "daily"
    ? files.filter((f) => f.isDaily).sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    : files;

  const loadFile = async (path: string) => {
    setSelected(path);
    setEditing(false);
    const res = await fetch(`/api/memories/${path}`);
    const data = await res.json();
    setContent(data.content);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch(`/api/memories/${selected}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    setContent(editContent);
    setEditing(false);
    setSaving(false);
    // Show reindexing state briefly
    setReindexing(true);
    setTimeout(() => {
      setReindexing(false);
      loadStatus();
    }, 3000);
  };

  const startEdit = () => {
    setEditContent(content);
    setEditing(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchActive(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchActive(false);
  };

  return (
    <div className="flex h-full">
      {/* File list */}
      <div
        className="border-r border-border bg-card flex flex-col overflow-hidden shrink-0"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center pt-4 pb-3 px-4">
          <Image src="/claw-memory-logo.png" alt="ClawMemory" width={200} height={80} className="w-auto h-12" />
        </div>
        <Separator />

        {/* Search */}
        <form onSubmit={handleSearch} className="px-3 pt-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
            {searchActive && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </form>

        {/* Filter / Search Results header */}
        {searchActive ? (
          <div className="px-4 py-2">
            <h2 className="text-sm font-semibold">Search Results</h2>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                filter === "all"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter("daily")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                filter === "daily"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              Daily
            </button>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadFiles}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <Separator />

        {/* File list or search results */}
        <ScrollArea className="flex-1">
          {searchActive ? (
            <div className="p-2 flex flex-col gap-0.5">
              {searching ? (
                <p className="text-xs text-muted-foreground p-3">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3">No results found.</p>
              ) : (
                searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => loadFile(r.file)}
                    className={cn(
                      "flex flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent w-full",
                      selected === r.file && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate min-w-0 flex-1 text-xs font-medium">{r.file}</span>
                      {r.score > 0 && (
                        <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                          {(r.score * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 pl-5.5">
                      {r.chunk}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-0.5">
              {filteredFiles.map((f) => (
                <button
                  key={f.path}
                  onClick={() => loadFile(f.path)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent w-full",
                    selected === f.path && "bg-accent text-accent-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate min-w-0 flex-1">{f.name}</span>
                  {f.isDaily && (
                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                      daily
                    </Badge>
                  )}
                </button>
              ))}
              {filteredFiles.length === 0 && (
                <p className="text-xs text-muted-foreground p-3">
                  {filter === "daily" ? "No daily memory files found." : "No memory files found."}
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Index status */}
        <Separator />
        <div className="px-3 py-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Database className="h-3 w-3 shrink-0" />
          {reindexing ? (
            <span>Reindexing…</span>
          ) : indexStatus && indexStatus.totalFiles > 0 ? (
            <span>{indexStatus.filesIndexed}/{indexStatus.totalFiles} indexed · {indexStatus.totalChunks} chunks</span>
          ) : indexStatus?.raw?.includes("No API key") ? (
            <span>Index needs API key config</span>
          ) : (
            <span>Index not configured</span>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="w-1 cursor-col-resize hover:bg-accent active:bg-accent shrink-0 transition-colors"
      />

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {selected ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h1 className="text-sm font-semibold">{selected}</h1>
                <p className="text-xs text-muted-foreground">
                  {files.find((f) => f.path === selected)?.size} bytes
                </p>
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={saving}>
                      <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-0 flex-1 p-6">
              {editing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[calc(100vh-200px)] font-mono text-sm resize-none"
                />
              ) : (
                <article className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </article>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a memory file to view
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
