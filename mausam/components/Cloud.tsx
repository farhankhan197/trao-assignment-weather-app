interface CloudProps {
  style?: React.CSSProperties;
  className?: string;
  variant?: "large" | "medium" | "small" | "tiny";
  opacity?: number;
}

export default function Cloud({ style, className = "", variant = "medium", opacity = 1 }: CloudProps) {
  const configs = {
    large: {
      base: "w-52 h-16",
      baseColor: `rgba(255,255,255,${0.88 * opacity})`,
      bumps: [
        { w: 100, h: 90, top: -48, left: 25 },
        { w: 80,  h: 74, top: -38, left: 100 },
        { w: 62,  h: 56, top: -28, left: 152 },
      ],
    },
    medium: {
      base: "w-40 h-12",
      baseColor: `rgba(255,255,255,${0.93 * opacity})`,
      bumps: [
        { w: 76, h: 68, top: -35, left: 16 },
        { w: 60, h: 55, top: -28, left: 75 },
      ],
    },
    small: {
      base: "w-32 h-10",
      baseColor: `rgba(190,215,255,${0.65 * opacity})`,
      bumps: [
        { w: 65, h: 56, top: -28, left: 12 },
        { w: 50, h: 44, top: -22, left: 65 },
      ],
    },
    tiny: {
      base: "w-28 h-9",
      baseColor: `rgba(255,255,255,${0.7 * opacity})`,
      bumps: [
        { w: 58, h: 52, top: -26, left: 14 },
        { w: 46, h: 40, top: -20, left: 62 },
      ],
    },
  };

  const cfg = configs[variant];

  return (
    <div className={`absolute ${className}`} style={style} aria-hidden="true">
      <div
        className="relative rounded-[50px]"
        style={{ background: cfg.baseColor }}
      >
        <div className={cfg.base} />
        {cfg.bumps.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.w,
              height: b.h,
              top: b.top,
              left: b.left,
              background: cfg.baseColor,
            }}
          />
        ))}
      </div>
    </div>
  );
}
