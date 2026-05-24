const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const BOOKING_API_BASE = API_BASE_URL;
const USER_API_BASE = API_BASE_URL;

export type PaymentMethod = 'HOTEL' | 'VNPAY';

export interface BookingItemPayload {
  roomTypeId: string;
  roomTypeName: string;
  ratePlanId?: string;
  checkInDate: string;
  checkOutDate: string;
  quantity: number;
  unitPrice: number | string;
  nights: number;
  guestName?: string;
  cancellationPolicy?: string;
}

export interface CreateBookingPayload {
  userId?: string;
  hotelId: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
  voucherCode?: string;
  pointsToUse?: number;
  items: BookingItemPayload[];
}

export interface BookingResponse {
  id: string;
  hotelId: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: string; // HOTEL, VNPAY
  voucherCode?: string;
  voucherDiscount?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
  holdId?: string;
  holdExpiresAt?: string;
  items: Array<{
    id: string;
    roomTypeId: string;
    roomTypeName: string;
    ratePlanId?: string;
    checkInDate: string;
    checkOutDate: string;
    quantity: number;
    unitPrice: number;
    nights: number;
    subtotal: number;
    taxFee?: number;
    cancellationPolicy?: string;
    guestName?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface VnPayInitResponse {
  redirectUrl: string;
  orderId: string;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: string;
  transactionId?: string;
  vnpayOrderId?: string;
  vnpayResponseCode?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken');
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(/(?:^|; )(?:token|accessToken)=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Yêu cầu thất bại với mã trạng thái ${res.status}`);
  }
  return res.json();
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const bookingApi = {
  async createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<BookingResponse>(res);
  },

  async getBooking(id: string): Promise<BookingResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings/${id}`, { headers: { ...authHeaders() } });
    return handleJsonResponse<BookingResponse>(res);
  },

  async getUserBookings(userId: string): Promise<BookingResponse[]> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings/user/${encodeURIComponent(userId)}`, { headers: { ...authHeaders() } });
    return handleJsonResponse<BookingResponse[]>(res);
  },

  async getHotelBookings(hotelId: string): Promise<BookingResponse[]> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings/hotel/${encodeURIComponent(hotelId)}`, { headers: { ...authHeaders() } });
    return handleJsonResponse<BookingResponse[]>(res);
  },

  async createPayment(bookingId: string, amount: number, method: PaymentMethod) {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ bookingId, amount, method }),
    });
    return handleJsonResponse(res);
  },

  async initVnPay(bookingId: string): Promise<VnPayInitResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments/vnpay/create?bookingId=${encodeURIComponent(bookingId)}`, {
      method: 'POST',
      headers: { ...authHeaders() },
    });
    return handleJsonResponse<VnPayInitResponse>(res);
  },

  async processVnPayReturn(queryString: string) {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments/vnpay/return?${queryString}`, { headers: { ...authHeaders() } });
    return handleJsonResponse<PaymentResponse>(res);
  },

  async getBookingPayment(bookingId: string): Promise<PaymentResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments/booking/${encodeURIComponent(bookingId)}`, { headers: { ...authHeaders() } });
    return handleJsonResponse<PaymentResponse>(res);
  },

  async confirmPayment(bookingId: string): Promise<PaymentResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments/${encodeURIComponent(bookingId)}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    return handleJsonResponse<PaymentResponse>(res);
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<BookingResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings/${encodeURIComponent(bookingId)}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    return handleJsonResponse<BookingResponse>(res);
  },
};

export interface LoyaltyPointsResponse {
  totalPoints: number;
  usedPoints: number;
  availablePoints: number;
}

export const loyaltyApi = {
  async getUserPoints(userId: string): Promise<LoyaltyPointsResponse> {
    const res = await fetch(`${USER_API_BASE}/api/loyalty-points/${encodeURIComponent(userId)}`, {
      headers: { ...authHeaders() },
    });
    return handleJsonResponse<LoyaltyPointsResponse>(res);
  },
};

