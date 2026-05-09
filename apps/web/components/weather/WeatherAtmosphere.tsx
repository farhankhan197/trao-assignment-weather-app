import Snow from './Snow';
import Rain from './Rain';
import Storm from './Storm';
import SunGlow from './SunGlow';

interface WeatherAtmosphereProps {
  condition: string;
  intensity?: 'subtle' | 'dramatic';
  className?: string;
}

const weatherStyles: Record<string, (intensity: string) => { bg: string }> = {
  sunny: (i) => ({
    bg: `linear-gradient(180deg, rgba(253,224,71,${i === 'dramatic' ? 0.08 : 0.03}) 0%, transparent 60%)`,
  }),
  cloudy: (i) => ({
    bg: `linear-gradient(180deg, rgba(148,163,184,${i === 'dramatic' ? 0.12 : 0.04}) 0%, transparent 60%)`,
  }),
  rainy: (i) => ({
    bg: `linear-gradient(180deg, rgba(59,130,246,${i === 'dramatic' ? 0.08 : 0.03}) 0%, transparent 60%)`,
  }),
  snowy: (i) => ({
    bg: `linear-gradient(180deg, rgba(186,230,253,${i === 'dramatic' ? 0.12 : 0.04}) 0%, transparent 60%)`,
  }),
  stormy: (i) => ({
    bg: `linear-gradient(180deg, rgba(71,85,105,${i === 'dramatic' ? 0.15 : 0.05}) 0%, transparent 60%)`,
  }),
};

export default function WeatherAtmosphere({
  condition,
  intensity = 'subtle',
  className = '',
}: WeatherAtmosphereProps) {
  const styleFn = weatherStyles[condition] || weatherStyles.cloudy;
  const style = styleFn(intensity);

  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-2xl ${className}`}
      style={{ background: style.bg }}
    >
      {condition === 'sunny' && <SunGlow intensity={intensity} />}
      {condition === 'rainy' && (
        <Rain count={intensity === 'dramatic' ? 40 : 6} intensity={intensity} />
      )}
      {condition === 'cloudy' && (
        <div
          className="absolute w-20 h-6 opacity-20 z-0"
          style={{
            top: '10%',
            left: '-10%',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 50,
            animation: 'cloudFloat 60s linear infinite',
          }}
          aria-hidden="true"
        />
      )}
      {condition === 'snowy' && (
        <Snow count={intensity === 'dramatic' ? 30 : 8} intensity={intensity} />
      )}
      {condition === 'stormy' && (
        <>
          <Rain count={intensity === 'dramatic' ? 50 : 8} intensity={intensity} />
          <Storm intensity={intensity} />
        </>
      )}
    </div>
  );
}
