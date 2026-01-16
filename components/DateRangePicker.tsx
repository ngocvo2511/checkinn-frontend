"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
  onDatesChange?: (startDate: Date | null, endDate: Date | null) => void;
  checkInLabel?: string;
  checkOutLabel?: string;
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
}

export function DateRangePicker({
  onDatesChange,
  checkInLabel = "Check In",
  checkOutLabel = "Check Out",
  initialCheckIn = null,
  initialCheckOut = null,
}: DateRangePickerProps) {
  const [checkInDate, setCheckInDate] = useState<Date | null>(initialCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(initialCheckOut);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const checkInRef = useRef<HTMLDivElement>(null);
  const checkOutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onDatesChange?.(checkInDate, checkOutDate);
  }, [checkInDate, checkOutDate, onDatesChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        checkInRef.current &&
        !checkInRef.current.contains(event.target as Node)
      ) {
        setShowCheckInPicker(false);
      }
      if (
        checkOutRef.current &&
        !checkOutRef.current.contains(event.target as Node)
      ) {
        setShowCheckOutPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return "Chọn ngày";
    return date.toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex gap-0 md:gap-0 h-full">
      {/* Check In */}
      <div
        ref={checkInRef}
        className="relative flex min-h-[72px] min-w-[180px] flex-1 items-center gap-3 px-3 py-3 md:px-5 md:py-4 border-r md:border-r md:border-[#E4E6EB] group cursor-pointer hover:bg-[#F7FAFF] transition-colors"
        onClick={() => {
          setShowCheckInPicker(!showCheckInPicker);
          setShowCheckOutPicker(false);
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 text-[#0057FF] group-hover:scale-110 transition-transform"
        >
          <path
            d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V10h14v8zm0-10H5V6h14v2z"
            fill="currentColor"
          />
        </svg>

        <div className="flex flex-1 flex-col leading-tight space-y-1">
          <span className="text-sm font-semibold tracking-wide text-[#8B94A4]">
            {checkInLabel}
          </span>
          <span className="text-base font-medium text-[#2B3037] group-hover:text-[#0057FF] transition-colors">{formatDate(checkInDate)}</span>
        </div>

        {showCheckInPicker && (
          <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-[#E4E6EB] bg-white shadow-lg">
            <DatePicker
              selected={checkInDate}
              onChange={(date) => {
                setCheckInDate(date);
                setShowCheckInPicker(false);
                if (
                  date &&
                  checkOutDate &&
                  date.getTime() >= checkOutDate.getTime()
                ) {
                  setCheckOutDate(null);
                }
              }}
              minDate={new Date()}
              inline
              className="react-datepicker-custom"
            />
          </div>
        )}
      </div>

      {/* Check Out */}
      <div
        ref={checkOutRef}
        className="relative flex min-h-[72px] min-w-[180px] flex-1 items-center gap-3 px-3 py-3 md:px-5 md:py-4 md:border-r md:border-r-[#E4E6EB] group cursor-pointer hover:bg-[#F7FAFF] transition-colors"
        onClick={() => {
          setShowCheckOutPicker(!showCheckOutPicker);
          setShowCheckInPicker(false);
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 text-[#0057FF] group-hover:scale-110 transition-transform"
        >
          <path
            d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V10h14v8zm0-10H5V6h14v2z"
            fill="currentColor"
          />
        </svg>

        <div className="flex flex-1 flex-col leading-tight space-y-1">
          <span className="text-sm font-semibold tracking-wide text-[#8B94A4]">
            {checkOutLabel}
          </span>
          <span className="text-base font-medium text-[#2B3037] group-hover:text-[#0057FF] transition-colors">
            {formatDate(checkOutDate)}
          </span>
        </div>

        {showCheckOutPicker && checkInDate && (
          <div className="absolute top-full left-0 z-50 mt-2 rounded-lg border border-[#E4E6EB] bg-white shadow-lg">
            <DatePicker
              selected={checkOutDate}
              onChange={(date) => {
                setCheckOutDate(date);
                setShowCheckOutPicker(false);
              }}
              minDate={
                checkInDate
                  ? new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)
                  : new Date()
              }
              inline
              className="react-datepicker-custom"
            />
          </div>
        )}
      </div>
    </div>
  );
}
