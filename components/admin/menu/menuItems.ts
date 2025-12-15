export interface AdminMenuItem {
  label: string;
  href: string;
  iconPath: string;
  badge?: string;
}

export const adminMenuItems: AdminMenuItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    iconPath: 'M4 10L12 4L20 10V20H14V13H10V20H4V10Z',
  },
  {
    label: 'Duyệt khách sạn',
    href: '/admin/hotels',
    iconPath: 'M6 8L12 4L18 8V20H6V8ZM8 10V18H10V10H8ZM14 10V18H16V10H14Z',
  },
  {
    label: 'Yêu cầu chờ duyệt',
    href: '/admin/pending',
    iconPath: 'M5 3H19V21H5V3ZM7 5V19H17V5H7ZM9 9H15V11H9V9ZM9 13H15V15H9V13Z',
    badge: '14',
  },
  {
    label: 'Người dùng & phân quyền',
    href: '/admin/users',
    iconPath: 'M12 12C9.794 12 8 10.206 8 8C8 5.794 9.794 4 12 4C14.206 4 16 5.794 16 8C16 10.206 14.206 12 12 12ZM6 18C6 15.79 9.58 14.5 12 14.5C14.42 14.5 18 15.79 18 18V19H6V18Z',
  },
  {
    label: 'Booking & hoàn tiền',
    href: '/admin/bookings',
    iconPath: 'M6 5H18V7H6V5ZM6 9H18V19H6V9ZM10 11V13H8V11H10ZM14 11V13H12V11H14ZM10 15V17H8V15H10ZM14 15V17H12V15H14Z',
  },
  {
    label: 'Báo cáo & nhật ký',
    href: '/admin/reports',
    iconPath: 'M6 4H18V6H6V4ZM6 8H18V20H6V8ZM8 10V12H12V10H8ZM8 14V16H16V14H8Z',
  },
  {
    label: 'Cấu hình hệ thống',
    href: '/admin/settings',
    iconPath: 'M10 2H14V4.07C15.14 4.26 16.19 4.72 17.07 5.39L18.66 4L21 6.34L19.61 7.93C20.28 8.81 20.74 9.86 20.93 11H23V13H20.93C20.74 14.14 20.28 15.19 19.61 16.07L21 17.66L18.66 20L17.07 18.61C16.19 19.28 15.14 19.74 14 19.93V22H10V19.93C8.86 19.74 7.81 19.28 6.93 18.61L5.34 20L3 17.66L4.39 16.07C3.72 15.19 3.26 14.14 3.07 13H1V11H3.07C3.26 9.86 3.72 8.81 4.39 7.93L3 6.34L5.34 4L6.93 5.39C7.81 4.72 8.86 4.26 10 4.07V2ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z',
  },
];
