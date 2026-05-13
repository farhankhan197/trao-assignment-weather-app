import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white py-16 px-6 text-center">
      {/* Thank You Message — Prominent */}
      <p className="text-base md:text-lg text-[#334155] font-light tracking-wide mb-6">
        thank you to <span className="font-medium text-[#0f172a]">TRAO</span> for your time
      </p>

      {/* Links */}
      <div className="flex items-center justify-center gap-4 text-xs text-[#64748b] font-light flex-wrap mb-4">
        <a
          href="https://github.com/farhankhan197/trao-assignment-weather-app/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#0f172a] transition-colors"
        >
          Read Me
        </a>
        <span className="text-[#cbd5e1]">·</span>
        <Link href="/privacy-policy" className="hover:text-[#0f172a] transition-colors">
          Privacy Policy
        </Link>
        <span className="text-[#cbd5e1]">·</span>
        <Link href="/terms-of-service" className="hover:text-[#0f172a] transition-colors">
          Terms of Service
        </Link>
        <span className="text-[#cbd5e1]">·</span>
        <Link
          href="https://youtu.be/8RchmKMz9eI?si=lkcQZAUOAYwRoXHO"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#0f172a] transition-colors"
        >
          Walkthrough Video
        </Link>
      </div>

      {/* Brand Line */}
      <p className="text-xs text-[#64748b] font-light tracking-wide">
        Made with ☁️ by Farhan Khan &nbsp;·&nbsp;{' '}
      </p>
    </footer>
  );
}
