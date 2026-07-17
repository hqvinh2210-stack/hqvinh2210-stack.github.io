import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { profile } from "../data/portfolio.js";
import HeroViz from "./HeroViz.jsx";

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 20%, rgb(37 99 235 / 0.35), transparent), radial-gradient(ellipse 50% 40% at 10% 80%, rgb(6 182 212 / 0.2), transparent)",
        }}
      />

      <div className="container-page relative grid min-h-[100dvh] items-center gap-10 py-20 md:grid-cols-2 md:gap-12 md:py-24">
        <div>
          <motion.p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-soft"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            Open to analyst roles · {profile.location}
          </motion.p>

          <motion.h1
            className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl lg:text-[3.25rem]"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            {profile.name}
            <span className="mt-2 block text-2xl font-semibold text-cyan-soft md:text-3xl">
              {profile.title}
            </span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-[38ch] text-base leading-relaxed text-white/75 md:text-lg"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            {profile.valueProp}
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <a
              href="#projects"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              View projects
            </a>
            <Link
              to="/case-study/olist-dw"
              className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Read case study
            </Link>
          </motion.div>

          <motion.div
            className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {[
              { k: "96.5K", v: "orders modeled" },
              { k: "R$13.2M", v: "GMV unified" },
              { k: "93%", v: "on-time baseline" },
            ].map((m) => (
              <div key={m.v}>
                <div className="font-mono text-lg font-semibold text-cyan-soft md:text-xl">
                  {m.k}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-white/55">{m.v}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="min-h-[300px] md:min-h-[380px]"
          initial={reduce ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <HeroViz />
        </motion.div>
      </div>
    </section>
  );
}
