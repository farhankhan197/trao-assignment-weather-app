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
      className="
        backdrop-blur-md text-center rounded-2xl px-4 py-3 min-w-[110px]
        border border-white/15 bg-white/[0.08]
        transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.14]
        animate-fade-up
      "
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-playfair text-2xl font-bold text-white leading-none">{temp}°</div>
      <div className="text-[11px] text-white/50 mt-1 tracking-wide">{city}</div>
      <div className="text-[10px] text-sky-300/75 mt-0.5">{desc}</div>
    </div>
  );
}
