'use client';

import React, { useState, useEffect } from 'react';

interface HotelGuestPickerProps {
  initialAdults?: number;
  initialChildren?: number;
  initialRooms?: number;
  onSelectionChange: (rooms: number, adults: number, children: number) => void;
  onClose?: () => void;
}

export function HotelGuestPicker({
  initialAdults = 1,
  initialChildren = 0,
  initialRooms = 1,
  onSelectionChange,
  onClose,
}: HotelGuestPickerProps) {
  const [adults, setAdults] = React.useState(initialAdults);
  const [children, setChildren] = React.useState(initialChildren);
  const [rooms, setRooms] = React.useState(initialRooms);

  useEffect(() => {
    onSelectionChange(rooms, adults, children);
  }, [rooms, adults, children, onSelectionChange]);

  const handleAdultsChange = (value: number) => {
    const newAdults = Math.max(1, Math.min(30, value));
    setAdults(newAdults);
  };

  const handleChildrenChange = (value: number) => {
    const newChildren = Math.max(0, Math.min(30, value));
    setChildren(newChildren);
  };

  const handleRoomsChange = (value: number) => {
    const newRooms = Math.max(1, Math.min(30, value));
    setRooms(newRooms);
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="w-full min-w-[380px]">
      <div className="px-6 py-5 space-y-5">
        {/* Rooms */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2B3037]">Phòng</p>
          <p className="text-xs text-[#8B94A4]">Số lượng phòng</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRoomsChange(rooms - 1)}
            disabled={rooms <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <span className="text-xl font-semibold">−</span>
          </button>
          <span className="w-8 text-center text-base font-semibold text-[#2B3037]">
            {rooms}
          </span>
          <button
            onClick={() => handleRoomsChange(rooms + 1)}
            disabled={rooms >= 10}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <span className="text-xl font-semibold">+</span>
          </button>
        </div>
      </div>

      {/* Adults */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2B3037]">Người lớn</p>
          <p className="text-xs text-[#8B94A4]">Từ 18 tuổi trở lên</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleAdultsChange(adults - 1)}
            disabled={adults <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <span className="text-xl font-semibold">−</span>
          </button>
          <span className="w-8 text-center text-base font-semibold text-[#2B3037]">
            {adults}
          </span>
          <button
            onClick={() => handleAdultsChange(adults + 1)}
            disabled={adults >= 20}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <span className="text-xl font-semibold">+</span>
          </button>
        </div>
      </div>

      {/* Children */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2B3037]">Trẻ em</p>
          <p className="text-xs text-[#8B94A4]">Từ 0-17 tuổi</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleChildrenChange(children - 1)}
            disabled={children <= 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <span className="text-xl font-semibold">−</span>
          </button>
          <span className="w-8 text-center text-base font-semibold text-[#2B3037]">
            {children}
          </span>
          <button
            onClick={() => handleChildrenChange(children + 1)}
            disabled={children >= 10}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <span className="text-xl font-semibold">+</span>
          </button>
        </div>
      </div>
      </div>

      {/* Done Button */}
      <div className="border-t border-[#E4E6EB] px-6 py-4">
        <button
          onClick={handleClose}
          className="w-full rounded-xl bg-[#0057FF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0046CC] transition"
        >
          Xong
        </button>
      </div>
    </div>
  );
}
