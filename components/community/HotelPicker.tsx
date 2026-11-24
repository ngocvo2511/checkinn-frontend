'use client';

import { useEffect, useState } from 'react';
import { BedDouble, X } from 'lucide-react';
import hotelApi, { type Hotel } from '@/lib/api/hotels';

export interface PickedHotel {
  id: string;
  name: string;
  cityName?: string | null;
}

interface HotelPickerProps {
  value: PickedHotel | null;
  onChange: (hotel: PickedHotel | null) => void;
  disabled?: boolean;
}

export default function HotelPicker({ value, onChange, disabled }: HotelPickerProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Hotel[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');

  useEffect(() => {
    const term = keyword.trim();
    if (term.length < 2) return;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const hotels = await hotelApi.searchHotelsByName(term);
        if (current) {
          setResults(hotels.slice(0, 8));
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
          <BedDouble className="h-4 w-4 shrink-0" />
          <span className="truncate">{value.name}{value.cityName ? ` · ${value.cityName}` : ''}</span>
        </span>
        <button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label="Bỏ chọn khách sạn" className="rounded p-1 text-[#0B2E68] hover:bg-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="hotel-keyword" className="sr-only">Tìm khách sạn</label>
      <input id="hotel-keyword" type="search" value={keyword} onChange={event => changeKeyword(event.target.value)} disabled={disabled}
        maxLength={100} placeholder="Tìm khách sạn theo tên" autoComplete="off"
        className="w-full rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm outline-none focus:border-[#0057FF]" />
      {shownState === 'loading' && <p className="mt-2 text-xs text-[#656F81]" aria-busy="true">Đang tìm…</p>}
      {shownState === 'error' && <p className="mt-2 text-xs text-red-600" role="alert">Không tìm được khách sạn lúc này. Bạn vẫn có thể đăng bài không gắn khách sạn.</p>}
      {shownState === 'done' && shownResults.length === 0 && <p className="mt-2 text-xs text-[#656F81]">Không có khách sạn phù hợp.</p>}
      {shownResults.length > 0 && (
        <ul className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#DDDFE3] bg-white" role="listbox" aria-label="Kết quả khách sạn">
          {shownResults.map(hotel => (
            <li key={hotel.id} role="option" aria-selected={false}>
              <button type="button" className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-[#F1F2F3]"
                onClick={() => { onChange({ id: hotel.id, name: hotel.name, cityName: hotel.city?.name ?? null }); setKeyword(''); }}>
                <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-[#656F81]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[#1F2226]">{hotel.name}</span>
                  {hotel.city?.name && <span className="block truncate text-xs text-[#656F81]">{hotel.city.name}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
