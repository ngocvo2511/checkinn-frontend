'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminMenu from '@/components/admin/menu/AdminMenu';
import { revenueApi, AdminSummaryResponse, AdminRevenueResponse, TopHotelItem } from '@/lib/api/revenue';

export default function AdminReportsPage() {
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
  
  const [adminSummary, setAdminSummary] = useState<AdminSummaryResponse | null>(null);
  const [adminRevenue, setAdminRevenue] = useState<AdminRevenueResponse | null>(null);

  // Fetch admin summary and revenue data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tính toán 6 tháng gần nhất cho biểu đồ
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const chartFrom = sixMonthsAgo.toISOString().split('T')[0];
        const chartTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const [summaryData, revenueData] = await Promise.all([
          revenueApi.getAdminSummary(dateRange.from, dateRange.to),
          revenueApi.getAdminRevenue(chartFrom, chartTo, 'month'),
        ]);
        
        setAdminSummary(summaryData);
        setAdminRevenue(revenueData);
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err?.message || 'Không thể tải dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange.from, dateRange.to]);

  // Tạo array 6 tháng gần nhất
  const monthlyRevenue = useMemo(() => {
    if (!adminRevenue?.data) return [];
    
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
    adminRevenue.data.forEach((point) => {
      const date = new Date(point.periodStart);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueMap.set(key, point.amount / 1000); // Convert to K
    });
    
    // Kết hợp: lấy dữ liệu từ API hoặc set 0
    return last6Months.map(({ monthKey, monthLabel }) => ({
      month: monthLabel,
      value: revenueMap.get(monthKey) || 0
    }));
  }, [adminRevenue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AdminMenu />
        <main className="ml-[280px] px-8 py-6 flex items-center justify-center">
          <p className="text-lg text-[#656F81]">Đang tải dữ liệu...</p>
        </main>
      </div>
    );
  }

  if (error || !adminSummary) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AdminMenu />
        <main className="ml-[280px] px-8 py-6 flex items-center justify-center">
          <p className="text-lg text-red-600">{error || 'Không tìm thấy dữ liệu'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AdminMenu />

      <main className="ml-[280px] px-8 py-6">
        <div className="max-w-7xl space-y-4">
          {/* Hero Section */}
          <section className="rounded-xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-5 py-4 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
                CheckInn Admin
              </div>
              <h1 className="mt-2 text-2xl font-semibold">Doanh thu & hiệu suất</h1>
          </section>

          {/* Date Range Filter */}
          <section className="rounded-2xl border border-[#E8E9F1] bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Chọn khoảng thời gian</p>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="rounded-lg border border-[#E8E9F1] px-3 py-2 text-sm"
                    />
                    <span className="flex items-center text-[#656F81]">đến</span>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="rounded-lg border border-[#E8E9F1] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-xl border border-[#E8E9F1] px-4 py-2 text-sm font-semibold text-[#0B2E68] hover:bg-[#F7F8FA]">
                    Export CSV
                  </button>
                  <button className="rounded-xl border border-[#E8E9F1] px-4 py-2 text-sm font-semibold text-[#0B2E68] hover:bg-[#F7F8FA]">
                    Export PDF
                  </button>
                </div>
              </div>
            </section>

          {/* Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#E8E9F1] bg-gradient-to-br from-[#0066FF] to-[#004FC4] p-5 text-white shadow-[0_14px_30px_rgba(0,102,255,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">Tổng doanh thu</p>
                <div className="text-3xl font-bold mt-2">{adminSummary.totalRevenue.toLocaleString('vi-VN')} ₫</div>
                <p className="text-sm opacity-80 mt-1">Toàn hệ thống</p>
              </div>
              
              <div className="rounded-2xl border border-[#E8E9F1] bg-gradient-to-br from-[#10B981] to-[#059669] p-5 text-white shadow-[0_14px_30px_rgba(16,185,129,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">Hoa hồng thu được</p>
                <div className="text-3xl font-bold mt-2">{adminSummary.totalCommission.toLocaleString('vi-VN')} ₫</div>
                <p className="text-sm opacity-80 mt-1">
                  {((adminSummary.totalCommission / adminSummary.totalRevenue) * 100).toFixed(1)}% của doanh thu
                </p>
              </div>
              
              <div className="rounded-2xl border border-[#E8E9F1] bg-gradient-to-br from-[#F59E0B] to-[#D97706] p-5 text-white shadow-[0_14px_30px_rgba(245,158,11,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">Tổng booking</p>
                <div className="text-3xl font-bold mt-2">{adminSummary.totalBookings.toLocaleString()}</div>
                <p className="text-sm opacity-80 mt-1">Tất cả trạng thái</p>
              </div>
              
              <div className="rounded-2xl border border-[#E8E9F1] bg-gradient-to-br from-[#EF4444] to-[#DC2626] p-5 text-white shadow-[0_14px_30px_rgba(239,68,68,0.25)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-90">Tỉ lệ hủy</p>
                <div className="text-3xl font-bold mt-2">{(adminSummary.systemCancellationRate * 100).toFixed(1)}%</div>
                <p className="text-sm opacity-80 mt-1">Toàn hệ thống</p>
              </div>
            </section>

            {/* Growth Metrics */}
            {(adminSummary.monthlyGrowth || adminSummary.yearlyGrowth) && (
              <section className="grid gap-4 sm:grid-cols-2">
                {adminSummary.monthlyGrowth && (
                  <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Tăng trưởng theo tháng (MoM)</p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-sm text-[#656F81]">Kỳ trước</p>
                        <p className="text-2xl font-bold text-[#1F2226]">{adminSummary.monthlyGrowth.previousPeriod.toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-3xl font-bold ${adminSummary.monthlyGrowth.growthRate >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {adminSummary.monthlyGrowth.growthRate >= 0 ? '+' : ''}{adminSummary.monthlyGrowth.growthRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-[#656F81]">{adminSummary.monthlyGrowth.growthRate >= 0 ? 'Tăng' : 'Giảm'} {Math.abs(adminSummary.monthlyGrowth.growthAmount).toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#656F81]">Kỳ này</p>
                        <p className="text-2xl font-bold text-[#0B2E68]">{adminSummary.monthlyGrowth.currentPeriod.toLocaleString('vi-VN')} ₫</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {adminSummary.yearlyGrowth && (
                  <div className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Tăng trưởng theo năm (YoY)</p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-sm text-[#656F81]">Năm trước</p>
                        <p className="text-2xl font-bold text-[#1F2226]">{adminSummary.yearlyGrowth.previousPeriod.toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-3xl font-bold ${adminSummary.yearlyGrowth.growthRate >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {adminSummary.yearlyGrowth.growthRate >= 0 ? '+' : ''}{adminSummary.yearlyGrowth.growthRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-[#656F81]">{adminSummary.yearlyGrowth.growthRate >= 0 ? 'Tăng' : 'Giảm'} {Math.abs(adminSummary.yearlyGrowth.growthAmount).toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#656F81]">Năm nay</p>
                        <p className="text-2xl font-bold text-[#0B2E68]">{adminSummary.yearlyGrowth.currentPeriod.toLocaleString('vi-VN')} ₫</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

          {/* Revenue Chart */}
          <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Biểu đồ doanh thu</p>
                <h2 className="text-xl font-semibold text-[#1F2226]">Toàn hệ thống</h2>
                <p className="text-sm text-[#656F81] mt-1">6 tháng gần nhất</p>
              </div>
              <span className="rounded-full bg-[#E8EFFC] px-3 py-1 text-xs font-semibold text-[#0B2E68]">
                6 tháng
              </span>
            </div>

              <div className="relative h-[320px]">
                {/* Grid */}
                <div className="absolute inset-0 px-4 py-8">
                  <div className="flex h-full flex-col justify-between">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="border-t border-dashed border-[#E1E5EE]" />
                    ))}
                  </div>
                </div>

                {(() => {
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
                          <linearGradient id="adminRevGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                          </linearGradient>
                          <filter id="adminShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.12" />
                          </filter>
                        </defs>

                        <path d={areaPath} fill="url(#adminRevGradient)" />
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#adminShadow)"
                        />

                        {points.map((p) => (
                          <g key={p.month}>
                            <circle cx={p.x} cy={p.y} r="10" fill="#10B981" opacity="0.18" />
                            <circle cx={p.x} cy={p.y} r="6" fill="#FFFFFF" stroke="#10B981" strokeWidth="3" />
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
            </section>

            {/* Customer Analytics */}
            {adminSummary.customerAnalytics && (
              <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Phân tích nền tảng</p>
                  <h3 className="text-xl font-semibold text-[#1F2226]">Khách hàng & Chủ khách sạn</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#E8E9F1] bg-[#F0F9FF] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0369A1]">Tổng khách hàng</p>
                    <p className="text-3xl font-bold text-[#0C4A6E] mt-2">{(adminSummary.customerAnalytics.totalCustomers ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-[#656F81] mt-2">Số khách hàng đã hoàn thành thanh toán</p>
                  </div>
                  <div className="rounded-xl border border-[#E8E9F1] bg-[#F0FDF4] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#15803D]">Chủ khách sạn</p>
                    <p className="text-3xl font-bold text-[#166534] mt-2">{(adminSummary.customerAnalytics.totalHotelOwners ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-[#656F81] mt-2">Số chủ khách sạn hoạt động trên nền tảng</p>
                  </div>
                </div>
              </section>
            )}

            {/* Top Hotels */}
            {adminSummary.topHotels && adminSummary.topHotels.length > 0 && (
              <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between gap-3 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Top khách sạn</p>
                    <h3 className="text-xl font-semibold text-[#1F2226]">Doanh thu cao nhất</h3>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-[#E8E9F1]">
                  <table className="w-full text-left text-sm text-[#1F2226]">
                    <thead className="bg-[#F7F8FA] text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Khách sạn</th>
                        <th className="px-4 py-3">Thành phố</th>
                        <th className="px-4 py-3">Doanh thu</th>
                        <th className="px-4 py-3">Số booking</th>
                        <th className="px-4 py-3">Lấp đầy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E9F1] text-sm">
                      {adminSummary.topHotels.map((hotel, idx) => (
                        <tr key={hotel.hotelId} className="hover:bg-[#F9FBFF]">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              idx === 0 ? 'bg-[#FFD700] text-[#854D0E]' :
                              idx === 1 ? 'bg-[#C0C0C0] text-[#1F2937]' :
                              idx === 2 ? 'bg-[#CD7F32] text-white' :
                              'bg-[#E8E9F1] text-[#6B7280]'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold">{hotel.hotelName}</td>
                          <td className="px-4 py-3 text-[#656F81]">{hotel.city || 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold text-[#10B981]">{hotel.totalRevenue.toLocaleString('vi-VN')} ₫</td>
                          <td className="px-4 py-3 text-[#383E48]">{hotel.bookingCount}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              hotel.occupancyRate > 0.8 ? 'bg-[#D1FAE5] text-[#065F46]' :
                              hotel.occupancyRate > 0.5 ? 'bg-[#FEF3C7] text-[#92400E]' :
                              'bg-[#FEE2E2] text-[#991B1B]'
                            }`}>
                              {(hotel.occupancyRate * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Regional Breakdown */}
            {adminSummary.regionalBreakdown && adminSummary.regionalBreakdown.length > 0 && (
              <section className="rounded-2xl border border-[#E8E9F1] bg-white p-6 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                <div className="pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8B94A4]">Phân bổ theo khu vực</p>
                  <h3 className="text-xl font-semibold text-[#1F2226]">Doanh thu theo thành phố/vùng</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {adminSummary.regionalBreakdown.map((region, idx) => (
                    <div key={idx} className="rounded-xl border border-[#E8E9F1] bg-gradient-to-br from-[#F0F9FF] to-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0369A1]">{region.region}</p>
                      <p className="text-2xl font-bold text-[#0C4A6E] mt-2">{region.totalRevenue.toLocaleString('vi-VN')} ₫</p>
                      <div className="mt-2 flex items-center justify-between text-sm text-[#656F81]">
                        <span>{region.hotelCount} khách sạn</span>
                        <span>TB: {region.averageRevenue.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
          )}
        </div>
      </main>
    </div>
  );
}
