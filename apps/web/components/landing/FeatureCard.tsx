interface FeatureCardProps {
  icon: string;
  name: string;
  desc: string;
  bgColor: string;
}

export default function FeatureCard({ icon, name, desc, bgColor }: FeatureCardProps) {
  return (
    <div className="
      bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6
      transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-focus)]
      hover:shadow-md
    ">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mx-auto mb-4"
        style={{ background: bgColor }}
      >
        {icon}
      </div>
      <div className="font-medium text-sm text-[var(--text-primary)] mb-1.5">{name}</div>
      <div className="text-[13px] text-[var(--text-muted)] leading-relaxed font-light">{desc}</div>
    </div>
  );
}
