const BOOKING_API_BASE = process.env.NEXT_PUBLIC_BOOKING_API_URL || 'http://34.126.166.54';
const USER_API_BASE = process.env.NEXT_PUBLIC_USER_API_URL || 'http://34.126.166.54';

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
    throw new Error(text || `Request failed with status ${res.status}`);
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

