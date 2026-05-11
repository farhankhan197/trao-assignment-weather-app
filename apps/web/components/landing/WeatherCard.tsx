interface WeatherCardProps {
  icon: string;
  temp: number;
  city: string;
  desc: string;
  delay?: number;
}

export default function WeatherCard({ icon, temp, city, desc, delay = 0 }: WeatherCardProps) {
  return (
    <div
      className="backdrop-blur-md text-center rounded-lg sm:rounded-xl lg:rounded-2xl px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 min-w-[72px] sm:min-w-[88px] lg:min-w-[110px]
        border border-white/15 bg-white/[0.08]
        transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.14]
        animate-fade-up
      "
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="bg-blue-500/70 rounded-lg p-1.5">
        <div className="text-lg sm:text-xl lg:text-2xl mb-0.5 sm:mb-1">{icon}</div>
        <div className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-white leading-none">
          {temp}°
        </div>
        <div className="text-[9px] sm:text-[10px] lg:text-[11px] text-white/50 mt-0.5 sm:mt-1 tracking-wide">
          {city}
        </div>
        <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-sky-300/75 mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
