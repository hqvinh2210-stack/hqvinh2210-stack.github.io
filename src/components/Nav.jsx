import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { profile } from "../data/portfolio.js";
import { supportedLanguages, useLanguage } from "../contexts/LanguageContext.jsx";

const links = [
  { href: "/#about", key: "nav.about" },
  { href: "/#projects", key: "nav.projects" },
  { href: "/#dashboards", key: "nav.dashboards" },
  { href: "/#experience", key: "nav.experience" },
  { href: "/#contact", key: "nav.contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const home = location.pathname === "/";
  const { language, setLanguage, t } = useLanguage();

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
                {t(l.key)}
              </a>
            ) : (
              <Link
                key={l.href}
                to={l.href}
                className="text-sm font-medium text-muted transition hover:text-primary"
              >
                {t(l.key)}
              </Link>
            )
          )}
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-2 py-1">
            {supportedLanguages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  language === item.code
                    ? "bg-primary text-white"
                    : "text-muted hover:text-primary"
                }`}
                aria-label={`Switch to ${item.code === "en" ? "English" : "Tiếng Việt"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <a
            href={home ? "#contact" : "/#contact"}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("nav.hire")}
          </a>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center rounded-full border border-line bg-surface px-1.5 py-1">
            {supportedLanguages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  language === item.code ? "bg-primary text-white" : "text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-navy"
            aria-label={t("nav.menuLabel")}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-lg">{open ? "×" : "☰"}</span>
          </button>
        </div>
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
                {t(l.key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
