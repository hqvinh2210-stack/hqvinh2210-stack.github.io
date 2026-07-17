import { profile } from "../data/portfolio.js";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white py-8">
      <div className="container-page flex flex-col items-start justify-between gap-3 text-sm text-muted sm:flex-row sm:items-center">
        <p>
          © {new Date().getFullYear()} {profile.name} · Data Analyst portfolio
        </p>
        <p className="font-mono text-xs">
          Problem → Analysis → Insight → Impact
        </p>
      </div>
    </footer>
  );
}
