"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  label: string;
  type: "person" | "project" | "tool" | "other";
  val: number;
  snippets: { file: string; text: string }[];
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

const TYPE_COLORS: Record<string, string> = {
  person: "#3b82f6",
  project: "#22c55e",
  tool: "#a855f7",
  other: "#6b7280",
};

export default function GraphPage() {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    fetch("/api/graph").then(r => r.json()).then(setGraphData);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNodeClick = useCallback((node: object) => {
    setSelected(node as GraphNode);
  }, []);

  const nodeCanvasObject = useCallback((node: object, ctx: CanvasRenderingContext2D) => {
    const n = node as GraphNode;
    const size = Math.max(4, Math.min(n.val * 2, 20));
    const color = TYPE_COLORS[n.type] || TYPE_COLORS.other;
    
    ctx.beginPath();
    ctx.arc(n.x || 0, n.y || 0, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    if (selected?.id === n.id) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.font = `${Math.max(3, size * 0.8)}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x || 0, (n.y || 0) + size + 6);
  }, [selected]);

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Loading graph…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div ref={containerRef} className="flex-1 bg-background relative">
        {graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No entities found in memory files.</p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            width={dimensions.width - (selected ? 320 : 0)}
            height={dimensions.height}
            nodeCanvasObject={nodeCanvasObject}
            onNodeClick={handleNodeClick}
            linkColor={() => "rgba(255,255,255,0.1)"}
            backgroundColor="transparent"
            nodePointerAreaPaint={(node: object, color: string, ctx: CanvasRenderingContext2D) => {
              const n = node as GraphNode;
              const size = Math.max(4, Math.min(n.val * 2, 20));
              ctx.beginPath();
              ctx.arc(n.x || 0, n.y || 0, size + 4, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
          />
        )}
        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-3 text-[11px] text-muted-foreground">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      {selected && (
        <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">{selected.label}</h2>
              <Badge variant="secondary" className="text-[10px] mt-1" style={{ color: TYPE_COLORS[selected.type] }}>
                {selected.type}
              </Badge>
              <span className="text-[11px] text-muted-foreground ml-2">{selected.val} mentions</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {selected.snippets.map((s, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">{s.file}</p>
                  <p className="text-xs bg-muted/30 rounded p-2">{s.text}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
