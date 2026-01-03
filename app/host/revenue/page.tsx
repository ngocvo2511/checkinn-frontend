'use client';

import { useMemo, useState, useEffect } from 'react';
import Header from '@/components/Header';
import HostMenu from '@/components/host/menu/HostMenu';
import { revenueApi, OwnerSummaryResponse, OwnerRevenueResponse, HotelSummaryItem, GroupBy } from '@/lib/api/revenue';
import type { AuthResponse } from '@/lib/api/auth';

export default function HostRevenuePage() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range state (default to current month)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0],
    };
  });

  // Applied date range state (for actual API calls)
  const [appliedDateRange, setAppliedDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0],
    };
  });
  
  const [ownerSummary, setOwnerSummary] = useState<OwnerSummaryResponse | null>(null);
  const [ownerRevenue, setOwnerRevenue] = useState<OwnerRevenueResponse | null>(null);

  // Load user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthResponse;
      setUser(parsed);
    } catch (err) {
      console.error('Failed to parse user', err);
      setLoading(false);
    }
  }, []);

  // Fetch owner summary and revenue data
  useEffect(() => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use userId as ownerId
        const ownerId = String(user.userId);
        
        // Tính toán 6 tháng gần nhất cho biểu đồ
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const chartFrom = sixMonthsAgo.toISOString().split('T')[0];
        const chartTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const [summaryData, revenueData] = await Promise.all([
          revenueApi.getOwnerSummary(ownerId, appliedDateRange.from, appliedDateRange.to),
          revenueApi.getOwnerRevenue(ownerId, chartFrom, chartTo, 'month' as GroupBy),
        ]);
        
        setOwnerSummary(summaryData);
        setOwnerRevenue(revenueData);
        
        // Auto-select first hotel or reset if current selection doesn't exist
        if (summaryData.hotels.length > 0) {
          const hotelExists = summaryData.hotels.some(h => h.hotelId === selectedHotelId);
          if (!hotelExists || !selectedHotelId) {
            setSelectedHotelId(summaryData.hotels[0].hotelId);
          }
        } else {
          setSelectedHotelId(null);
        }
      } catch (err: any) {
        console.error('Error fetching revenue data:', err);
        setError(err?.message || 'Không thể tải dữ liệu doanh thu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.userId, appliedDateRange.from, appliedDateRange.to]);

  const selectedHotel = useMemo(() => {
    if (!ownerSummary || !selectedHotelId) return null;
    return ownerSummary.hotels.find((h) => h.hotelId === selectedHotelId);
  }, [ownerSummary, selectedHotelId]);
  
  const selectedHotelRevenue = useMemo(() => {
    if (!ownerRevenue || !selectedHotelId) return null;
    return ownerRevenue.hotels.find((h) => h.hotelId === selectedHotelId);
  }, [ownerRevenue, selectedHotelId]);

  // Tạo array 6 tháng gần nhất
  const monthlyRevenue = useMemo(() => {
    if (!selectedHotelRevenue?.revenue.data) return [];
    
    // Tạo 6 tháng gần nhất
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        monthLabel: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    
    // Map dữ liệu từ API
    const revenueMap = new Map();
    selectedHotelRevenue.revenue.data.forEach((point) => {
      const date = new Date(point.periodStart);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueMap.set(key, point.amount / 1000); // Convert to K
    });
    
    // Kết hợp: lấy dữ liệu từ API hoặc set 0
    return last6Months.map(({ monthKey, monthLabel }) => ({
      month: monthLabel,
      value: revenueMap.get(monthKey) || 0
    }));
  }, [selectedHotelRevenue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <main className="flex-1 px-6 py-10 flex items-center justify-center">
          <p className="text-lg text-[#656F81]">Đang tải dữ liệu...</p>
        </main>
      </div>
    );
  }

  if (error || !ownerSummary) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
        <Header />
        <main className="flex-1 px-6 py-10 flex items-center justify-center">
          <p className="text-lg text-red-600">{error || 'Không tìm thấy dữ liệu'}</p>
        </main>
      </div>
    );
  }

  const summary = selectedHotel ? [
    { label: 'Doanh thu', value: `${selectedHotel.totalRevenue.toLocaleString('vi-VN')} VND`, helper: `Từ ${dateRange.from} đến ${dateRange.to}` },
    { label: 'Doanh thu thực nhận', value: selectedHotel.netRevenue ? `${selectedHotel.netRevenue.toLocaleString('vi-VN')} VND` : 'N/A', helper: 'Sau khi trừ hoa hồng' },
    { label: 'Hoa hồng nền tảng', value: selectedHotel.platformCommission ? `${selectedHotel.platformCommission.toLocaleString('vi-VN')} VND` : 'N/A', helper: 'Phí dịch vụ (10%)' },
    { label: 'Tỉ lệ lấp đầy', value: `${(selectedHotel.occupancyRate * 100).toFixed(1)}%`, helper: 'Occupancy rate' },
    { label: 'Tỉ lệ hủy', value: `${(selectedHotel.cancellationRate * 100).toFixed(1)}%`, helper: 'Cancellation rate' },
    { label: 'Doanh thu TB/ngày', value: `${Math.round(selectedHotel.averageRevenue).toLocaleString('vi-VN')} VND`, helper: 'Trung bình theo ngày' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <HostMenu />
          <div className="flex-1 space-y-4">
            <section className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                Quản lí doanh thu
              </div>
              <div className="mt-4 space-y-2">
                <h1 className="text-3xl font-semibold leading-[38px]">Doanh thu & payout</h1>
                <p className="max-w-2xl text-sm text-white/85">Mock data để xem layout: biểu đồ doanh thu, tóm tắt payout và phân bổ phòng được hiển thị mẫu.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#E8E9F1] bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Chọn khoảng thời gian</p>
                  <div className="flex gap-2 mt-2 items-end">
                    <div className="flex flex-col gap-1">
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="rounded-lg border border-[#E8E9F1] px-3 py-2 text-sm"
                      />
                    </div>
                    <span className="flex items-center text-[#656F81]">đến</span>
                    <div className="flex flex-col gap-1">
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="rounded-lg border border-[#E8E9F1] px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (dateRange.from >= dateRange.to) {
                          alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
                          return;
                        }
                        setAppliedDateRange(dateRange);
                      }}
                      className="rounded-lg bg-[#0B2E68] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2555] transition"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Chọn khách sạn</p>
                  <h2 className="text-lg font-semibold text-[#1F2226]">Quản lí nhiều tài sản cùng lúc</h2>
                  <p className="text-sm text-[#656F81]">Bấm vào thẻ để xem doanh thu, payout và bảng dòng tiền của từng khách sạn.</p>
                </div>
                <span className="rounded-full bg-[#E8EFFC] px-3 py-1 text-xs font-semibold text-[#0B2E68]">
                  Tổng: {ownerSummary.totalRevenue.toLocaleString('vi-VN')} VND
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ownerSummary.hotels.map((hotel) => {
                  const active = hotel.hotelId === selectedHotelId;
                  return (
                    <button
                      key={hotel.hotelId}
                      onClick={() => setSelectedHotelId(hotel.hotelId)}
                      className={`flex flex-col gap-2 rounded-xl border px-4 py-3 text-left transition shadow-[0_10px_22px_rgba(0,0,0,0.06)] ${
                        active ? 'border-[#0B2E68] bg-[#E8EFFC]' : 'border-[#E8E9F1] bg-white hover:border-[#CCE0FF] hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">{hotel.hotelId}</p>
                          <p className={`text-base font-semibold ${active ? 'text-[#0B2E68]' : 'text-[#1F2226]'}`}>{hotel.hotelName}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${active ? 'bg-white text-[#0B2E68]' : 'bg-[#F1F2F3] text-[#383E48]'}`}>
                          {active ? 'Đang xem' : 'Xem'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-[#383E48]">
                        <div>
                          <p className="text-xs text-[#8B94A4]">Doanh thu</p>
                          <p className="font-semibold text-[#0B1B3F]">{hotel.totalRevenue.toLocaleString('vi-VN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8B94A4]">TB/ngày</p>
                          <p className="font-semibold text-[#0B1B3F]">{parseInt(hotel.averageRevenue.toFixed(0)).toLocaleString('vi-VN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#8B94A4]">Lấp đầy</p>
                          <p className="font-semibold text-[#0B1B3F]">{(hotel.occupancyRate * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summary.map((item) => (
                <div key={item.label} className="flex flex-col gap-2 rounded-2xl border border-[#E8E9F1] bg-white p-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">{item.label}</p>
                  <div className="text-2xl font-semibold text-[#1F2226]">{item.value}</div>
                  <p className="text-sm text-[#656F81]">{item.helper}</p>
                </div>
              ))}
            </section>

            {/* Booking Status Breakdown */}
            {selectedHotel?.bookingStatusBreakdown && (
              <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Trạng thái Booking</p>
                  <h3 className="text-xl font-semibold text-[#1F2226]">Phân tích booking của {selectedHotel.hotelName}</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#E8E9F1] bg-[#F0F9FF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0369A1]">Tổng booking</p>
                    <p className="text-3xl font-bold text-[#0C4A6E] mt-2">{selectedHotel.bookingStatusBreakdown.total}</p>
                  </div>
                  <div className="rounded-xl border border-[#E8E9F1] bg-[#F0FDF4] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#15803D]">Đã xác nhận</p>
                    <p className="text-3xl font-bold text-[#166534] mt-2">{selectedHotel.bookingStatusBreakdown.confirmed}</p>
                  </div>
                  <div className="rounded-xl border border-[#E8E9F1] bg-[#FFF7ED] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C2410C]">Đã hủy</p>
                    <p className="text-3xl font-bold text-[#9A3412] mt-2">{selectedHotel.bookingStatusBreakdown.cancelled}</p>
                  </div>
                  <div className="rounded-xl border border-[#E8E9F1] bg-[#FEF2F2] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#B91C1C]">No-show</p>
                    <p className="text-3xl font-bold text-[#991B1B] mt-2">{selectedHotel.bookingStatusBreakdown.noShow}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Room Type Revenue Breakdown */}
            {selectedHotel?.roomTypeRevenue && selectedHotel.roomTypeRevenue.length > 0 && (
              <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Doanh thu theo loại phòng</p>
                  <h3 className="text-xl font-semibold text-[#1F2226]">Phân tích hiệu quả từng loại phòng</h3>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#E8E9F1]">
                  <table className="w-full text-left text-sm text-[#1F2226]">
                    <thead className="bg-[#F7F8FA] text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">
                      <tr>
                        <th className="px-4 py-3">Loại phòng</th>
                        <th className="px-4 py-3">Doanh thu</th>
                        <th className="px-4 py-3">Số booking</th>
                        <th className="px-4 py-3">Giá TB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E9F1] text-sm">
                      {selectedHotel.roomTypeRevenue.map((roomType, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FBFF]">
                          <td className="px-4 py-3 font-semibold">{roomType.roomTypeName}</td>
                          <td className="px-4 py-3 font-semibold text-[#0B2E68]">{roomType.totalRevenue.toLocaleString('vi-VN')} VND</td>
                          <td className="px-4 py-3 text-[#383E48]">{roomType.bookingCount}</td>
                          <td className="px-4 py-3 text-[#383E48]">{roomType.averagePrice.toFixed(0).toLocaleString('vi-VN')} VND</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)] xl:col-span-2">
                <div className="flex items-center justify-between gap-3 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Biểu đồ doanh thu</p>
                    <h2 className="text-xl font-semibold text-[#1F2226]">{selectedHotel?.hotelName || 'Chọn khách sạn'}</h2>
                    <p className="text-sm text-[#656F81] mt-1">6 tháng gần nhất</p>
                  </div>
                  <span className="rounded-full bg-[#E8EFFC] px-3 py-1 text-xs font-semibold text-[#0B2E68]">
                    6 tháng
                  </span>
                </div>

                {monthlyRevenue.length === 0 ? (
                  <div className="flex items-center justify-center h-[320px] text-[#656F81]">
                    <p>Không có dữ liệu doanh thu</p>
                  </div>
                ) : (
                  <div className="relative h-[320px]">
                  {/* Grid */}
                  <div className="absolute inset-0 px-4 py-8">
                    <div className="flex h-full flex-col justify-between text-[#C5CBD8]">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="border-t border-dashed border-[#E1E5EE]" />
                      ))}
                    </div>
                  </div>

                  {(() => {
                    // Safety check for selectedHotel
                    if (!selectedHotel) {
                      return <div className="text-center text-[#656F81]">Chọn khách sạn để xem biểu đồ doanh thu</div>;
                    }

                    const width = 700;
                    const plotHeight = 180;
                    const labelBand = 40;
                    const height = plotHeight + labelBand;
                    const padX = 32;
                    const padY = 18;

                    const maxValue = Math.max(...monthlyRevenue.map((r) => r.value), 1); // Min 1 to avoid 0 range
                    const minValue = 0; // Always start from 0 for revenue
                    const valueRange = Math.max(maxValue - minValue, 0.0001);
                    const step = (width - padX * 2) / Math.max(1, monthlyRevenue.length - 1);

                    type ChartPoint = { month: string; value: number; x: number; y: number };
                    const points: ChartPoint[] = monthlyRevenue.map((item, idx) => {
                      const x = padX + idx * step;
                      const y = padY + (1 - (item.value - minValue) / valueRange) * (plotHeight - padY * 2);
                      return { ...item, x: isFinite(x) ? x : padX, y: isFinite(y) ? y : padY };
                    });

                    // Build linear path (đường thẳng, không smooth)
                    const buildLinePath = (pts: ChartPoint[]) => {
                      if (pts.length < 2) return '';
                      const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
                      for (let i = 1; i < pts.length; i += 1) {
                        d.push(`L ${pts[i].x} ${pts[i].y}`);
                      }
                      return d.join(' ');
                    };

                    const linePath = buildLinePath(points);
                    
                    // Build area path with linear lines
                    const buildAreaPath = (pts: ChartPoint[]) => {
                      if (pts.length < 2) return '';
                      const d: string[] = [];
                      
                      // Start at bottom-left
                      d.push(`M ${pts[0].x} ${plotHeight}`);
                      d.push(`L ${pts[0].x} ${pts[0].y}`);
                      
                      // Draw lines to each point
                      for (let i = 1; i < pts.length; i += 1) {
                        d.push(`L ${pts[i].x} ${pts[i].y}`);
                      }
                      
                      // Close path back to baseline
                      d.push(`L ${pts[pts.length - 1].x} ${plotHeight}`);
                      d.push('Z');
                      
                      return d.join(' ');
                    };
                    
                    const areaPath = buildAreaPath(points);

                    return (
                      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${width} ${height}`}>
                        <defs>
                          <linearGradient id={`revGradient-${selectedHotel.hotelId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2D7BFF" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#2D7BFF" stopOpacity="0.05" />
                          </linearGradient>
                          <filter id={`shadow-${selectedHotel.hotelId}`} x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.12" />
                          </filter>
                        </defs>

                        {/* Area */}
                        <path d={areaPath} fill={`url(#revGradient-${selectedHotel.hotelId})`} />

                        {/* Line */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#0A4DFF"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter={`url(#shadow-${selectedHotel.hotelId})`}
                        />

                        {/* Points + labels */}
                        {points.map((p) => (
                          <g key={p.month}>
                            <circle cx={p.x} cy={p.y} r="10" fill="#0A4DFF" opacity="0.18" />
                            <circle cx={p.x} cy={p.y} r="6" fill="#FFFFFF" stroke="#0A4DFF" strokeWidth="3" />
                            <text
                              x={p.x}
                              y={p.y - 18}
                              textAnchor="middle"
                              className="fill-[#0B1B3F] text-[13px] font-semibold"
                            >
                              {p.value.toFixed(1)}k
                            </text>
                            <text
                              x={p.x}
                              y={plotHeight + 26}
                              textAnchor="middle"
                              className="fill-[#6A7280] text-[12px] font-semibold"
                            >
                              {p.month}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Tóm tắt tất cả khách sạn</p>
                  <h3 className="text-xl font-semibold text-[#1F2226]">Chi tiết doanh thu từng khách sạn</h3>
                  <p className="text-sm text-[#656F81]">Dữ liệu từ {dateRange.from} đến {dateRange.to}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-xl border border-[#E8E9F1] px-3 py-2 text-sm font-semibold text-[#0B2E68] hover:bg-[#F7F8FA]">Tải CSV</button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#E8E9F1]">
                <table className="w-full text-left text-sm text-[#1F2226]">
                  <thead className="bg-[#F7F8FA] text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">
                    <tr>
                      <th className="px-4 py-3">Khách sạn</th>
                      <th className="px-4 py-3">Doanh thu</th>
                      <th className="px-4 py-3">TB/Ngày</th>
                      <th className="px-4 py-3">Lấp đầy</th>
                      <th className="px-4 py-3">Tỉ lệ hủy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E9F1] text-sm">
                    {ownerSummary.hotels.map((hotel) => (
                      <tr key={hotel.hotelId} className="hover:bg-[#F9FBFF]">
                        <td className="px-4 py-3 font-semibold">{hotel.hotelName}</td>
                        <td className="px-4 py-3 font-semibold text-[#0B2E68]">{hotel.totalRevenue.toLocaleString('vi-VN')} VND</td>
                        <td className="px-4 py-3 text-[#383E48]">{Math.round(hotel.averageRevenue).toLocaleString('vi-VN')} VND</td>
                        <td className="px-4 py-3 text-[#383E48]">{(hotel.occupancyRate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${hotel.cancellationRate < 0.05 ? 'bg-[#E8FFF3] text-[#0F5132]' : 'bg-[#FFF4E5] text-[#B45309]'}`}>
                            {(hotel.cancellationRate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
