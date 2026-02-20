"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Search, FileText } from "lucide-react";

interface SearchResult {
  file: string;
  chunk: string;
  score: number;
}

type Mode = "fulltext" | "semantic" | "both";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("fulltext");
  const [ftResults, setFtResults] = useState<SearchResult[]>([]);
  const [semResults, setSemResults] = useState<SearchResult[]>([]);
  const [semError, setSemError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setFtResults([]);
    setSemResults([]);
    setSemError("");

    const doFt = mode === "fulltext" || mode === "both";
    const doSem = mode === "semantic" || mode === "both";

    const promises: Promise<void>[] = [];
    if (doFt) {
      promises.push(
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then(r => r.json())
          .then(setFtResults)
      );
    }
    if (doSem) {
      promises.push(
        fetch(`/api/search/semantic?q=${encodeURIComponent(query)}`)
          .then(async r => {
            const data = await r.json();
            if (data.error) {
              setSemError(data.error);
            } else if (Array.isArray(data)) {
              setSemResults(data.map((d: { path?: string; file?: string; text?: string; chunk?: string; score?: number }) => ({
                file: d.path || d.file || "",
                chunk: d.text || d.chunk || "",
                score: d.score || 0,
              })));
            }
          })
      );
    }
    await Promise.allSettled(promises);
    setLoading(false);
  };

  const ResultList = ({ results, label }: { results: SearchResult[]; label: string }) => (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h3>
      {results.length === 0 ? (
        <p className="text-xs text-muted-foreground">No results.</p>
      ) : (
        results.map((r, i) => (
          <Card key={i} className="p-3 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium truncate">{r.file}</span>
              {r.score > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto shrink-0">
                  {(r.score * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 pl-5.5">{r.chunk}</p>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold">Search Playground</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        <div className="flex gap-1">
          {(["fulltext", "semantic", "both"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                mode === m ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {m === "fulltext" ? "Full-text" : m === "semantic" ? "Semantic" : "Both"}
            </button>
          ))}
        </div>

        {semError && (
          <Card className="p-3 border-yellow-500/30 bg-yellow-500/5">
            <p className="text-xs text-yellow-500">Semantic search unavailable: {semError}</p>
          </Card>
        )}

        {mode === "both" ? (
          <div className="grid md:grid-cols-2 gap-6">
            <ResultList results={ftResults} label="Full-text Results" />
            <ResultList results={semResults} label="Semantic Results" />
          </div>
        ) : mode === "fulltext" ? (
          <ResultList results={ftResults} label="Full-text Results" />
        ) : (
          <ResultList results={semResults} label="Semantic Results" />
        )}
      </div>
    </ScrollArea>
  );
}
