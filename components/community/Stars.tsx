'use client';

import { Star } from 'lucide-react';

export function StarsDisplay({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map(step => (
        <Star key={step} width={size} height={size}
          className={step <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#C7CBD3]'} />
      ))}
    </span>
  );
}

export function StarsInput({ value, onChange, disabled }: { value: number | null; onChange: (value: number | null) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Điểm đánh giá địa điểm">
      {[1, 2, 3, 4, 5].map(step => (
        <button key={step} type="button" role="radio" aria-checked={value === step} aria-label={`${step} sao`} disabled={disabled}
          onClick={() => onChange(value === step ? null : step)}
          className="rounded p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40">
          <Star width={24} height={24} className={value !== null && step <= value ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-[#C7CBD3]'} />
        </button>
      ))}
      {value !== null && (
        <button type="button" onClick={() => onChange(null)} disabled={disabled} className="ml-2 text-xs font-medium text-[#656F81] underline">
          Bỏ chấm điểm
        </button>
      )}
    </div>
  );
}
