'use client';

import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { searchPlaces } from '@/lib/api/place-catalog';
import type { PlaceSummary } from '@/types/place';

export interface PickedPlace {
  id: string;
  name: string;
  provinceName?: string | null;
}

interface PlacePickerProps {
  value: PickedPlace | null;
  onChange: (place: PickedPlace | null) => void;
  disabled?: boolean;
}

export default function PlacePicker({ value, onChange, disabled }: PlacePickerProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');

  useEffect(() => {
    const term = keyword.trim();
    if (term.length < 2) return;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const page = await searchPlaces(term, { limit: 8 });
        if (current) {
          setResults(page.items);
          setState('done');
        }
      } catch {
        if (current) {
          setResults([]);
          setState('error');
        }
      }
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  const searching = keyword.trim().length >= 2;
  const shownResults = searching ? results : [];
  const shownState = searching ? state : 'idle';

  function changeKeyword(next: string) {
    setKeyword(next);
    if (next.trim().length >= 2) setState('loading');
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#0057FF] bg-[#E8EFFC] px-3 py-2">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-[#0B2E68]">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{value.name}{value.provinceName ? ` · ${value.provinceName}` : ''}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label="Bỏ chọn địa điểm" className="rounded p-1 text-[#0B2E68] hover:bg-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="place-keyword" className="sr-only">Tìm địa điểm</label>
      <input id="place-keyword" type="search" value={keyword} onChange={event => changeKeyword(event.target.value)} disabled={disabled}
        maxLength={100} placeholder="Tìm địa điểm, ví dụ: Cầu Rồng" autoComplete="off"
        className="w-full rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm outline-none focus:border-[#0057FF]" />
      {shownState === 'loading' && <p className="mt-2 text-xs text-[#656F81]" aria-busy="true">Đang tìm…</p>}
      {shownState === 'error' && <p className="mt-2 text-xs text-red-600" role="alert">Không tìm được địa điểm lúc này. Bạn vẫn có thể đăng bài không gắn địa điểm.</p>}
      {shownState === 'done' && shownResults.length === 0 && <p className="mt-2 text-xs text-[#656F81]">Không có địa điểm phù hợp.</p>}
      {shownResults.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#DDDFE3] bg-white" role="listbox" aria-label="Kết quả địa điểm">
          {shownResults.map(place => (
            <li key={place.id} role="option" aria-selected={false}>
              <button type="button" className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-[#F1F2F3]"
                onClick={() => { onChange({ id: place.id, name: place.name, provinceName: place.provinceName }); setKeyword(''); }}>
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#656F81]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[#1F2226]">{place.name}</span>
                  <span className="block truncate text-xs text-[#656F81]">{[place.address, place.provinceName].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
