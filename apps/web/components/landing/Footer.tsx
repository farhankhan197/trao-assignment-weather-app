import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-primary)] py-16 px-6 text-center">
      <p className="text-xs text-[var(--text-muted)] font-light tracking-wide mb-2">
        Made with ☁️ in India &nbsp;·&nbsp;{" "}
        <span className="text-[var(--accent)]">Mausam Weather</span>
        &nbsp;·&nbsp; Your sky, always
      </p>
      <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-muted)] font-light">
        <Link href="/privacy-policy" className="hover:text-[var(--text-primary)] transition-colors">
          Privacy Policy
        </Link>
        <span className="text-[var(--border)]">·</span>
        <Link href="/terms-of-service" className="hover:text-[var(--text-primary)] transition-colors">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
