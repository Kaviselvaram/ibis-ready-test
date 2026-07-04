import React, { useId } from "react";
import { motion } from "framer-motion";

// Shared, dependency-free SVG charts (paper/clay palette). Used by the admin
// analytics dashboard and the student progress dashboard alike.

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

/* ---- Area + line time series (handles null gaps) ---- */
export function AreaTrend({ series, color = CLAY, height = 120 }) {
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

/* ---- Vertical bars ---- */
export function BarSeries({ data, color = GOLD }) {
  const max = niceMax(Math.max(1, ...data.map((d) => d.count)));
  return (
    <div className="chart-bars">
      {data.map((d, i) => (
        <div key={d.label} className="chart-bar-col">
          <div className="chart-bar-track">
            <motion.div
              className="chart-bar-fill" style={{ background: color }}
              initial={{ height: 0 }} animate={{ height: `${(d.count / max) * 100}%` }}
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

/* ---- Donut ---- */
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
            <motion.circle key={seg.label} cx="55" cy="55" r={R} fill="none"
              stroke={seg.color || PALETTE[i % PALETTE.length]} strokeWidth="13" strokeLinecap="butt"
              strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset} transform="rotate(-90 55 55)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }} />
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
            <span>{seg.label}</span><b>{seg.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- Horizontal ranked bars ---- */
export function RankBars({ items, valueKey = "value", labelKey = "name", suffix = "", color = SAGE }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  return (
    <div className="chart-rankbars">
      {items.map((it, i) => (
        <div key={`${it[labelKey]}-${i}`} className="rankbar-row">
          <span className="rankbar-label" title={it[labelKey]}>{it[labelKey]}</span>
          <div className="rankbar-track">
            <motion.div className="rankbar-fill" style={{ background: color }}
              initial={{ width: 0 }} animate={{ width: `${(it[valueKey] / max) * 100}%` }}
              transition={{ delay: i * 0.06, duration: 0.55, ease: "easeOut" }} />
          </div>
          <span className="rankbar-val">{it[valueKey]}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Radar chart (e.g. Bloom's levels) ---- */
export function RadarChart({ axes, color = CLAY, size = 220 }) {
  // axes: [{ label, value }] where value is 0..100
  const cx = size / 2, cy = size / 2, R = size / 2 - 34;
  const n = axes.length;
  if (n < 3) return <div className="chart-empty">Need more data to chart</div>;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, r) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  const rings = [0.25, 0.5, 0.75, 1];
  const dataPts = axes.map((a, i) => point(i, (Math.max(0, Math.min(100, a.value)) / 100) * R));
  const dataPath = dataPts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg" role="img">
      {rings.map((r) => (
        <polygon key={r}
          points={axes.map((_, i) => point(i, r * R).join(",")).join(" ")}
          fill="none" stroke="rgba(44,31,24,0.09)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(44,31,24,0.08)" strokeWidth="1" />;
      })}
      <motion.path d={dataPath} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2"
        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
        style={{ transformOrigin: "center" }} />
      {dataPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill={color} />)}
      {axes.map((a, i) => {
        const [x, y] = point(i, R + 16);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="radar-label">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ---- Circular progress ring (for a single 0..100 metric) ---- */
export function ProgressRing({ value, label, sub, color = CLAY, size = 104 }) {
  const R = size / 2 - 9;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="ring-metric">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(44,31,24,0.09)" strokeWidth="9" />
        <motion.circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth="9"
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={C} initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (pct / 100) * C }} transition={{ duration: 0.9, ease: "easeOut" }} />
        <text x="50%" y="48%" textAnchor="middle" className="ring-value">{Math.round(value)}{label === "%" ? "%" : ""}</text>
        {sub && <text x="50%" y="63%" textAnchor="middle" className="ring-sub">{sub}</text>}
      </svg>
    </div>
  );
}

/* ---- Study-consistency heatmap (GitHub-style, real activity per day) ---- */
export function Heatmap({ days }) {
  // days: [{ date, count }] oldest→newest (91). Group into week columns.
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const max = Math.max(1, ...days.map((d) => d.count));
  const level = (c) => (c <= 0 ? 0 : c >= max ? 4 : Math.min(3, Math.ceil((c / max) * 3)));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-col">
            {week.map((d) => (
              <span key={d.date} className={`heatmap-cell lvl-${level(d.count)}`}
                title={`${d.date}: ${d.count} test${d.count === 1 ? "" : "s"}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => <i key={l} className={`heatmap-cell lvl-${l}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}

export { PALETTE, CLAY, CLAY_DARK, SAGE, GOLD };
