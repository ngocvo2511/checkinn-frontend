export interface HostMenuItem {
  label: string;
  href: string;
  iconPath: string;
}

export const hostMenuItems: HostMenuItem[] = [
  {
    label: 'Trang chủ',
    href: '/host/dashboard',
    iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  {
    label: 'Quản lý khách sạn',
    href: '/host/hotels',
    iconPath: 'M7 21H3V8L12 3l9 5v13h-4v-7h-4v7h-2v-7h-4v7zm5-14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z',
  },
  {
    label: 'Quản lý doanh thu',
    href: '/host/revenue',
    iconPath: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z',
  },
  {
    label: 'Quản lý đơn đặt phòng',
    href: '/host/bookings',
    iconPath: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
  },
  {
    label: 'Quản lý đánh giá',
    href: '/host/reviews',
    iconPath: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
  },
];
