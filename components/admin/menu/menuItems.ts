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
    label: 'Yêu cầu chờ duyệt',
    href: '/admin/pending',
    iconPath: 'M5 3H19V21H5V3ZM7 5V19H17V5H7ZM9 9H15V11H9V9ZM9 13H15V15H9V13Z',
  },
  {
    label: 'Báo cáo & nhật ký',
    href: '/admin/reports',
    iconPath: 'M6 4H18V6H6V4ZM6 8H18V20H6V8ZM8 10V12H12V10H8ZM8 14V16H16V14H8Z',
  }
];
