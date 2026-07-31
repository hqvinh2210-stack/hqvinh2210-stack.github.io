import { useLanguage } from "../contexts/LanguageContext.jsx";
import { profile } from "../data/portfolio.js";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-line bg-white py-8">
      <div className="container-page flex flex-col items-start justify-between gap-3 text-sm text-muted sm:flex-row sm:items-center">
        <p>
          © {new Date().getFullYear()} {profile.name} · {t("profile.title")} portfolio
        </p>
        <p className="font-mono text-xs">
          {t("footer.line")}
        </p>
      </div>
    </footer>
  );
}
