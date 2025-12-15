import { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  badge?: string;
  trendLabel?: string;
  trendPositive?: boolean;
  icon?: ReactNode;
}

export default function AdminStatCard({
  label,
  value,
  helper,
  badge,
  trendLabel,
  trendPositive,
  icon,
}: AdminStatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">{label}</p>
          {badge ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F1F4FF] px-3 py-1 text-[11px] font-semibold text-[#0057FF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF]" />
              {badge}
            </span>
          ) : null}
        </div>
        {icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1F4FF] text-[#0057FF]">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="text-3xl font-semibold leading-tight text-[#1F2226]">{value}</div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[#656F81]">
        {trendLabel ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              trendPositive ? 'bg-green-50 text-[#0F5132]' : 'bg-red-50 text-[#7F1D1D]'
            }`}
          >
            {trendPositive ? '▲' : '▼'} {trendLabel}
          </span>
        ) : null}
        {helper ? <span>{helper}</span> : null}
      </div>
    </div>
  );
}
