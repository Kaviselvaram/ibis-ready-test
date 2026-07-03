import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";

// Lightweight, dependency-free SVG charts tuned to the paper/clay palette.
// All take plain arrays of real backend data and animate on mount.

const CLAY = "#c95f42";
const CLAY_DARK = "#a8462c";
const SAGE = "#4f6f5e";
const GOLD = "#d7a154";
const PALETTE = [CLAY, GOLD, SAGE, "#8a6db0", "#4f83a8", "#c07a9a"];

function niceMax(v) {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / pow) * pow;
}

/* ---- Area + line time series (handles null gaps for the score trend) ---- */
export function AreaTrend({ series, color = CLAY, height = 120, suffix = "" }) {
  const gid = useId().replace(/:/g, "");
  const W = 300;
  const H = height;
  const pad = 8;
  const values = series.map((s) => s.count);
  const present = values.filter((v) => v !== null && v !== undefined);
  const max = niceMax(Math.max(1, ...present));
  const n = series.length;
  const x = (i) => pad + (i / Math.max(1, n - 1)) * (W - pad * 2);
  const y = (v) => H - pad - ((v || 0) / max) * (H - pad * 2);

  // Build a line path, breaking at null points.
  let linePath = "";
  let started = false;
  series.forEach((s, i) => {
    if (s.count === null || s.count === undefined) { started = false; return; }
    linePath += `${started ? "L" : "M"}${x(i)},${y(s.count)} `;
    started = true;
  });
  const firstIdx = series.findIndex((s) => s.count !== null && s.count !== undefined);
  const lastIdx = series.length - 1 - [...series].reverse().findIndex((s) => s.count !== null && s.count !== undefined);
  const areaPath = firstIdx >= 0
    ? `M${x(firstIdx)},${H - pad} ` + series.slice(firstIdx, lastIdx + 1).map((s, k) => (s.count == null ? "" : `L${x(firstIdx + k)},${y(s.count)} `)).join("") + `L${x(lastIdx)},${H - pad} Z`
    : "";
  const lastVal = present.length ? present[present.length - 1] : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad} x2={W - pad} y1={pad + g * (H - pad * 2)} y2={pad + g * (H - pad * 2)} stroke="rgba(44,31,24,0.07)" strokeWidth="1" />
      ))}
      {areaPath && <motion.path d={areaPath} fill={`url(#area-${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />}
      <motion.path
        d={linePath} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {lastIdx >= 0 && (
        <motion.circle cx={x(lastIdx)} cy={y(lastVal)} r="3.4" fill={color}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.85, type: "spring" }} />
      )}
    </svg>
  );
}

/* ---- Vertical bars (score distribution) ---- */
export function BarSeries({ data, color = GOLD }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  return (
    <div className="chart-bars">
      {data.map((d, i) => (
        <div key={d.label} className="chart-bar-col">
          <div className="chart-bar-track">
            <motion.div
              className="chart-bar-fill"
              style={{ background: color }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
            >
              <span className="chart-bar-val">{d.count}</span>
            </motion.div>
          </div>
          <span className="chart-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Donut (engagement by type / access split) ---- */
export function Donut({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="chart-donut">
      <svg viewBox="0 0 110 110" role="img">
        <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(44,31,24,0.08)" strokeWidth="13" />
        {segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * C;
          const el = (
            <motion.circle
              key={seg.label}
              cx="55" cy="55" r={R} fill="none"
              stroke={seg.color || PALETTE[i % PALETTE.length]}
              strokeWidth="13" strokeLinecap="butt"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 55 55)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x="55" y="51" textAnchor="middle" className="donut-value">{centerValue}</text>
        <text x="55" y="66" textAnchor="middle" className="donut-label">{centerLabel}</text>
      </svg>
      <ul className="chart-legend">
        {segments.map((seg, i) => (
          <li key={seg.label}>
            <i style={{ background: seg.color || PALETTE[i % PALETTE.length] }} />
            <span>{seg.label}</span>
            <b>{seg.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- Horizontal ranked bars (top chapters / batch performance) ---- */
export function RankBars({ items, valueKey = "value", labelKey = "name", suffix = "", color = SAGE }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  return (
    <div className="chart-rankbars">
      {items.map((it, i) => (
        <div key={`${it[labelKey]}-${i}`} className="rankbar-row">
          <span className="rankbar-label" title={it[labelKey]}>{it[labelKey]}</span>
          <div className="rankbar-track">
            <motion.div
              className="rankbar-fill"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${(it[valueKey] / max) * 100}%` }}
              transition={{ delay: i * 0.06, duration: 0.55, ease: "easeOut" }}
            />
          </div>
          <span className="rankbar-val">{it[valueKey]}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

export { PALETTE, CLAY, CLAY_DARK, SAGE, GOLD };
