import { useState } from "react";
import Reveal from "./Reveal.jsx";
import { profile } from "../data/portfolio.js";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name");
    const email = fd.get("email");
    const message = fd.get("message");
    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} <${email}>`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section id="contact" className="bg-surface py-20 md:py-28">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="section-kicker">Contact</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy md:text-4xl">
              Let&apos;s talk about your next data question
            </h2>
            <p className="mt-3 max-w-[48ch] text-muted">
              Open to full-time analyst roles and analytics projects. Share the
              problem space — I will come back with a measurement plan.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-primary/30 hover:text-primary"
              >
                GitHub
              </a>
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-primary/30 hover:text-primary"
              >
                LinkedIn
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                {profile.email}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <form onSubmit={onSubmit} className="card space-y-4 p-6 md:p-7">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-navy">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-primary/30 transition focus:ring-2"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-primary/30 transition focus:ring-2"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  className="w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none ring-primary/30 transition focus:ring-2"
                  placeholder="What decision are you trying to improve with data?"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary active:scale-[0.99]"
              >
                Send message
              </button>
              {sent && (
                <p className="text-center text-sm text-primary">
                  Opening your email client…
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
