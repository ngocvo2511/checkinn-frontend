"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { bookingApi, type PaymentResponse } from "@/lib/api/booking";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VnPayReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "success" | "failed">("pending");
  const [message, setMessage] = useState<string>("Đang xác thực thanh toán...");
  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  useEffect(() => {
    const qs = searchParams.toString();
    if (!qs) return;

    bookingApi
      .processVnPayReturn(qs)
      .then((resp) => {
        setPayment(resp);
        // Check VNPay response code: 00 = success, others = failed/cancelled
        if (resp.vnpayResponseCode === "00" || resp.status === "COMPLETED") {
          setStatus("success");
          setMessage("Thanh toán VNPay thành công. Đơn đặt phòng đã được xác nhận.");
        } else {
          setStatus("failed");
          const code = resp.vnpayResponseCode;
          if (code === "24") {
            setMessage("Giao dịch bị hủy bởi người dùng.");
          } else if (code === "11") {
            setMessage("Đã hết hạn thanh toán. Vui lòng thử lại.");
          } else {
            setMessage(`Thanh toán thất bại (Mã lỗi: ${code}). Vui lòng thử lại.`);
          }
        }
      })
      .catch((err: any) => {
        setStatus("failed");
        setMessage(err?.message || "Thanh toán VNPay thất bại hoặc bị từ chối.");
      });
  }, [searchParams]);

  const queryOrderId = searchParams.get("vnp_TxnRef") || "--";
  const queryAmount = searchParams.get("vnp_Amount");
  const queryResponseCode = searchParams.get("vnp_ResponseCode") || "--";
  const queryTransactionNo = searchParams.get("vnp_TransactionNo") || "--";

  const amount = payment?.amount ?? (queryAmount ? Number(queryAmount) / 100 : undefined);
  const paymentId = payment?.id || queryOrderId;
  const bookingId = payment?.bookingId || "";
  const responseCode = payment?.vnpayResponseCode || queryResponseCode;
  const paidAt = payment?.paidAt;
  const statusBadge = status === "success" ? "bg-blue-100 text-blue-700" : status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white text-[#0F172A] min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-[#F8FAFC]">
        <div className="mx-auto max-w-xl px-4 py-12">
          <div className={`rounded-2xl border p-6 shadow-sm space-y-4 ${status === "success" ? "border-blue-400 bg-blue-50" : status === "failed" ? "border-red-500 bg-red-50" : "border-[#E5E7EB] bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold mb-2">Kết quả thanh toán VNPay</h1>
                <p className="text-sm">{message}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge}`}>
                {status === "success" ? "Thành công" : status === "failed" ? "Thất bại" : "Đang xử lý"}
              </span>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Mã thanh toán (TxnRef)</span>
                <span className="font-semibold text-[#0F172A]">{paymentId}</span>
              </div>
              {bookingId && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Mã đặt phòng</span>
                  <span className="font-semibold text-[#0F172A]">{bookingId}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Số tiền</span>
                <span className="font-semibold text-[#0F172A]">{amount ? amount.toLocaleString("vi-VN") + " VND" : "--"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Mã phản hồi</span>
                <span className="font-semibold text-[#0F172A]">{responseCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">Mã giao dịch</span>
                <span className="font-semibold text-[#0F172A]">{queryTransactionNo}</span>
              </div>
              {paidAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Thời gian thanh toán</span>
                  <span className="font-semibold text-[#0F172A]">{new Date(paidAt).toLocaleString("vi-VN")}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {status === "failed" && bookingId && (
                <button
                  onClick={() => router.push(`/booking/payment?bookingId=${bookingId}`)}
                  className="flex-1 rounded-lg bg-[#2563EB] px-4 py-2 text-white text-sm font-semibold hover:bg-[#1D4ED8]"
                >
                  Thử lại thanh toán
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  status === "failed" 
                    ? "border border-[#2563EB] text-[#1D4ED8] bg-[#EEF2FF] hover:bg-[#E0E7FF]"
                    : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                }`}
              >
                Về trang chủ
              </button>
              {bookingId && status === "success" && (
                <button
                  onClick={() => router.push(`/booking/${bookingId}`)}
                  className="rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#1D4ED8] bg-[#EEF2FF] hover:bg-[#E0E7FF]"
                >
                  Xem đơn đặt phòng
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
