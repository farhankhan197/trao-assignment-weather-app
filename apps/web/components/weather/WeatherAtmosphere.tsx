import Snow from './Snow';
import Rain from './Rain';
import Storm from './Storm';
import SunGlow from './SunGlow';

interface WeatherAtmosphereProps {
  condition: string;
  intensity?: 'subtle' | 'dramatic' | 'card';
  className?: string;
}

const weatherStyles: Record<string, (intensity: string) => { bg: string }> = {
  sunny: (i) => ({
    bg:
      i === 'card'
        ? `linear-gradient(135deg, rgba(253,224,71,0.18) 0%, rgba(96,165,250,0.12) 35%, rgba(0,0,0,0.15) 65%)`
        : `linear-gradient(180deg, rgba(253,224,71,${
            i === 'dramatic' ? 0.08 : 0.03
          }) 0%, transparent 60%)`,
  }),
  cloudy: (i) => ({
    bg: `linear-gradient(180deg, rgba(148,163,184,${
      i === 'card' ? 0.1 : i === 'dramatic' ? 0.12 : 0.04
    }) 0%, ${i === 'card' ? 'rgba(0,0,0,0.2)' : 'transparent'} 60%)`,
  }),
  rainy: (i) => ({
    bg: `linear-gradient(180deg, rgba(59,130,246,${
      i === 'card' ? 0.1 : i === 'dramatic' ? 0.08 : 0.03
    }) 0%, ${i === 'card' ? 'rgba(0,0,0,0.2)' : 'transparent'} 60%)`,
  }),
  snowy: (i) => ({
    bg: `linear-gradient(180deg, rgba(186,230,253,${
      i === 'card' ? 0.1 : i === 'dramatic' ? 0.12 : 0.04
    }) 0%, ${i === 'card' ? 'rgba(0,0,0,0.2)' : 'transparent'} 60%)`,
  }),
  stormy: (i) => ({
    bg: `linear-gradient(180deg, rgba(71,85,105,${
      i === 'card' ? 0.12 : i === 'dramatic' ? 0.15 : 0.05
    }) 0%, ${i === 'card' ? 'rgba(0,0,0,0.25)' : 'transparent'} 60%)`,
  }),
};

function CloudShape({
  top,
  size,
  speed,
  delay = '0s',
}: {
  top: string;
  size: number;
  speed: number;
  delay?: string;
}) {
  const w = 60 * size;
  const h = 18 * size;
  return (
    <div
      className="absolute z-0"
      style={{
        top,
        left: '-10%',
        width: w,
        height: h,
        background: 'rgba(255,255,255,0.25)',
        borderRadius: 50,
        animation: `cloudFloatBg ${speed}s linear infinite`,
        animationDelay: delay,
        filter: `blur(${Math.max(1, 3 / size)}px)`,
      }}
      aria-hidden="true"
    />
  );
}

export default function WeatherAtmosphere({
  condition,
  intensity = 'subtle',
  className = '',
}: WeatherAtmosphereProps) {
  const styleFn = weatherStyles[condition] || weatherStyles.cloudy;
  const style = styleFn(intensity);

  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-2xl pointer-events-none ${className}`}
      style={{ background: style.bg }}
    >
      {condition === 'sunny' && intensity !== 'card' && <SunGlow intensity={intensity} />}
      {condition === 'rainy' && (
        <Rain
          count={intensity === 'dramatic' ? 40 : intensity === 'card' ? 24 : 6}
          intensity={intensity}
        />
      )}
      {condition === 'cloudy' && intensity === 'card' ? (
        <>
          <CloudShape top="25%" size={1} speed={50} delay="0s" />
          <CloudShape top="40%" size={0.7} speed={35} delay="-8s" />
          <CloudShape top="55%" size={0.5} speed={25} delay="-16s" />
          <CloudShape top="15%" size={1.3} speed={65} delay="-25s" />
        </>
      ) : condition === 'cloudy' ? (
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
      ) : null}
      {condition === 'snowy' && (
        <Snow
          count={intensity === 'dramatic' ? 30 : intensity === 'card' ? 20 : 8}
          intensity={intensity}
        />
      )}
      {condition === 'stormy' && (
        <>
          <Rain
            count={intensity === 'dramatic' ? 50 : intensity === 'card' ? 30 : 8}
            intensity={intensity}
          />
          <Storm intensity={intensity} />
        </>
      )}
    </div>
  );
}
