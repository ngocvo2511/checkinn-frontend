import { readJson, ReadApiError } from './read-request.ts';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface AvailabilityCheckResponse {
  available: boolean;
  availableRooms: number;
}

export const availabilityApi = {
  async checkAvailability(
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    quantity: number = 1
  ): Promise<AvailabilityCheckResponse> {
    const params = new URLSearchParams({
      roomTypeId,
      checkIn,
      checkOut,
      quantity: quantity.toString(),
    });

    const data = await readJson(`${API_BASE_URL}/api/v1/availability/check?${params.toString()}`) as Partial<AvailabilityCheckResponse> | null;
    if (!data || typeof data.available !== 'boolean' || !Number.isInteger(data.availableRooms) || data.availableRooms! < 0 || data.available !== (data.availableRooms! >= quantity)) {
      throw new ReadApiError('INVALID_RESPONSE');
    }
    return data as AvailabilityCheckResponse;
  },
};
