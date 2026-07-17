import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { motion, useReducedMotion } from "motion/react";

function buildSeries() {
  const points = [];
  let v = 40;
  for (let i = 0; i < 28; i++) {
    v += Math.sin(i / 2.4) * 8 + (i % 5 === 0 ? 6 : 1.5);
    points.push({ i, v: Math.max(12, Math.round(v)) });
  }
  return points;
}

export default function HeroViz() {
  const data = useMemo(() => buildSeries(), []);
  const reduce = useReducedMotion();

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-[12px] border border-white/10 bg-navy-deep/40">
      {/* Dot network */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }).map((_, idx) => {
          const x = 8 + (idx % 6) * 18;
          const y = 12 + Math.floor(idx / 6) * 28;
          return (
            <g key={idx}>
              <circle cx={`${x}%`} cy={`${y}%`} r="2.2" fill="#06B6D4" />
              {idx % 3 === 0 && (
                <line
                  x1={`${x}%`}
                  y1={`${y}%`}
                  x2={`${x + 14}%`}
                  y2={`${y + 10}%`}
                  stroke="#2563EB"
                  strokeOpacity="0.35"
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 p-4 pt-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#67E8F9"
              strokeWidth={2}
              fill="url(#heroFill)"
              isAnimationActive={!reduce}
              animationDuration={1600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute left-4 top-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan" />
        <span className="font-mono text-[11px] tracking-wide text-white/70">
          LIVE SIGNAL · GMV INDEX
        </span>
      </div>

      {!reduce && (
        <motion.div
          className="pointer-events-none absolute bottom-4 right-4 rounded-lg border border-white/10 bg-navy/70 px-3 py-2 backdrop-blur-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="font-mono text-lg font-semibold text-cyan-soft">+18.4%</div>
          <div className="text-[11px] text-white/60">MoM insight lift</div>
        </motion.div>
      )}

      {/* secondary sparkline */}
      <div className="pointer-events-none absolute bottom-3 left-3 h-12 w-28 opacity-70">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.slice(-12)}>
            <Line
              type="monotone"
              dataKey="v"
              stroke="#2563EB"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={!reduce}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
