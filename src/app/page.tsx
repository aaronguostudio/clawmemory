"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Pencil, Save, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MemoryFile {
  name: string;
  path: string;
  isDaily: boolean;
  date?: string;
  size: number;
  modified: string;
}

export default function MemoryBrowser() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const loadFiles = useCallback(async () => {
    const res = await fetch("/api/memories");
    const data = await res.json();
    setFiles(data);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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
  };

  const startEdit = () => {
    setEditContent(content);
    setEditing(true);
  };

  return (
    <div className="flex h-full">
      {/* File list */}
      <div className="w-64 border-r border-border flex flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold">Memory Files</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadFiles}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-0.5">
            {files.map((f) => (
              <button
                key={f.path}
                onClick={() => loadFile(f.path)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent w-full",
                  selected === f.path && "bg-accent text-accent-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
                {f.isDaily && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                    daily
                  </Badge>
                )}
              </button>
            ))}
            {files.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">No memory files found.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
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
            <ScrollArea className="flex-1 p-6">
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
