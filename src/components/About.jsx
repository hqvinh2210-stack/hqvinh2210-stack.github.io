import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useReducedMotion } from "motion/react";
import Reveal from "./Reveal.jsx";
import { profile, skills, skillRadar } from "../data/portfolio.js";

export default function About() {
  const reduce = useReducedMotion();

  return (
    <section id="about" className="bg-surface py-20 md:py-28">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">About</p>
          <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Analytical by default. Story-driven by design.
          </h2>
        </Reveal>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal delay={0.05}>
            <p className="max-w-[58ch] text-base leading-relaxed text-muted md:text-lg">
              {profile.bio}
            </p>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-muted">
              Every engagement follows the same arc:{" "}
              <span className="font-semibold text-navy">problem</span> →{" "}
              <span className="font-semibold text-navy">analysis</span> →{" "}
              <span className="font-semibold text-navy">insight</span> →{" "}
              <span className="font-semibold text-navy">impact</span>. Charts are
              the evidence, not the goal.
            </p>

            <div className="mt-8 space-y-4">
              {skills.map((s) => (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-navy">{s.name}</span>
                    <span className="font-mono text-primary">{s.level}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-700"
                      style={{ width: `${s.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="card p-5 md:p-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">Skill radar</h3>
              <span className="font-mono text-[11px] text-muted">0–100</span>
            </div>
            <div className="h-[300px] w-full md:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillRadar} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: "#0A1F44", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke="#2563EB"
                    fill="#06B6D4"
                    fillOpacity={0.28}
                    isAnimationActive={!reduce}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
