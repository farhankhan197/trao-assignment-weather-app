interface SunGlowProps {
  intensity?: 'subtle' | 'dramatic';
}

export default function SunGlow({ intensity = 'subtle' }: SunGlowProps) {
  return (
    <div
      className="absolute pointer-events-none z-0"
      style={{
        top: intensity === 'dramatic' ? '-10%' : '5%',
        right: intensity === 'dramatic' ? '5%' : '10%',
        width: intensity === 'dramatic' ? 120 : 40,
        height: intensity === 'dramatic' ? 120 : 40,
        background: intensity === 'dramatic'
          ? 'radial-gradient(circle, rgba(253,224,71,0.4) 0%, rgba(251,191,36,0.15) 40%, transparent 70%)'
          : 'radial-gradient(circle, rgba(253,224,71,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: intensity === 'dramatic' ? 'blur(20px)' : 'blur(0px)',
      }}
      aria-hidden="true"
    />
  );
}
