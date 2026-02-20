"use client";

import { useEffect, useState } from "react";
import { Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

interface MemoryFile {
  name: string;
  path: string;
  isDaily: boolean;
  date?: string;
}

interface DayEntry {
  date: string;
  path: string;
  preview: string;
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/memories");
      const files: MemoryFile[] = await res.json();
      const dailies = files.filter((f) => f.isDaily).sort((a, b) =>
        (b.date || "").localeCompare(a.date || "")
      );

      const loaded: DayEntry[] = [];
      for (const f of dailies) {
        const res = await fetch(`/api/memories/${f.path}`);
        const data = await res.json();
        const lines = (data.content as string).split("\n").filter(Boolean);
        loaded.push({
          date: f.date!,
          path: f.path,
          preview: lines.slice(0, 6).join("\n"),
        });
      }
      setEntries(loaded);
      setLoading(false);
    }
    load();
  }, []);

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Timeline</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No daily memory files found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Files should be named memory/YYYY-MM-DD.md
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

            <div className="flex flex-col gap-4">
              {entries.map((entry) => (
                <div key={entry.date} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-5 top-5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                  <Link href={`/?file=${entry.path}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <span>{formatDate(entry.date)}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {entry.date}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed line-clamp-6">
                          {entry.preview}
                        </pre>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
