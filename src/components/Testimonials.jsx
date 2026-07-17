import Reveal from "./Reveal.jsx";
import { testimonials } from "../data/portfolio.js";

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-navy py-20 text-white md:py-24">
      <div className="container-page">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-soft">
            Endorsements
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            How collaborators describe the work
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.06}>
              <blockquote className="h-full rounded-[12px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-base leading-relaxed text-white/85">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-5 border-t border-white/10 pt-4">
                  <div className="font-semibold text-cyan-soft">{t.name}</div>
                  <div className="text-sm text-white/55">{t.role}</div>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
