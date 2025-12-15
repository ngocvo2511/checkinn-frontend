'use client';

import Header from '@/components/Header';
import AdminStatCard from '@/components/AdminStatCard';
import AdminMenu from '@/components/admin/menu/AdminMenu';

const metrics = [
  {
    label: 'Tổng khách sạn đã duyệt',
    value: '128',
    helper: 'Dữ liệu giả lập • cập nhật 5 phút trước',
    trendLabel: '+12 so với tuần trước',
    trendPositive: true,
    icon: ApprovedIcon(),
    badge: 'Live (mock)',
  },
  {
    label: 'Khách sạn chờ duyệt',
    value: '14',
    helper: 'Ưu tiên theo SLA 24h',
    trendLabel: '5 cần rà soát thêm',
    trendPositive: false,
    icon: PendingIcon(),
  },
  {
    label: 'Số user',
    value: '12,430',
    helper: '92% đã xác minh email',
    trendLabel: '+180 người / tuần',
    trendPositive: true,
    icon: UsersIcon(),
  },
  {
    label: 'Booking trong ngày',
    value: '96',
    helper: 'Bao gồm trả phòng & đặt mới',
    trendLabel: '+8 so với hôm qua',
    trendPositive: true,
    icon: BookingIcon(),
  },
];

const menuItems = [
  {
    title: 'Quản lý khách sạn',
    desc: 'Xem, duyệt và chỉnh sửa thông tin lưu trú. Ưu tiên các yêu cầu mới.',
    action: 'Đi tới danh sách',
  },
  {
    title: 'Yêu cầu chờ duyệt',
    desc: '14 yêu cầu mở — phân bổ người duyệt, đặt SLA và ghi chú.',
    action: 'Xử lý ngay',
  },
  {
    title: 'Người dùng & phân quyền',
    desc: 'Cập nhật vai trò, bật 2FA, khóa hoặc mở khóa tài khoản.',
    action: 'Quản lý user',
  },
  {
    title: 'Booking & hoàn tiền',
    desc: 'Theo dõi booking trong ngày, đánh dấu lỗi, xử lý hoàn tiền.',
    action: 'Xem booking',
  },
  {
    title: 'Báo cáo & nhật ký',
    desc: 'Tải báo cáo, kiểm tra log hành động để audit.',
    action: 'Mở báo cáo',
  },
  {
    title: 'Cấu hình hệ thống',
    desc: 'Banner, thông báo bảo trì, và thiết lập cổng thanh toán.',
    action: 'Cấu hình',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl gap-6">
          <AdminMenu />

          <div className="flex-1 flex flex-col gap-8">
            <section className="rounded-3xl bg-gradient-to-br from-[#0B1B3F] via-[#0E264F] to-[#0A3D8F] px-6 py-8 text-white shadow-[0_24px_45px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#FFCC00]" />
                CheckInn admin
              </div>
              <div className="mt-4 space-y-2">
                <h1 className="text-3xl font-semibold leading-[38px]">Bảng điều khiển Admin</h1>
                <p className="max-w-2xl text-sm text-white/85">
                  Giám sát kiểm duyệt khách sạn, booking và người dùng. Dữ liệu hiển thị là giả lập để kiểm tra layout và flow.
                </p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <AdminStatCard key={metric.label} {...metric} />
              ))}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

function ApprovedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 1.75C6.624 1.75 2.25 6.124 2.25 11.5C2.25 16.876 6.624 21.25 12 21.25C17.376 21.25 21.75 16.876 21.75 11.5C21.75 6.124 17.376 1.75 12 1.75ZM10.5 15.25L6.75 11.5L7.8105 10.4395L10.5 13.129L16.1895 7.4395L17.25 8.5L10.5 15.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 22C6.486 22 2 17.514 2 12C2 6.486 6.486 2 12 2C17.514 2 22 6.486 22 12C22 17.514 17.514 22 12 22ZM12 3.5C7.589 3.5 4 7.089 4 11.5C4 15.911 7.589 19.5 12 19.5C16.411 19.5 20 15.911 20 11.5C20 7.089 16.411 3.5 12 3.5ZM13 12V7H11V13.25L16.25 16.25L17.25 14.5L13 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 4.75C10.7949 4.75 12.25 6.20507 12.25 8C12.25 9.79493 10.7949 11.25 9 11.25C7.20507 11.25 5.75 9.79493 5.75 8C5.75 6.20507 7.20507 4.75 9 4.75ZM9 12.75C11.8995 12.75 14.25 10.3995 14.25 7.5C14.25 4.60051 11.8995 2.25 9 2.25C6.10051 2.25 3.75 4.60051 3.75 7.5C3.75 10.3995 6.10051 12.75 9 12.75ZM16.5 6.75C17.4665 6.75 18.25 7.5335 18.25 8.5C18.25 9.4665 17.4665 10.25 16.5 10.25C15.5335 10.25 14.75 9.4665 14.75 8.5C14.75 7.5335 15.5335 6.75 16.5 6.75ZM16.5 11.75C18.2949 11.75 19.75 10.2949 19.75 8.5C19.75 6.70507 18.2949 5.25 16.5 5.25C14.7051 5.25 13.25 6.70507 13.25 8.5C13.25 10.2949 14.7051 11.75 16.5 11.75ZM4.25 19.5C4.25 16.6005 6.60051 14.25 9.5 14.25H8.5C11.3995 14.25 13.75 16.6005 13.75 19.5V20.25H4.25V19.5ZM8.5 12.75C5.60051 12.75 3.25 15.1005 3.25 18V20.75H14.75V18C14.75 15.1005 12.3995 12.75 9.5 12.75H8.5ZM16.5 13.75C15.8575 13.75 15.2536 13.8753 14.7081 14.1028C15.971 15.156 16.75 16.7319 16.75 18.5V20.75H20.75V18C20.75 15.1005 18.3995 12.75 15.5 12.75H15C15.5254 12.75 16.0336 12.8347 16.5 12.9914C16.5 12.9914 16.5 13.75 16.5 13.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BookingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19 3H18V1.5H16.5V3H7.5V1.5H6V3H5C3.895 3 3 3.895 3 5V20C3 21.105 3.895 22 5 22H19C20.105 22 21 21.105 21 20V5C21 3.895 20.105 3 19 3ZM19.5 20C19.5 20.276 19.276 20.5 19 20.5H5C4.724 20.5 4.5 20.276 4.5 20V9H19.5V20ZM19.5 7.5H4.5V5C4.5 4.724 4.724 4.5 5 4.5H6V6H7.5V4.5H16.5V6H18V4.5H19C19.276 4.5 19.5 4.724 19.5 5V7.5ZM8 12.25H10V14.25H8V12.25ZM11 12.25H13V14.25H11V12.25ZM14 12.25H16V14.25H14V12.25ZM8 15.75H10V17.75H8V15.75ZM11 15.75H13V17.75H11V15.75ZM14 15.75H16V17.75H14V15.75Z"
        fill="currentColor"
      />
    </svg>
  );
}
