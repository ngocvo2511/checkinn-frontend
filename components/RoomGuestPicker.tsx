"use client";

import { useState, useRef, useEffect } from "react";

interface RoomGuestPickerProps {
  onSelectionChange?: (rooms: number, adults: number, children: number) => void;
}

export function RoomGuestPicker({ onSelectionChange }: RoomGuestPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSelectionChange?.(rooms, adults, children);
  }, [rooms, adults, children, onSelectionChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatSelection = () => {
    const roomText = rooms === 1 ? "1 room" : `${rooms} rooms`;
    const adultText = adults === 1 ? "1 adult" : `${adults} adults`;
    const childText = children === 0 ? "0 children" : children === 1 ? "1 child" : `${children} children`;
    return `${roomText}, ${adultText}, ${childText}`;
  };

  const increment = (type: "rooms" | "adults" | "children") => {
    if (type === "rooms" && rooms < 10) setRooms(rooms + 1);
    if (type === "adults" && adults < 20) setAdults(adults + 1);
    if (type === "children" && children < 10) setChildren(children + 1);
  };

  const decrement = (type: "rooms" | "adults" | "children") => {
    if (type === "rooms" && rooms > 1) setRooms(rooms - 1);
    if (type === "adults" && adults > 1) setAdults(adults - 1);
    if (type === "children" && children > 0) setChildren(children - 1);
  };

  return (
    <div className="relative w-full h-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full min-h-[72px] text-left flex items-center gap-5 px-3 py-3 md:px-4 md:py-4 hover:bg-[#F7FAFF] transition pl-12 md:pl-16 lg:pl-20"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 mr-1"
        >
          <path
            d="M10 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM15 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM10 10c-1.66 0-5 0.83-5 2.5V14h10v-1.5C15 10.83 11.66 10 10 10zm5 0c-.29 0-.62.02-.97.05.58.45.97 1.12.97 1.95V14h4v-1.5C19 10.83 15.66 10 15 10z"
            fill="#0057FF"
          />
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-[#2B3037]">Rooms and Guests</span>
          <span className="text-sm text-[#8B94A4]">{formatSelection()}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-[320px] md:w-[380px] rounded-2xl border border-[#E4E6EB] bg-white shadow-2xl">
          <div className="px-6 py-5 space-y-5">
            {/* Rooms */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2B3037]">Rooms</p>
                <p className="text-xs text-[#8B94A4]">Number of rooms</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrement("rooms")}
                  disabled={rooms <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <span className="text-xl font-semibold">−</span>
                </button>
                <span className="w-8 text-center text-base font-semibold text-[#2B3037]">
                  {rooms}
                </span>
                <button
                  onClick={() => increment("rooms")}
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
                <p className="text-sm font-semibold text-[#2B3037]">Adults</p>
                <p className="text-xs text-[#8B94A4]">Ages 18 or above</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrement("adults")}
                  disabled={adults <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <span className="text-xl font-semibold">−</span>
                </button>
                <span className="w-8 text-center text-base font-semibold text-[#2B3037]">
                  {adults}
                </span>
                <button
                  onClick={() => increment("adults")}
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
                <p className="text-sm font-semibold text-[#2B3037]">Children</p>
                <p className="text-xs text-[#8B94A4]">Ages 0-17</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrement("children")}
                  disabled={children <= 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <span className="text-xl font-semibold">−</span>
                </button>
                <span className="w-8 text-center text-base font-semibold text-[#2B3037]">
                  {children}
                </span>
                <button
                  onClick={() => increment("children")}
                  disabled={children >= 10}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E6EB] text-[#0057FF] hover:bg-[#F7FAFF] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <span className="text-xl font-semibold">+</span>
                </button>
              </div>
            </div>

            {/* Done Button */}
            <div className="pt-3 border-t border-[#E4E6EB]">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl bg-[#0057FF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0046CC] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
