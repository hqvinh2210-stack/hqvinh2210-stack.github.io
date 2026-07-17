import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useReducedMotion } from "motion/react";

const gmv = [
  { x: 1, y: 22 },
  { x: 2, y: 28 },
  { x: 3, y: 35 },
  { x: 4, y: 32 },
  { x: 5, y: 48 },
  { x: 6, y: 55 },
  { x: 7, y: 62 },
  { x: 8, y: 70 },
];

const rfm = [
  { name: "Champions", v: 42 },
  { name: "Loyal", v: 68 },
  { name: "At risk", v: 35 },
  { name: "Hibernating", v: 52 },
];

const sla = [
  { name: "On time", v: 93 },
  { name: "Late", v: 7 },
];

export default function ProjectPreview({ type }) {
  const reduce = useReducedMotion();

  if (type === "rfm-bars") {
    return (
      <div className="h-36 w-full rounded-lg bg-gradient-to-br from-navy/5 to-primary/5 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rfm} barCategoryGap={12}>
            <Bar dataKey="v" radius={[6, 6, 0, 0]} isAnimationActive={!reduce}>
              {rfm.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? "#2563EB" : "#06B6D4"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "sla-gauge") {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg bg-gradient-to-br from-navy/5 to-cyan/10 p-4">
        <div className="text-center">
          <div className="font-mono text-4xl font-bold text-primary">93.2%</div>
          <div className="mt-1 text-xs text-muted">On-time delivery</div>
          <div className="mx-auto mt-3 h-2 w-40 overflow-hidden rounded-full bg-line">
            <div className="h-full w-[93%] rounded-full bg-gradient-to-r from-primary to-cyan" />
          </div>
          <div className="mt-2 font-mono text-[10px] text-muted">
            Late residual {sla[1].v}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-36 w-full rounded-lg bg-gradient-to-br from-navy/5 to-primary/5 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={gmv}>
          <defs>
            <linearGradient id="cardFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke="#2563EB"
            strokeWidth={2}
            fill="url(#cardFill)"
            isAnimationActive={!reduce}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
