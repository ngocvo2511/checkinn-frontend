const BOOKING_API_BASE = process.env.NEXT_PUBLIC_BOOKING_API_URL || 'http://localhost:8084';

export type PaymentMethod = 'HOTEL' | 'VNPAY';

export interface BookingItemPayload {
  roomTypeId: string;
  roomTypeName: string;
  ratePlanId?: string;
  checkInDate: string;
  checkOutDate: string;
  quantity: number;
  unitPrice: number;
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

async function handleJsonResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const bookingApi = {
  async createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<BookingResponse>(res);
  },

  async getBooking(id: string): Promise<BookingResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings/${id}`);
    return handleJsonResponse<BookingResponse>(res);
  },

  async getUserBookings(userId: string): Promise<BookingResponse[]> {
    const res = await fetch(`${BOOKING_API_BASE}/api/bookings/user/${encodeURIComponent(userId)}`);
    return handleJsonResponse<BookingResponse[]>(res);
  },

  async createPayment(bookingId: string, amount: number, method: PaymentMethod) {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, amount, method }),
    });
    return handleJsonResponse(res);
  },

  async initVnPay(bookingId: string): Promise<VnPayInitResponse> {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments/vnpay/create?bookingId=${encodeURIComponent(bookingId)}`, {
      method: 'POST',
    });
    return handleJsonResponse<VnPayInitResponse>(res);
  },

  async processVnPayReturn(queryString: string) {
    const res = await fetch(`${BOOKING_API_BASE}/api/payments/vnpay/return?${queryString}`);
    return handleJsonResponse<PaymentResponse>(res);
  },
};
