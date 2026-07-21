import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import Reveal from "./Reveal.jsx";
import { profile, skillGroups, skillLevels, skillRadar } from "../data/portfolio.js";

const LEVEL_STYLE = {
  Daily: "bg-primary/10 text-primary border-primary/20",
  Project: "bg-cyan/10 text-cyan border-cyan/25",
  Learning: "bg-surface-2 text-muted border-line",
};

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

            <div className="mt-6 flex flex-wrap gap-2">
              {Object.values(skillLevels).map((lv) => (
                <span
                  key={lv.label}
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${LEVEL_STYLE[lv.label]}`}
                  title={lv.hint}
                >
                  {lv.label}
                </span>
              ))}
              <span className="self-center text-[11px] text-muted">
                = usage depth, not a self-scored %
              </span>
            </div>

            <ul className="mt-6 space-y-3">
              {skillGroups.map((s) => {
                const body = (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-navy">{s.name}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LEVEL_STYLE[s.level]}`}
                      >
                        {s.level}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {s.evidence}
                    </p>
                  </>
                );

                return (
                  <li key={s.name}>
                    {s.href.startsWith("/#") ? (
                      <a
                        href={s.href.replace("/#", "#")}
                        className="block rounded-xl border border-line bg-white px-4 py-3 transition hover:border-primary/30 hover:shadow-card"
                      >
                        {body}
                      </a>
                    ) : (
                      <Link
                        to={s.href}
                        className="block rounded-xl border border-line bg-white px-4 py-3 transition hover:border-primary/30 hover:shadow-card"
                      >
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="card p-5 md:p-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-navy">Skill usage map</h3>
              <span className="font-mono text-[11px] text-muted">
                Daily · Project · Learning
              </span>
            </div>
            <p className="mb-3 text-xs text-muted">
              Axis shows how often I use each skill in real work, not a 0-100
              proficiency score.
            </p>
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
                    domain={[0, 3]}
                    tickCount={4}
                    tickFormatter={(v) =>
                      v === 3 ? "Daily" : v === 2 ? "Project" : v === 1 ? "Learn" : ""
                    }
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    axisLine={false}
                  />
                  <Radar
                    name="Usage"
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
