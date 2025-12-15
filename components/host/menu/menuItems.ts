export interface HostMenuItem {
  label: string;
  href: string;
  iconPath: string;
}

export const hostMenuItems: HostMenuItem[] = [
  {
    label: 'Dashboard',
    href: '/host/dashboard',
    iconPath: 'M4 10L12 4L20 10V20H14V13H10V20H4V10Z',
  },
  {
    label: 'Quản lí khách sạn',
    href: '/host/hotels',
    iconPath: 'M6 8L12 4L18 8V20H6V8ZM8 10V18H10V10H8ZM14 10V18H16V10H14Z',
  },
  {
    label: 'Quản lí doanh thu',
    href: '/host/revenue',
    iconPath: 'M5 5H19V7H5V5ZM5 9H19V19H5V9ZM9 11V17H7V11H9ZM13 11V17H11V11H13ZM17 11V17H15V11H17Z',
  },
  {
    label: 'Quản lí booking',
    href: '/host/bookings',
    iconPath: 'M6 5H18V7H6V5ZM6 9H18V19H6V9ZM10 11V13H8V11H10ZM14 11V13H12V11H14ZM10 15V17H8V15H10ZM14 15V17H12V15H14Z',
  },
];
