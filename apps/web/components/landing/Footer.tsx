import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] py-5 px-6 text-center">
      <p className="text-xs text-slate-500 font-light tracking-wide mb-2">
        Made with ☁️ in India &nbsp;·&nbsp;{" "}
        <span className="text-[var(--accent)]">Mausam Weather</span>
        &nbsp;·&nbsp; Your sky, always
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-light">
        <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">
          Privacy Policy
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/terms-of-service" className="hover:text-slate-400 transition-colors">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
