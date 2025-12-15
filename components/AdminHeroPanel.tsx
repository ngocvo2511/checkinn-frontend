interface AdminHeroPanelProps {
  title?: string;
  subtitle?: string;
}

export default function AdminHeroPanel({
  title = 'Sign in to the control room',
  subtitle = 'Manage listings, bookings, payouts, and support tools in one place. Built for operational speed with Tripto\'s design language.',
}: AdminHeroPanelProps) {
  const features = [
    {
      title: 'Role based access',
      description: 'Separate permissions for managers, finance, and support so every change is auditable.',
    },
    {
      title: 'Real-time activity feed',
      description: 'Track check-ins, escalations, and payments without leaving the dashboard.',
    },
    {
      title: 'Secure by default',
      description: 'Enforced 2FA and device-aware sessions for safer admin actions.',
    },
  ];

  const badges = ['24/7 monitoring', 'SOC2 inspired controls', 'Encrypted sessions'];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] p-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
        <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
        CheckInn admin
      </div>

      <div className="mt-5 flex flex-col gap-3 max-w-xl">
        <h1 className="text-[28px] font-semibold leading-[34px]">{title}</h1>
        <p className="text-sm text-white/80">{subtitle}</p>
      </div>

      <div className="mt-8 grid gap-3">
        {features.map((feature) => (
          <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-white/80">
        {badges.map((badge) => (
          <Badge key={badge} label={badge} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-14 bottom-[-140px] h-[320px] w-[320px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-16 top-[-120px] h-[220px] w-[220px] rounded-full bg-[#99BDFF]/30 blur-3xl" />
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-[#FFCC00]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.66667 11.3334L3.33334 8.00008L4.27334 7.06008L6.66667 9.44675L11.7267 4.38675L12.6667 5.33341L6.66667 11.3334Z" fill="white" />
        </svg>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/80">{description}</p>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
      <span>{label}</span>
    </div>
  );
}
