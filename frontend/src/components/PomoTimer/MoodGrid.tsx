import { useState, useRef, useEffect } from "react";

interface MoodGridProps {
  onChange: (mood : {x: number; y: number; color: string}) => void;
}

export default function MoodGrid({ onChange }: MoodGridProps) {
  // x: sad (0) to happy (1), y: irritated (0) to calm (1)
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Color interpolation
  // X-axis: Blue (0,0,255) → Yellow (255,255,0)
  const interpolateXColor = (x: number) => {
    const r = Math.round(255 * x);            // 0 → 255
    const g = Math.round(255 * x);            // 0 → 255
    const b = Math.round(255 * (1 - x));      // 255 → 0
    return `rgb(${r},${g},${b})`;
  };

  // Y-axis: Magenta (255,0,255) → Green (0,255,0)
  const interpolateYColor = (y: number) => {
    const r = Math.round(255 * (1 - y));      // 255 → 0
    const g = Math.round(255 * y);            // 0 → 255
    const b = Math.round(255 * (1 - y));      // 255 → 0
    return `rgb(${r},${g},${b})`;
  };

  // Blend two colors (simple average)
  const blendColors = (c1: string, c2: string) => {
    const toRgb = (c: string) =>
      c
        .replace(/[^\d,]/g, "")
        .split(",")
        .map(Number);

    const rgb1 = toRgb(c1);
    const rgb2 = toRgb(c2);

    const r = Math.round((rgb1[0] + rgb2[0]) / 2);
    const g = Math.round((rgb1[1] + rgb2[1]) / 2);
    const b = Math.round((rgb1[2] + rgb2[2]) / 2);

    return `rgb(${r},${g},${b})`;
  };

  const color = blendColors(interpolateXColor(position.x), interpolateYColor(position.y));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const normX = x / (width - 1);
        const normY = y / (height - 1);

        const xColor = interpolateXColor(normX);
        const yColor = interpolateYColor(normY);

        const toRgb = (c: string) =>
          c.replace(/[^\d,]/g, "").split(",").map(Number);

        const [r1, g1, b1] = toRgb(xColor);
        const [r2, g2, b2] = toRgb(yColor);

        const r = Math.round((r1 + r2) / 2);
        const g = Math.round((g1 + g2) / 2);
        const b = Math.round((b1 + b2) / 2);

        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255; // alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      updatePosition(e);
    }
  };

  const updatePosition = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;

    // Clamp between 0 and 1
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    setPosition({ x, y });

    const newColor = blendColors(interpolateXColor(x), interpolateYColor(y));
    onChange({ x, y, color: newColor });
  };

    return (
    <div className="flex flex-col items-center text-s p-4 bg-gray-700 rounded-lg shadow-lg">
      <label className="block text-2xl font-semibold">What is your mood right now?</label>
      {/* Mood grid container */}
      <label className="text-gray-400 m-4 texl-l">Excited</label>
      <div className="flex flex-row justify-between items-center mt-1 px-1 text-s font-mono text-gray-100">
        <div className="flex justify-center m-1 flex-1">
          <label className="text-gray-400 m-4 texl-l">Sad</label>
        </div>
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          style={{
            position: "relative",
            width: 300,
            height: 300,
            borderRadius: 8,
            touchAction: "none",
            userSelect: "none",
          }}
        >
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 8,
              zIndex: 0,
            }}
          />
          {/* Dot */}
          <div
            style={{
              position: "absolute",
              top: `${position.y * 100}%`,
              left: `${position.x * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "3px solid white",
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}`,
              cursor: "pointer",
            }}
          />
        </div>
        <div className="flex justify-center ml-2 flex-1">
          <label className="text-gray-400 m-4 texl-l">Happy</label>
        </div>
      </div>
      <label className="text-gray-400 m-4 texl-l">Calm</label>
    </div>
  );
}
