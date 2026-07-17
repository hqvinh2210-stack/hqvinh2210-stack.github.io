import Reveal from "./Reveal.jsx";
import { experience } from "../data/portfolio.js";

export default function Experience() {
  return (
    <section id="experience" className="bg-white py-20 md:py-28">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">Experience</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Timeline of impact
          </h2>
        </Reveal>

        <div className="relative mt-12 pl-2 md:pl-0">
          <div className="gradient-line absolute bottom-2 left-[11px] top-2 w-[3px] rounded-full md:left-1/2 md:-ml-[1.5px]" />

          <div className="space-y-10">
            {experience.map((item, i) => {
              const left = i % 2 === 0;
              return (
                <Reveal key={item.period} delay={i * 0.05}>
                  <div
                    className={`relative grid gap-4 md:grid-cols-2 ${
                      left ? "" : "md:[&>*:first-child]:order-2"
                    }`}
                  >
                    <div
                      className={`md:px-8 ${
                        left ? "md:text-right" : "md:text-left"
                      }`}
                    >
                      <div className="card p-5 md:p-6">
                        <p className="font-mono text-xs font-semibold text-primary">
                          {item.period}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-navy">
                          {item.role}
                        </h3>
                        <p className="text-sm text-muted">{item.org}</p>
                        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                          {item.points.map((pt) => (
                            <li key={pt} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                              <span className={left ? "md:text-right" : ""}>
                                {pt}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="hidden md:block" />
                    <span className="absolute left-[6px] top-6 z-10 h-4 w-4 rounded-full border-4 border-white bg-primary shadow md:left-1/2 md:-ml-2" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
