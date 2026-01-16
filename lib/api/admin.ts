const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface AdminDashboardStats {
  totalApprovedHotels: number;
  pendingHotels: number;
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
}

export const adminApi = {
  getDashboardStats: async (token: string): Promise<AdminDashboardStats> => {
    try {
      // Fetch all data in parallel for better performance
      const [pendingResponse, hotelsResponse, usersResponse, todayBookingsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/hotels/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/hotels`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/user/count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/api/bookings/count/today`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
      ]);

      const pendingHotels = pendingResponse.ok ? await pendingResponse.json() : [];
      const pendingCount = Array.isArray(pendingHotels) ? pendingHotels.length : 0;

      const allHotels = hotelsResponse.ok ? await hotelsResponse.json() : [];
      const approvedCount = Array.isArray(allHotels) 
        ? allHotels.filter((h: any) => h.approvedStatus === 'APPROVED').length 
        : 0;

      const totalUsers = usersResponse.ok ? await usersResponse.json() : 0;
      
      if (!todayBookingsResponse.ok) {
        console.error('Today bookings response error:', {
          status: todayBookingsResponse.status,
          statusText: todayBookingsResponse.statusText,
          url: todayBookingsResponse.url,
        });
      }
      const todayBookings = todayBookingsResponse.ok ? await todayBookingsResponse.json() : 0;

      return {
        totalApprovedHotels: approvedCount,
        pendingHotels: pendingCount,
        totalUsers: totalUsers,
        totalBookings: 0, // Not used in dashboard anymore
        todayBookings: todayBookings,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalApprovedHotels: 0,
        pendingHotels: 0,
        totalUsers: 0,
        totalBookings: 0,
        todayBookings: 0,
      };
    }
  },
};
