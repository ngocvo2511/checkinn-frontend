'use client';

import { useState, useRef, useEffect } from 'react';
import { HotelLocationPicker } from './HotelLocationPicker';
import { HotelGuestPicker } from './HotelGuestPicker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { City } from '@/lib/api/cities';

// Custom styles for horizontal date picker
const datePickerStyles = `
  .hotel-date-picker .react-datepicker {
    display: flex;
    gap: 24px;
  }
  .hotel-date-picker .react-datepicker__month-container {
    display: inline-block;
    width: auto;
  }
  
  /* White background for header */
  .hotel-date-picker .react-datepicker__header {
    background-color: white !important;
    border-bottom: none !important;
    padding-bottom: 0 !important;
  }
  
  .hotel-date-picker .react-datepicker__current-month {
    color: #0F172A !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    margin-bottom: 0 !important;
  }
  
  .hotel-date-picker .react-datepicker__week {
    display: flex !important;
    gap: 0 !important;
  }
  
  /* Day names header alignment */
  .hotel-date-picker .react-datepicker__day-names {
    display: flex !important;
    gap: 0 !important;
    background-color: white !important;
    border-bottom: 2px solid #E4E6EB !important;
    margin-bottom: 0 !important;
    margin-top: -8px !important;
    padding-bottom: 0px !important;
      
  }
  
  .hotel-date-picker .react-datepicker__day-name {
    margin: 0 !important;
    width: 48px !important;
    height: 48px !important;
    line-height: 48px !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    font-size: 14px !important;
    color: #64748B !important;
  }
  
  /* Remove all spacing between days */
  .hotel-date-picker .react-datepicker__day {
    margin: 0 !important;
    width: 48px !important;
    height: 48px !important;
    line-height: 48px !important;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    position: relative;
    border: none !important;
    font-size: 15px !important;
  }
  
  /* In-range dates */
  .hotel-date-picker .react-datepicker__day--in-range {
    background-color: #0057FF !important;
    color: white !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }
  
  /* Range start */
  .hotel-date-picker .react-datepicker__day--range-start {
    background-color: #0057FF !important;
    color: white !important;
    border-radius: 50% 0 0 50% !important;
    margin: 0 !important;
  }
  
  /* Range end */
  .hotel-date-picker .react-datepicker__day--range-end {
    background-color: #0057FF !important;
    color: white !important;
    border-radius: 0 50% 50% 0 !important;
    margin: 0 !important;
  }
  
  /* If same day (start and end) */
  .hotel-date-picker .react-datepicker__day--range-start.react-datepicker__day--range-end {
    border-radius: 50% !important;
  }
`;

interface HotelSearchBarProps {
  initialHotelName?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: string;
  initialChildren?: string;
  initialRooms?: string;
  onSearch?: (data: {
    hotelName: string;
    checkIn: Date | null;
    checkOut: Date | null;
    adults: number;
    children: number;
    rooms: number;
  }) => void;
}

export function HotelSearchBar({
  initialHotelName,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  initialRooms,
  onSearch,
}: HotelSearchBarProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date | null>(
    initialCheckIn ? new Date(initialCheckIn) : null
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(
    initialCheckOut ? new Date(initialCheckOut) : null
  );
  const [adults, setAdults] = useState(parseInt(initialAdults || '1'));
  const [children, setChildren] = useState(parseInt(initialChildren || '0'));
  const [rooms, setRooms] = useState(parseInt(initialRooms || '1'));

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [datePickerClick, setDatePickerClick] = useState<'first' | 'second'>(
    checkInDate && checkOutDate ? 'first' : 'first'
  );

  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationPicker(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) {
        setShowGuestPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (checkIn: Date | null, checkOut: Date | null) => {
    if (!checkIn || !checkOut) return 'Chọn ngày';
    
    const formatDate = (date: Date) => {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      return `${day} thg ${month}`;
    };

    const daysDiff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const nightsText = daysDiff === 1 ? '1 đêm' : `${daysDiff} đêm`;

    return `${formatDate(checkIn)} - ${formatDate(checkOut)}, ${nightsText}`;
  };

  const formatGuestDisplay = () => {
    const adultText = adults === 1 ? '1 người lớn' : `${adults} người lớn`;
    const childText = children === 0 ? '' : children === 1 ? ', 1 Trẻ em' : `, ${children} Trẻ em`;
    const roomText = `, ${rooms} phòng`;
    return `${adultText}${childText}${roomText}`;
  };

  const handleDatePick = (date: Date) => {
    // If both dates already exist and user clicks, start fresh selection
    if (checkInDate && checkOutDate && datePickerClick === 'first') {
      setCheckInDate(date);
      setCheckOutDate(null);
      setDatePickerClick('second');
      return;
    }

    if (datePickerClick === 'first') {
      // First click: set check-in date
      setCheckInDate(date);
      setDatePickerClick('second');
    } else {
      // Second click: set check-out date
      let finalCheckIn = checkInDate;
      let finalCheckOut = date;

      // If second click < first click, swap them
      if (finalCheckOut < finalCheckIn!) {
        [finalCheckIn, finalCheckOut] = [finalCheckOut, finalCheckIn];
      }

      setCheckInDate(finalCheckIn);
      setCheckOutDate(finalCheckOut);
      setDatePickerClick('first'); // Reset for next selection
      setShowDatePicker(false); // Close dropdown
    }
  };

  const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const handleSearch = () => {
    if (!checkInDate || !checkOutDate) {
      alert('Vui lòng chọn ngày nhận và trả phòng');
      return;
    }

    onSearch?.({
      hotelName: selectedCity?.name || initialHotelName || '',
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults,
      children,
      rooms,
    });
  };

  return (
    <>
      <style>{datePickerStyles}</style>
      <div className="flex items-center gap-3 flex-wrap">
      {/* Location Input */}
      <div ref={locationRef} className="relative flex-1 min-w-[240px]">
        <button
          onClick={() => {
            setShowLocationPicker(!showLocationPicker);
            setShowDatePicker(false);
            setShowGuestPicker(false);
          }}
          className="w-full flex items-center gap-2 px-4 py-3 border border-[#D1D5DB] rounded-2xl bg-white hover:border-[#B3B3B3] transition text-left text-sm"
        >
          <svg className="w-5 h-5 text-[#0057FF] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span className="truncate text-[#374151] font-medium">
            {selectedCity?.name || initialHotelName || 'Chọn khách sạn'}
          </span>
        </button>

        {showLocationPicker && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-[#D1D5DB] rounded-2xl shadow-lg z-50 w-auto">
            <HotelLocationPicker
              onCitySelect={(city) => {
                if (city) {
                  setSelectedCity(city);
                  setShowLocationPicker(false);
                }
              }}
              initialHotelName={initialHotelName}
            />
          </div>
        )}
      </div>

      {/* Date Range Input */}
      <div ref={dateRef} className="relative flex-1 min-w-[260px]">
        <button
          onClick={() => {
            setShowDatePicker(!showDatePicker);
            setShowLocationPicker(false);
            setShowGuestPicker(false);
          }}
          className="w-full flex items-center gap-2 px-4 py-3 border border-[#D1D5DB] rounded-2xl bg-white hover:border-[#B3B3B3] transition text-left text-sm"
        >
          <svg className="w-5 h-5 text-[#6B7280] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
          </svg>
          <span className="truncate text-[#374151] font-medium">
            {formatDateDisplay(checkInDate, checkOutDate)}
          </span>
        </button>

        {showDatePicker && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-[#D1D5DB] rounded-2xl shadow-lg z-50 p-6">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">Ngày ở</h3>
              
              {/* Date Range Display */}
              <div className="mb-4 flex gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#6B7280] mb-2">Nhận phòng</label>
                  <div className="text-base font-semibold text-[#0F172A]">
                    Thứ {checkInDate?.toLocaleDateString('vi-VN', { weekday: 'short' }).charAt(3)}, {checkInDate?.getDate()} thg {(checkInDate?.getMonth() ?? 0) + 1} {checkInDate?.getFullYear()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#6B7280] mb-2">Trả phòng</label>
                  <div className="text-base font-semibold text-[#0F172A]">
                    Thứ {checkOutDate?.toLocaleDateString('vi-VN', { weekday: 'short' }).charAt(3)}, {checkOutDate?.getDate()} thg {(checkOutDate?.getMonth() ?? 0) + 1} {checkOutDate?.getFullYear()}
                  </div>
                </div>
              </div>

              {/* Calendars - Horizontal Layout */}
              <div className="hotel-date-picker">
                <DatePicker
                  selected={datePickerClick === 'first' ? checkInDate : checkOutDate}
                  onChange={handleDatePick}
                  minDate={new Date()}
                  inline
                  monthsShown={2}
                  startDate={checkInDate}
                  endDate={checkOutDate}
                  selectsRange={false}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guest & Room Input */}
      <div ref={guestRef} className="relative flex-1 min-w-[280px]">
        <button
          onClick={() => {
            setShowGuestPicker(!showGuestPicker);
            setShowLocationPicker(false);
            setShowDatePicker(false);
          }}
          className="w-full flex items-center gap-2 px-4 py-3 border border-[#D1D5DB] rounded-2xl bg-white hover:border-[#B3B3B3] transition text-left text-sm group"
        >
          <svg className="w-5 h-5 text-[#6B7280] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span className="truncate text-[#374151] font-medium flex-1">
            {formatGuestDisplay()}
          </span>
          <svg className={`w-5 h-5 text-[#6B7280] flex-shrink-0 transition-transform ${showGuestPicker ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>

        {showGuestPicker && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-[#D1D5DB] rounded-2xl shadow-lg z-50">
            <HotelGuestPicker 
              initialRooms={rooms}
              initialAdults={adults}
              initialChildren={children}
              onSelectionChange={(r, a, c) => {
                setRooms(r);
                setAdults(a);
                setChildren(c);
              }}
            />
          </div>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0057FF] text-white font-semibold hover:bg-[#0046CC] transition shadow-sm whitespace-nowrap"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"/>
        </svg>
        Tìm khách sạn
      </button>
      </div>
    </>
  );
}
