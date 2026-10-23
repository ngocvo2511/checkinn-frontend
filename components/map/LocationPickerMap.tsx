'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { LocationPickerProps } from './LocationPickerInner';

export type { LocationPickerProps };

const LocationPickerMap = dynamic<LocationPickerProps>(
  () => import('./LocationPickerInner'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] rounded-xl border border-[#E8E9F1] bg-[#F7F8FA] flex flex-col items-center justify-center text-gray-400 gap-2">
        <svg
          className="animate-spin h-6 w-6 text-[#0057FF]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span className="text-sm font-medium">Đang tải bản đồ...</span>
      </div>
    ),
  }
);

export default LocationPickerMap;
