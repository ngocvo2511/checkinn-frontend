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
    label: 'Quản lý người dùng',
    href: '/admin/users',
    iconPath: 'M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z',
  },
  {
    label: 'Báo cáo & nhật ký',
    href: '/admin/reports',
    iconPath: 'M6 4H18V6H6V4ZM6 8H18V20H6V8ZM8 10V12H12V10H8ZM8 14V16H16V14H8Z',
  }
];
