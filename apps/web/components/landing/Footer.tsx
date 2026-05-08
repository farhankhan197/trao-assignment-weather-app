import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--bg-primary)] py-16 px-6 text-center">
      {/* Thank You Message — Prominent */}
      <p className="text-base md:text-lg text-[var(--text-secondary)] font-light tracking-wide mb-6">
        A huge thank you to <span className="font-medium text-[var(--text-primary)]">TRAO</span> for their time
      </p>

      {/* Links */}
      <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-muted)] font-light flex-wrap mb-4">
        <a href="https://github.com/farhankhan197/trao-assignment-weather-app/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
          Read Me
        </a>
        <span className="text-[var(--border)]">·</span>
        <Link href="/privacy-policy" className="hover:text-[var(--text-primary)] transition-colors">
          Privacy Policy
        </Link>
        <span className="text-[var(--border)]">·</span>
        <Link href="/terms-of-service" className="hover:text-[var(--text-primary)] transition-colors">
          Terms of Service
        </Link>
        <span className="text-[var(--border)]">·</span>
        <Link href="https://www.youtube.com/watch?v=placeholder" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-primary)] transition-colors">
          YouTube
        </Link>
      </div>

      {/* Brand Line */}
      <p className="text-xs text-[var(--text-muted)] font-light tracking-wide">
        Made with ☁️ in India &nbsp;·&nbsp;{" "}
        <span className="text-[var(--accent)]">Mausam Weather</span>
        &nbsp;·&nbsp; Your sky, always
      </p>
    </footer>
  );
}
