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

    const response = await fetch(
      `${API_BASE_URL}/api/v1/availability/check?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check availability: ${response.statusText}`);
    }

    return response.json();
  },
};
