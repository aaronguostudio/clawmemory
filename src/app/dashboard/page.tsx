"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Database, Layers, Clock, AlertTriangle } from "lucide-react";

interface DashboardData {
  totalFiles: number;
  totalSize: number;
  totalChunks: number;
  lastIndexed: string;
  heatmap: Record<string, number>;
  staleFiles: { name: string; path: string; daysSinceUpdate: number }[];
  coverageGaps: string[];
  memoryMdSize: number;
  dailyTotalSize: number;
  fileCount: number;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function Heatmap({ data }: { data: Record<string, number> }) {
  // Generate last 365 days
  const days: { date: string; size: number }[] = [];
  const now = Date.now();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const ds = d.toISOString().slice(0, 10);
    days.push({ date: ds, size: data[ds] || 0 });
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = [];
  let week: typeof days = [];
  const firstDay = new Date(days[0].date).getDay();
  // Pad first week
  for (let i = 0; i < firstDay; i++) week.push({ date: "", size: 0 });
  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);

  const getColor = (size: number) => {
    if (size === 0) return "bg-muted/30";
    if (size < 500) return "bg-emerald-900/60";
    if (size < 2000) return "bg-emerald-700/70";
    if (size < 5000) return "bg-emerald-500/80";
    return "bg-emerald-400";
  };

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-2">
      {weeks.map((w, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {w.map((d, di) => (
            <div
              key={di}
              title={d.date ? `${d.date}: ${formatBytes(d.size)}` : ""}
              className={`w-[11px] h-[11px] rounded-[2px] ${d.date ? getColor(d.size) : "bg-transparent"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </div>
    );
  }

  const distillRatio = data.dailyTotalSize > 0
    ? ((data.memoryMdSize / data.dailyTotalSize) * 100).toFixed(1)
    : "0";

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold">Memory Health Dashboard</h1>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <FileText className="h-3.5 w-3.5" /> Files
            </div>
            <p className="text-2xl font-bold">{data.fileCount}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Database className="h-3.5 w-3.5" /> Total Size
            </div>
            <p className="text-2xl font-bold">{formatBytes(data.totalSize)}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Layers className="h-3.5 w-3.5" /> Chunks
            </div>
            <p className="text-2xl font-bold">{data.totalChunks}</p>
          </Card>
          <Card className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="h-3.5 w-3.5" /> Last Indexed
            </div>
            <p className="text-sm font-medium mt-1">
              {data.lastIndexed ? new Date(data.lastIndexed).toLocaleDateString() : "Never"}
            </p>
          </Card>
        </div>

        {/* Heatmap */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Memory Activity</h2>
          <Heatmap data={data.heatmap} />
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Less</span>
            {["bg-muted/30", "bg-emerald-900/60", "bg-emerald-700/70", "bg-emerald-500/80", "bg-emerald-400"].map(c => (
              <div key={c} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
            ))}
            <span>More</span>
          </div>
        </Card>

        {/* Distillation comparison */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Memory Distillation</h2>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">MEMORY.md (long-term)</p>
              <p className="font-semibold">{formatBytes(data.memoryMdSize)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Daily notes total</p>
              <p className="font-semibold">{formatBytes(data.dailyTotalSize)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Distill ratio</p>
              <p className="font-semibold">{distillRatio}%</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(parseFloat(distillRatio), 100)}%` }}
            />
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Stale memories */}
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
              Stale Memories
            </h2>
            {data.staleFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No stale files — everything is fresh!</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {data.staleFiles.map(f => (
                  <div key={f.path} className="flex items-center justify-between text-xs">
                    <span className="truncate">{f.name}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                      {f.daysSinceUpdate}d ago
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Coverage gaps */}
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold">Coverage Gaps (30d)</h2>
            <p className="text-xs text-muted-foreground">
              {data.coverageGaps.length} days without a daily note
            </p>
            <div className="flex flex-wrap gap-1">
              {data.coverageGaps.slice(0, 20).map(d => (
                <Badge key={d} variant="secondary" className="text-[10px]">{d.slice(5)}</Badge>
              ))}
              {data.coverageGaps.length > 20 && (
                <Badge variant="secondary" className="text-[10px]">+{data.coverageGaps.length - 20} more</Badge>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
