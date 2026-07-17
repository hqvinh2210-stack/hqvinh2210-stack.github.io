import { Link } from "react-router-dom";
import Reveal from "./Reveal.jsx";
import ProjectPreview from "./ProjectPreview.jsx";
import { projects } from "../data/portfolio.js";

export default function Projects() {
  return (
    <section id="projects" className="bg-white py-20 md:py-28">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">Featured projects</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Problem → analysis → insight → impact
          </h2>
          <p className="mt-3 max-w-[56ch] text-muted">
            Each card highlights the business question and the numbers that
            changed how stakeholders saw the system.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5">
                <div className="p-4 pb-0">
                  <ProjectPreview type={p.preview} />
                </div>
                <div className="flex flex-1 flex-col p-5 pt-4">
                  <h3 className="text-lg font-semibold text-navy">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    <span className="font-medium text-navy">Problem: </span>
                    {p.problem}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {p.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg border border-line bg-surface px-3 py-2"
                      >
                        <div className="metric-num text-xl font-bold">{m.value}</div>
                        <div className="text-[11px] text-muted">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.stack.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={p.href}
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-2"
                  >
                    Open case study
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
