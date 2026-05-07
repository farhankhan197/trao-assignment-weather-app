import Rain from "./Rain";
import WeatherCard from "./WeatherCard";

interface WeatherData {
  icon: string;
  temp: number;
  city: string;
  desc: string;
  delay: number;
}

interface HeroSectionProps {
  weatherData: WeatherData[];
  ctaPrimary: { text: string; href: string };
  ctaSecondary: { text: string; href: string };
}

export default function HeroSection({ weatherData, ctaPrimary, ctaSecondary }: HeroSectionProps) {
  return (
    <section
      className="relative w-full overflow-hidden flex flex-col items-center justify-center"
      style={{
        minHeight: 580,
        background:
          "linear-gradient(180deg, #0a1628 0%, #1a3a5c 35%, #2563eb 65%, #93c5fd 85%, #f8fafc 100%)",
      }}
    >
      {/* Sun */}
      <div
        className="animate-sun-pulse absolute rounded-full"
        style={{
          bottom: "24%",
          right: "14%",
          width: 72,
          height: 72,
          background: "radial-gradient(circle, #fef3c7 30%, #fcd34d 60%, #f59e0b 100%)",
          boxShadow: "0 0 40px 14px rgba(251,191,36,0.5), 0 0 90px 30px rgba(251,191,36,0.2)",
        }}
        aria-hidden="true"
      />

      {/* Clouds */}
      {/* Cloud 1 - large, slow */}
      <div
        className="absolute"
        style={{
          bottom: "36%",
          left: 0,
          animation: "cloudFloat 55s linear infinite",
          animationDelay: "-6s",
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={210} baseH={64} color="rgba(255,255,255,0.88)"
          bumps={[
            { w: 100, h: 90, top: -48, left: 25 },
            { w: 80,  h: 74, top: -38, left: 100 },
            { w: 62,  h: 56, top: -28, left: 150 },
          ]}
        />
      </div>

      {/* Cloud 2 - medium */}
      <div
        className="absolute"
        style={{
          bottom: "44%",
          left: 0,
          animation: "cloudFloat 75s linear infinite",
          animationDelay: "-25s",
          opacity: 0.82,
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={160} baseH={50} color="rgba(255,255,255,0.93)"
          bumps={[
            { w: 76, h: 68, top: -35, left: 16 },
            { w: 60, h: 55, top: -28, left: 75 },
          ]}
        />
      </div>

      {/* Cloud 3 - wispy blue-tinted */}
      <div
        className="absolute"
        style={{
          bottom: "52%",
          left: 0,
          animation: "cloudFloat 90s linear infinite",
          animationDelay: "-40s",
          opacity: 0.6,
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={130} baseH={42} color="rgba(190,215,255,0.65)"
          bumps={[
            { w: 65, h: 56, top: -28, left: 12 },
            { w: 50, h: 44, top: -22, left: 65 },
          ]}
        />
      </div>

      {/* Cloud 4 - tiny */}
      <div
        className="absolute"
        style={{
          bottom: "30%",
          left: 0,
          animation: "cloudFloat 48s linear infinite",
          animationDelay: "-5s",
          opacity: 0.75,
        }}
        aria-hidden="true"
      >
        <CloudShape
          baseW={120} baseH={38} color="rgba(255,255,255,0.7)"
          bumps={[
            { w: 58, h: 52, top: -26, left: 14 },
            { w: 46, h: 40, top: -20, left: 62 },
          ]}
        />
      </div>

      {/* Rain */}
      <Rain />

      {/* Hero text */}
      <div
        className="relative z-10 text-center px-5 mb-3 animate-fade-up"
        style={{ animationDelay: "100ms", animationFillMode: "both" }}
      >
        <p className="font-display text-sky-300/85 text-sm mb-1.5">
          मौसम
        </p>
        <h1 className="font-display font-black text-white leading-none tracking-tight"
          style={{ fontSize: "clamp(44px, 8vw, 72px)", textShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
        >
          Mausam
        </h1>
        <p className="text-white/55 font-light tracking-wide mt-2.5 text-sm leading-relaxed">
          Beautiful weather, beautifully told.<br />
          Know your sky before you step outside.
        </p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <a href={ctaPrimary.href} className="
            px-7 py-2.5 rounded-full text-white text-[13px] font-medium tracking-wide
            border border-white/45 bg-white/[0.13] backdrop-blur-md
            transition-all duration-300 hover:bg-white/[0.22] hover:-translate-y-0.5
          ">
            {ctaPrimary.text}
          </a>
          <a href={ctaSecondary.href} className="
            px-7 py-2.5 rounded-full text-white/65 text-[13px] tracking-wide
            border border-white/18
            transition-all duration-300 hover:border-white/45 hover:text-white hover:-translate-y-0.5
          ">
            {ctaSecondary.text}
          </a>
        </div>
      </div>

      {/* Weather mini-cards */}
      <div className="relative z-10 flex gap-2.5 flex-wrap justify-center px-4 mt-6">
        {weatherData.map((w) => (
          <WeatherCard key={w.city} {...w} />
        ))}
      </div>

      {/* Bottom wave */}
      <svg
        className="absolute bottom-0 left-0 w-full z-[5]"
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
          fill="#f8fafc"
        />
      </svg>
    </section>
  );
}

/* Inline cloud shape helper */
function CloudShape({
  baseW, baseH, color,
  bumps,
}: {
  baseW: number;
  baseH: number;
  color: string;
  bumps: { w: number; h: number; top: number; left: number }[];
}) {
  return (
    <div className="relative" style={{ width: baseW, height: baseH, background: color, borderRadius: 50 }}>
      {bumps.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{ width: b.w, height: b.h, top: b.top, left: b.left, background: color }}
        />
      ))}
    </div>
  );
}
