"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";

type Tool = "pen" | "eraser" | "rect" | "circle" | "line";

interface WhiteboardProps {
  visible?: boolean;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ visible = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(2);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, []);

  const restoreSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !snapshotRef.current) return;
    ctx.putImageData(snapshotRef.current, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [visible]);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    startPos.current = pos;
    setDrawing(true);
    saveSnapshot();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lineWidth * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (tool === "pen") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
    }
  }, [getPos, tool, color, lineWidth, saveSnapshot]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "pen") {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lineWidth * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (tool === "line" || tool === "rect" || tool === "circle") {
      restoreSnapshot();
      if (!startPos.current) return;
      const sx = startPos.current.x;
      const sy = startPos.current.y;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (tool === "circle") {
        const rx = Math.abs(pos.x - sx) / 2;
        const ry = Math.abs(pos.y - sy) / 2;
        ctx.beginPath();
        ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [drawing, getPos, tool, color, lineWidth, restoreSnapshot]);

  const endDraw = useCallback(() => {
    setDrawing(false);
    startPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  if (!visible) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", height: "100%" }}>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        {(["pen", "eraser", "line", "rect", "circle"] as Tool[]).map((t) => (
          <button
            key={t}
            className="secondary"
            onClick={() => setTool(t)}
            style={{
              padding: "3px 10px", fontSize: "0.7rem", fontWeight: 600,
              background: tool === t ? "var(--primary)" : undefined,
              color: tool === t ? "white" : undefined,
              textTransform: "capitalize",
            }}
          >
            {t === "eraser" ? "Eraser" : t}
          </button>
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: "28px", height: "28px", padding: 0, border: "none", cursor: "pointer" }}
        />
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          style={{ width: "60px" }}
          title="Brush size"
        />
        <button className="secondary" onClick={clearCanvas} style={{ padding: "3px 10px", fontSize: "0.7rem", color: "#ef4444" }}>
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
        style={{ borderRadius: "12px", border: "1px solid var(--border)", cursor: "crosshair", flex: 1, touchAction: "none", width: "100%" }}
      />
    </div>
  );
};
