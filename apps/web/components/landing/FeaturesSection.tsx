import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: "🌡️",
    name: "Hourly Forecasts",
    desc: "Precise hour-by-hour predictions so you're never caught off guard by a sudden shower.",
    bgColor: "var(--accent-light)",
  },
  {
    icon: "💧",
    name: "Rain Alerts",
    desc: "Smart notifications before it rains so your laundry — and your plans — stay dry.",
    bgColor: "var(--success-light)",
  },
  {
    icon: "🌬️",
    name: "Air Quality",
    desc: "Real-time AQI readings for your city, with health recommendations built right in.",
    bgColor: "var(--warning-light)",
  },
  {
    icon: "🗺️",
    name: "Live Radar",
    desc: "Watch rain and storm systems move across the map in real time, beautifully rendered.",
    bgColor: "var(--danger-light)",
  },
];

export default function FeaturesSection() {
  return (
    <section
      className="px-6 py-16 text-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <h2
        className="font-display font-bold text-[var(--text-primary)] mb-2"
        style={{ fontSize: "clamp(24px, 4vw, 34px)" }}
      >
        Weather, the Indian way.
      </h2>
      <p className="text-sm text-[var(--text-muted)] font-light max-w-sm mx-auto mb-10 leading-relaxed">
        Hyperlocal forecasts for every corner of Bharat — from the Himalayas to the coast.
      </p>
{/* 
      <div className="grid gap-4 max-w-3xl mx-auto"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {features.map((f) => (
          <FeatureCard key={f.name} {...f} />
        ))}
      </div> */}
    </section>
  );
}
