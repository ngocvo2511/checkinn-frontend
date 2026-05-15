import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_REVENUE_SERVICE_URL || "http://34.126.166.54";

export interface RevenuePoint {
  periodStart: string; // LocalDate as ISO string
  amount: number;
}

export interface RevenueResponse {
  data: RevenuePoint[];
}

export interface SummaryResponse {
  totalRevenue: number;
  averageRevenue: number;
  occupancyRate: number;
  cancellationRate: number;
}

export interface OccupancyResponse {
  occupancyRate: number;
  roomNights: number;
  capacityNights: number;
}

export interface HotelRevenueSeries {
  hotelId: string;
  hotelName: string;
  revenue: RevenueResponse;
}

export interface OwnerRevenueResponse {
  totalRevenue: number;
  hotels: HotelRevenueSeries[];
}

export interface RoomTypeRevenue {
  roomTypeName: string;
  totalRevenue: number;
  bookingCount: number;
  averagePrice: number;
}

export interface BookingStatusBreakdown {
  confirmed: number;
  cancelled: number;
  noShow: number;
  total: number;
}

export interface HotelSummaryItem {
  hotelId: string;
  hotelName: string;
  totalRevenue: number;
  averageRevenue: number;
  occupancyRate: number;
  cancellationRate: number;
  adr?: number; // Average Daily Rate
  revPAR?: number; // Revenue per Available Room
  platformCommission?: number; // Commission amount
  netRevenue?: number; // Revenue after commission
  bookingStatusBreakdown?: BookingStatusBreakdown;
  roomTypeRevenue?: RoomTypeRevenue[];
}

export interface OwnerSummaryResponse {
  totalRevenue: number;
  totalNetRevenue?: number;
  totalCommission?: number;
  hotels: HotelSummaryItem[];
}

export type GroupBy = "day" | "week" | "month" | "year";

// Admin-specific types for system-wide reporting
export interface TopHotelItem {
  hotelId: string;
  hotelName: string;
  city?: string;
  totalRevenue: number;
  bookingCount: number;
  occupancyRate: number;
}

export interface RegionalRevenue {
  region: string;
  totalRevenue: number;
  hotelCount: number;
  averageRevenue: number;
}

export interface GrowthMetrics {
  currentPeriod: number;
  previousPeriod: number;
  growthRate: number; // Percentage
  growthAmount: number;
}

export interface CustomerAnalytics {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  returningRate: number;
}

export interface AdminSummaryResponse {
  totalRevenue: number;
  totalCommission: number;
  totalBookings: number;
  systemCancellationRate: number;
  topHotels: TopHotelItem[];
  regionalBreakdown: RegionalRevenue[];
  monthlyGrowth?: GrowthMetrics;
  yearlyGrowth?: GrowthMetrics;
  customerAnalytics?: CustomerAnalytics;
}

export interface AdminRevenueResponse {
  totalRevenue: number;
  data: RevenuePoint[];
  hotelBreakdown?: HotelRevenueSeries[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const revenueApi = {
  // Get revenue report for a hotel or all hotels
  getRevenue: async (
    from: string,
    to: string,
    hotelId?: string,
    groupBy?: GroupBy
  ): Promise<RevenueResponse> => {
    const params: any = { from, to };
    if (hotelId) params.hotelId = hotelId;
    if (groupBy) params.groupBy = groupBy;
    const response = await api.get("/api/reports/revenue", { params });
    return response.data;
  },

  // Get summary report for a hotel or all hotels
  getSummary: async (
    from: string,
    to: string,
    hotelId?: string
  ): Promise<SummaryResponse> => {
    const params: any = { from, to };
    if (hotelId) params.hotelId = hotelId;
    const response = await api.get("/api/reports/summary", { params });
    return response.data;
  },

  // Get occupancy report for a hotel
  getOccupancy: async (
    hotelId: string,
    from: string,
    to: string
  ): Promise<OccupancyResponse> => {
    const response = await api.get("/api/reports/occupancy", {
      params: { hotelId, from, to },
    });
    return response.data;
  },

  // Get revenue report for owner (across all their hotels)
  getOwnerRevenue: async (
    ownerId: string,
    from: string,
    to: string,
    groupBy?: GroupBy
  ): Promise<OwnerRevenueResponse> => {
    const params: any = { ownerId, from, to };
    if (groupBy) params.groupBy = groupBy;
    const response = await api.get("/api/reports/owner/revenue", { params });
    return response.data;
  },

  // Get summary report for owner (across all their hotels)
  getOwnerSummary: async (
    ownerId: string,
    from: string,
    to: string
  ): Promise<OwnerSummaryResponse> => {
    const response = await api.get("/api/reports/owner/summary", {
      params: { ownerId, from, to },
    });
    return response.data;
  },

  // Admin APIs - System-wide reporting
  getAdminSummary: async (
    from: string,
    to: string
  ): Promise<AdminSummaryResponse> => {
    const response = await api.get("/api/reports/admin/summary", {
      params: { from, to },
    });
    return response.data;
  },

  getAdminRevenue: async (
    from: string,
    to: string,
    groupBy?: GroupBy
  ): Promise<AdminRevenueResponse> => {
    const params: any = { from, to };
    if (groupBy) params.groupBy = groupBy;
    const response = await api.get("/api/reports/admin/revenue", { params });
    return response.data;
  },

  getTopHotels: async (
    from: string,
    to: string,
    limit?: number
  ): Promise<TopHotelItem[]> => {
    const params: any = { from, to };
    if (limit) params.limit = limit;
    const response = await api.get("/api/reports/admin/top-hotels", { params });
    return response.data;
  },
};
