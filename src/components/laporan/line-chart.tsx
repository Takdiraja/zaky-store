"use client";

import { useMemo } from "react";
import { formatCurrencyCompact } from "@/lib/formatters";

export interface LineChartPoint {
  label: string;
  value: number;
}

interface Props {
  data: LineChartPoint[];
  color?: string;
  formatValue?: (v: number) => string;
}

/**
 * Responsive smooth SVG line chart with area fill.
 * Uses a stretched viewBox (preserveAspectRatio="none") with
 * vectorEffect="non-scaling-stroke" so the line width stays constant;
 * point markers are HTML dots so they never distort.
 */
export default function LineChart({
  data,
  color = "var(--color-secondary, #2563eb)",
  formatValue = formatCurrencyCompact,
}: Props) {
  const { linePath, areaPath, maxValue } = useMemo(() => {
    const n = data.length;
    const max = Math.max(...data.map((d) => d.value), 0);
    if (n === 0) return { linePath: "", areaPath: "", maxValue: 0 };

    const points = data.map((d, i) => {
      const x = n === 1 ? 50 : (i / (n - 1)) * 100;
      const ratio = max > 0 ? d.value / max : 0;
      const y = 40 - ratio * 40;
      return { x, y };
    });

    if (n === 1) {
      const p = points[0];
      return {
        linePath: `M${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        areaPath: `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${p.x.toFixed(1)},40`,
        maxValue: max,
      };
    }

    // Catmull-Rom to cubic Bézier for a smooth curve.
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    return {
      linePath: d,
      areaPath: `${d} L100,40 L0,40 Z`,
      maxValue: max,
    };
  }, [data]);

  if (data.length === 0 || maxValue === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-on-surface-variant/50">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="relative h-64">
      {/* Horizontal gridlines + Y-axis labels */}
      <div className="absolute inset-0 grid grid-rows-5 pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-t border-surface-variant relative">
            <span className="absolute -top-2 left-0 text-caption text-on-surface-variant">
              {maxValue > 0 ? formatValue(maxValue - (maxValue / 4) * i) : "Rp 0"}
            </span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
        {/* Area fill */}
        <path d={areaPath} fill="var(--color-chart-2, rgba(37, 99, 235, 0.08))" opacity="0.12" stroke="none" />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Point markers (HTML dots, stay round) */}
      <div className="absolute inset-0 pointer-events-none">
        {data.map((point, i) => {
          const x = (i / (data.length - 1)) * 100;
          const ratio = maxValue > 0 ? point.value / maxValue : 0;
          const y = 100 - ratio * 100;
          return (
            <div
              key={i}
              className="group absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, backgroundColor: color }}
              title={`${point.label}: ${formatValue(point.value)}`}
            />
          );
        })}
      </div>
    </div>
  );
}
