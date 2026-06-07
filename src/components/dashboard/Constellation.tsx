"use client";

import { useEffect, useState } from "react";
import type { ConstellationNode } from "@/lib/constellation";

type Props = {
  nodes: ConstellationNode[];
  highlightDirection?: string | null;
  /** Compact variant for the dashboard home (no labels under small nodes). */
  size?: "full" | "compact";
};

const CX = 170;
const CY = 150;

// Stronger weight → closer to center.
function radiusFor(weight: number) {
  return 122 - weight * 50; // ~72 (strong) .. ~115 (faint)
}

function dotFor(weight: number) {
  return 5 + weight * 13; // 5 .. 18
}

export default function Constellation({ nodes, highlightDirection, size = "full" }: Props) {
  // Animate the highlighted node in: it starts further out + dimmer, then
  // "pulls closer" once mounted. Everything else fades up in place.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const n = nodes.length || 1;

  return (
    <svg
      viewBox="0 0 340 300"
      className="w-full max-w-md"
      role="img"
      aria-label="A constellation of the directions drawing you in"
    >
      {/* connecting lines */}
      {nodes.map((node, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const isHi = node.direction === highlightDirection;
        const liveWeight = isHi && !mounted ? Math.max(0.14, node.weight - 0.35) : node.weight;
        const r = radiusFor(liveWeight);
        const x = CX + r * Math.cos(angle);
        const y = CY + r * Math.sin(angle);
        return (
          <line
            key={`l-${i}`}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="#a78bfa"
            strokeWidth={isHi ? 1.4 : 1}
            strokeOpacity={(isHi && mounted ? 0.5 : 0.18) * (0.5 + liveWeight / 2)}
            style={{ transition: "all 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        );
      })}

      {/* center "you" */}
      <circle cx={CX} cy={CY} r="22" fill="#ede9fe" />
      <circle cx={CX} cy={CY} r="22" fill="none" stroke="#7c3aed" strokeWidth="1.2" strokeOpacity="0.4" />
      <text
        x={CX}
        y={CY + 4}
        textAnchor="middle"
        className="fill-violet-700"
        style={{ fontSize: 12, fontWeight: 600 }}
      >
        you
      </text>

      {/* direction nodes */}
      {nodes.map((node, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const isHi = node.direction === highlightDirection;
        const liveWeight = isHi && !mounted ? Math.max(0.14, node.weight - 0.35) : node.weight;
        const r = radiusFor(liveWeight);
        const x = CX + r * Math.cos(angle);
        const y = CY + r * Math.sin(angle);
        const dot = dotFor(liveWeight);
        const opacity = isHi && mounted ? 1 : 0.35 + liveWeight * 0.6;
        const labelRight = x >= CX;

        return (
          <g
            key={`n-${i}`}
            style={{ transition: "all 900ms cubic-bezier(0.22, 1, 0.36, 1)", opacity }}
          >
            {/* pulse ring on the just-reinforced node */}
            {isHi && (
              <circle cx={x} cy={y} r={dot + 4} fill="none" stroke="#7c3aed" strokeWidth="1.5">
                <animate attributeName="r" from={dot + 2} to={dot + 14} dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.55" to="0" dur="1.6s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={x}
              cy={y}
              r={dot}
              fill={isHi ? "#7c3aed" : node.count > 0 ? "#a78bfa" : "#d6d3d1"}
              style={{ transition: "all 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
            {(size === "full" || node.count > 0) && (
              <text
                x={labelRight ? x + dot + 6 : x - dot - 6}
                y={y + 3.5}
                textAnchor={labelRight ? "start" : "end"}
                className={isHi ? "fill-violet-700" : "fill-stone-500"}
                style={{ fontSize: 11, fontWeight: isHi ? 600 : 500 }}
              >
                {node.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
