import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { profile } from "../data/portfolio.js";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#dashboards", label: "Dashboards" },
  { href: "/#experience", label: "Experience" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const home = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between md:h-[68px]">
        <Link to="/" className="flex items-center gap-2 font-semibold text-navy">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">
            V
          </span>
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) =>
            home ? (
              <a
                key={l.href}
                href={l.href.replace("/#", "#")}
                className="text-sm font-medium text-muted transition hover:text-primary"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                to={l.href}
                className="text-sm font-medium text-muted transition hover:text-primary"
              >
                {l.label}
              </Link>
            )
          )}
          <a
            href={home ? "#contact" : "/#contact"}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Hire me
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-navy md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-lg">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-navy"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
