"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { LocationSearch } from "@/components/LocationSearch";
import { DateRangePicker } from "@/components/DateRangePicker";
import { RoomGuestPicker } from "@/components/RoomGuestPicker";
import Header from "@/components/Header";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { FeaturedHotels } from "@/components/FeaturedHotels";
import { useAuth } from "@/hooks/useAuth";
import { CustomerOnlyRoute } from "@/components/CustomerOnlyRoute";
import type { Hotel } from "@/lib/api/hotels";
import type { City } from "@/lib/api/cities";

const heroBg = "/hero.png";
const heroBadgeIcon = "https://www.figma.com/api/mcp/asset/7f84ae0a-9727-4a93-bfaf-6464772bb8df";
const trendingDestinations = [
  {
    title: "Hà Nội",
    description: "Phố cổ, hồ Hoàn Kiếm và ẩm thực đường phố.",
    price: 1280000,
    img: "https://images.unsplash.com/photo-1616486410185-81af2d32a2af?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Đà Nẵng",
    description: "Biển Mỹ Khê, Bà Nà Hills và cầu Rồng rực rỡ.",
    price: 1580000,
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Đà Lạt",
    description: "Không khí mát lạnh, đồi thông và những quán cà phê view đẹp.",
    price: 1120000,
    img: "https://images.unsplash.com/photo-1626608017817-211d7c48177d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Phú Quốc",
    description: "Biển xanh, hải sản tươi và resort ven biển sang trọng.",
    price: 1980000,
    img: "https://images.unsplash.com/photo-1730714103959-5d5a30acf547?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Nha Trang",
    description: "Vịnh biển trong xanh, lặn ngắm san hô và phố ẩm thực.",
    price: 1450000,
    img: "https://images.unsplash.com/photo-1533002832-1721d16b4bb9?auto=format&fit=crop&w=1200&q=80",
  },
];

const weekendDeals = [
  {
    title: "Seaside Serenity Villa",
    location: "Amalfi Coast, Italy",
    img: "https://www.figma.com/api/mcp/asset/f5c038c0-ca1d-4809-867f-2dcaf91ee117",
    price: 175,
    oldPrice: 250,
    badge: "Getaway Deal",
  },
  {
    title: "Tropical Bungalow",
    location: "Phuket, Thailand",
    img: "https://www.figma.com/api/mcp/asset/92432cce-d1f9-4cb4-a6ac-4ca5e5d0efde",
    price: 160,
    oldPrice: 210,
    badge: "Getaway Deal",
  },
  {
    title: "Santorini Sunset Suites",
    location: "Santorini, Greece",
    img: "https://www.figma.com/api/mcp/asset/283bff3d-f087-490d-ad93-579654a42326",
    price: 255,
    oldPrice: 300,
    badge: "Getaway Deal",
  },
  {
    title: "Marbella Resort",
    location: "Marbella, Spain",
    img: "https://www.figma.com/api/mcp/asset/d28cca78-2a60-42d5-811c-e8e373e46cb2",
    price: 190,
    oldPrice: 280,
    badge: "Getaway Deal",
  },
];

const sights = [
  {
    title: "Sassnitz",
    flag: "FI",
    img: "https://www.figma.com/api/mcp/asset/84e31ecc-a7b4-4131-9469-7b83c1738807",
  },
  {
    title: "Binz",
    flag: "VN",
    img: "https://www.figma.com/api/mcp/asset/50e42bff-300a-416c-95eb-e9da8ff9a5df",
  },
  {
    title: "Sagard",
    flag: "PM",
    img: "https://www.figma.com/api/mcp/asset/adf55d99-7bf7-44f9-a4e7-8a2b0e00fb73",
  },
  {
    title: "Bergen",
    flag: "SH",
    img: "https://www.figma.com/api/mcp/asset/78903dff-3dbd-415e-ae50-6a01ffb02973",
  },
  {
    title: "Freedom",
    flag: "UM",
    img: "https://www.figma.com/api/mcp/asset/2b160778-cd6b-4961-8b5d-850044ab76de",
  },
];

const videos = [
  {
    title: "Maldives, Asia",
    img: "https://www.figma.com/api/mcp/asset/595c2184-fd5e-4f4f-96fd-042b3a549661",
  },
  {
    title: "Phuket, Thailand",
    img: "https://www.figma.com/api/mcp/asset/1ae69f10-3ed4-4c8a-9ad2-5073611d804e",
  },
  {
    title: "Maui, Hawaii",
    img: "https://www.figma.com/api/mcp/asset/9db2a657-6ecd-4414-ba65-f1435800b031",
  },
];

const homes = [
  {
    title: "Azure Horizon Hotel",
    location: "Nice, France",
    img: "https://www.figma.com/api/mcp/asset/bd73382c-6219-4d6a-a1eb-7facd8113532",
    price: 165,
    rating: "5.0",
  },
  {
    title: "Palm Grove House",
    location: "Algarve, Portugal",
    img: "https://www.figma.com/api/mcp/asset/7a052239-8711-4d24-a28f-e08e335f474c",
    price: 175,
    rating: "5.0",
  },
  {
    title: "Casa Tranquila Guesthouse",
    location: "Tulum, Mexico",
    img: "https://www.figma.com/api/mcp/asset/421c4c70-fdfe-413d-b97c-34c010b93181",
    price: 145,
    rating: "4.8",
  },
  {
    title: "Villa San Martino Guesthouse",
    location: "Amalfi Coast, Italy",
    img: "https://www.figma.com/api/mcp/asset/d28cca78-2a60-42d5-811c-e8e373e46cb2",
    price: 190,
    rating: "4.8",
  },
];

const thingsToDo = [
  "Sagrada Familia",
  "Park Guell",
  "Casa Mila",
  "Sacred Heart Temple",
  "Arc de Triomf",
  "Casa Batllo",
];

const propertyTypes = ["Hotels", "Apartments", "Villas", "Cabins", "Glamping", "Domes"];

const testimonials = [
  {
    name: "Sophie Turner",
    location: "London, UK",
    text: "Tripto delivered a seamless booking experience and the villa looked exactly like the photos.",
  },
  {
    name: "Diego Martinez",
    location: "Mexico City",
    text: "Loved the curated deals for weekend escapes. Great pricing and zero surprises on arrival.",
  },
  {
    name: "Aisha Rahman",
    location: "Dubai, UAE",
    text: "Super flexible cancellation and quick confirmations. Perfect for last-minute planners like me.",
  },
];

export default function Home() {
  const router = useRouter();
  const { isLoading, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupVariant, setSignupVariant] = useState<'user' | 'host'>('user');

  const handleEditProfile = () => {
    router.push("/personal-data");
  };

  if (isLoading) return null;

  return (
    <CustomerOnlyRoute>
      <div className="bg-white text-[#121316]">
      <Header
        onLogin={() => setShowLogin(true)}
        onSignup={() => { setSignupVariant('user'); setShowSignup(true); }}
        onEditProfile={handleEditProfile}
      />
      <Hero />
      {showLogin ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
          <LoginModal
            onClose={() => setShowLogin(false)}
            onOpenHostSignup={() => { setShowLogin(false); setSignupVariant('host'); setShowSignup(true); }}
          />
        </div>
      ) : null}
      {showSignup ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
          <SignupModal
            variant={signupVariant}
            onClose={() => setShowSignup(false)}
          />
        </div>
      ) : null}
      <div className="relative z-10 bg-white">
        <main className="mx-auto flex max-w-screen-xl flex-col gap-16 px-4 pb-20 pt-10 md:px-8 lg:px-10">
          <WhyTripto />
          <TrendingDestinations />
          <FeaturedHotels />
        </main>
      </div>
      <Footer />
      </div>
    </CustomerOnlyRoute>
  );
}

function Hero() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const handleSearch = () => {
    // Validate required fields
    if (!selectedCity && !selectedHotel) {
      alert("Vui lòng chọn điểm đến hoặc khách sạn");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      alert("Vui lòng chọn ngày nhận và trả phòng");
      return;
    }

    // Format date as YYYY-MM-DD without timezone shift
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Build search params
    const searchParams = new URLSearchParams({
      checkIn: formatDateLocal(checkInDate),
      checkOut: formatDateLocal(checkOutDate),
      rooms: rooms.toString(),
      adults: adults.toString(),
      children: children.toString(),
    });

    if (selectedHotel) {
      searchParams.set("hotelName", selectedHotel.name);
    } else if (selectedCity) {
      searchParams.set("cityId", selectedCity.id);
      searchParams.set("cityName", selectedCity.name);
    }

    // Navigate to search results page
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <section className="relative overflow-visible bg-gradient-to-b from-[#0057FF] to-[#0f1829] -mt-24">
      <div className="absolute inset-0 -top-24 z-0">
        <img src={heroBg} alt="Beach resort" className="h-[calc(100%+96px)] w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/20 to-black/10" />
      </div>
      <div className="relative mx-auto flex max-w-screen-xl flex-col gap-8 px-4 pb-24 pt-40 md:px-8 md:pb-28 md:pt-44 lg:px-10">
        <div className="flex flex-col items-center gap-2 text-white md:max-w-4xl md:self-center -mt-6 md:-mt-8">
          <h1 className="text-4xl font-bold leading-tight text-center md:text-5xl md:leading-[72px]">Mỗi chuyến đi là một trải nghiệm</h1>
          <p className="text-lg font-bold text-center md:text-2xl md:max-w-2xl">Hãy để chúng tôi giúp bạn chọn nơi lưu trú hoàn hảo</p>
        </div>

        <div className="relative w-full max-w-6xl md:mx-auto mt-15 z-20">
          <div className="absolute -top-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[32px] bg-black/30 backdrop-blur-[21.8px] px-4 py-2 text-[13px] font-medium text-white shadow-xl">
            {[
              { label: "Hotel", active: true, iconPath: "M6 19h12v2H6v-2Zm10-8H8v6h8v-6Zm2-8H6v2h12V3ZM4 1h16c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H4c-1.11 0-2-.9-2-2V3c0-1.1.89-2 2-2Z" },
              { label: "House", iconPath: "M3 10.5 12 3l9 7.5V20c0 .55-.45 1-1 1h-5v-5H9v5H4c-.55 0-1-.45-1-1v-9.5Zm8-4.69-6 5V19h2v-5h6v5h2v-8.19l-6-5Z" },
              { label: "Guest House", iconPath: "M4 10 12 4l8 6v10H4V10Zm2 2v6h12v-6l-6-4.5L6 12Z" },
              { label: "Cabins", iconPath: "M4 12 12 5l8 7v7h-4v-4H8v4H4v-7Zm8-5.3L6 12.23V16h2v-2h8v2h2v-3.77L12 6.7Z" },
              { label: "Glamping", iconPath: "M12 3 2 19h20L12 3Zm0 4.3 5.46 9.2H6.54L12 7.3Z" },
              { label: "Domes", iconPath: "M12 4a8 8 0 0 0-8 8v5h16v-5a8 8 0 0 0-8-8Zm0 2a6 6 0 0 1 6 6v3H6v-3a6 6 0 0 1 6-6Z" },
            ].map(({ label, active, iconPath }) => (
              <HeroCategoryChip key={label} label={label} iconPath={iconPath} active={active} />
            ))}
          </div>

          <div className="relative overflow-visible rounded-3xl bg-white shadow-2xl backdrop-blur z-30">
            <div className="grid grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[1fr_2fr_1.2fr_auto] md:gap-0 md:px-2 md:py-3 items-stretch">
              <LocationSearch
                onCitySelect={(city) => {
                  setSelectedCity(city);
                  if (city) setSelectedHotel(null);
                }}
                onHotelSelect={(hotel) => {
                  setSelectedHotel(hotel);
                  if (hotel) setSelectedCity(null);
                }}
              />
              <DateRangePicker
                checkInLabel="Nhận phòng"
                checkOutLabel="Trả phòng"
                onDatesChange={(checkIn, checkOut) => {
                  setCheckInDate(checkIn);
                  setCheckOutDate(checkOut);
                }}
              />
              <RoomGuestPicker 
                onSelectionChange={(r, a, c) => {
                  setRooms(r);
                  setAdults(a);
                  setChildren(c);
                }}
              />
              <button 
                onClick={handleSearch}
                className="flex h-full w-16 items-center justify-center gap-2 rounded-2xl bg-[#0057FF] px-2 text-base font-semibold text-white shadow-lg transition hover:bg-[#0046CC] md:h-[72px] md:w-20 md:rounded-none md:rounded-r-3xl"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" fill="white"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoginModal({ onClose, onOpenHostSignup }: { onClose: () => void; onOpenHostSignup: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.login({
        usernameOrEmail: email,
        password,
      });

      localStorage.setItem("token", response.token);
      await login(response);

      const role = response.role?.toLowerCase?.() || "";
      if (role.includes("admin")) {
        router.push("/admin/dashboard");
      } else if (role.includes("owner") || role.includes("host")) {
        router.push("/host/dashboard");
      } else {
        // Reload page to update UI
        location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
      {showForgotPassword ? (
        <ForgotPasswordModal 
          onBack={() => setShowForgotPassword(false)} 
          onClose={onClose}
        />
      ) : (
        <>
          <div className="relative flex items-center justify-center pb-2">
            <p className="text-sm font-semibold text-[#2B3037]">Đăng nhập hoặc đăng ký</p>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-0 top-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
              onClick={onClose}
            >
              x
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-xl font-bold text-[#1F2226]">Chào mừng đến với CheckInn</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2B3037]">Email address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#2B3037]">Mật khẩu</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-semibold text-[#0057FF] hover:underline transition"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Tiếp tục"}
            </button>

            <button
              type="button"
              onClick={onOpenHostSignup}
              className="w-full rounded-xl border border-[#0057FF] bg-white py-3 text-sm font-semibold text-[#0057FF] shadow-sm hover:bg-[#0057FF] hover:text-white"
            >
              Bạn là chưa có tài khoản? Đăng ký ngay
            </button>

            <div className="relative py-2">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#E0E2E7]" />
              <span className="relative mx-auto block w-fit bg-white px-3 text-sm font-semibold text-[#656F81]">hoặc</span>
            </div>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-[#CED3DD] px-4 py-3 text-sm font-semibold text-[#2B3037] shadow-sm transition hover:border-[#0057FF] hover:text-[#0057FF]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E0E2E7] bg-white text-base font-bold text-[#DB4437]">G</span>
              <span>Tiếp tục với Google</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ForgotPasswordModal({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otpExpiryTime, setOtpExpiryTime] = useState<number>(0);
  const [otpTimeRemaining, setOtpTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (otpExpiryTime <= 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((otpExpiryTime - now) / 1000));
      setOtpTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiryTime]);

  const handleSendReset = async () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setStep('otp');
        setOtpExpiryTime(Date.now() + 10 * 60 * 1000);
      }
    } catch (err: any) {
      setError(err.message || "Không thể gửi yêu cầu đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join("");
    if (!otpValue || otpValue.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số mã OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.verifyOtp(email, otpValue);
      if (response.verified) {
        setStep('password');
      } else {
        setError(response.message || "Xác thực OTP thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Xác thực OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu");
      setResetSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu không khớp");
      setResetSuccess(false);
      return;
    }

    setLoading(true);
    setError("");
    setResetSuccess(false);

    try {
      const otpValue = otpDigits.join("");
      const response = await authApi.resetPassword(email, otpValue, newPassword);
      console.log("Reset password response:", response);
      
      // Check if response is successful (either response.success is true or response exists)
      if (response && (response.success || response.success === undefined)) {
        setResetSuccess(true);
        setError("");
        // Redirect to login after 3 seconds to give time to see the message
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setResetSuccess(false);
        setError(response.message || "Không thể đặt lại mật khẩu");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setResetSuccess(false);
      setError(err.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  if (step === 'email') {
    return (
      <>
        <div className="relative flex items-center justify-center pb-4">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
          >
            ←
          </button>
          <p className="text-sm font-semibold text-[#2B3037]">Quên mật khẩu</p>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-[#1F2226]">Đặt lại mật khẩu của bạn</p>
            <p className="text-sm text-[#656F81]">Nhập email liên kết với tài khoản của bạn</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#2B3037]">Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSendReset}
            disabled={loading}
            className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi mã xác thực"}
          </button>
        </div>
      </>
    );
  }

  if (step === 'otp') {
    return (
      <>
        <div className="relative flex items-center justify-center pb-4">
          <button
            type="button"
            onClick={() => setStep('email')}
            className="absolute left-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
          >
            ←
          </button>
          <p className="text-sm font-semibold text-[#2B3037]">Xác thực OTP</p>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-[#1F2226]">Nhập mã xác thực</p>
            <p className="text-sm text-[#656F81]">Chúng tôi đã gửi mã 6 số đến {email}</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#2B3037] block text-center">Mã xác thực OTP</label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`forgot-otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 border-[#E0E2E7] bg-[#F7F8FA] text-[#2B3037] focus:border-[#0057FF] focus:bg-white focus:outline-none transition"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-xs text-center text-[#8B94A4]">Mã hết hạn trong</p>
              <p className={`text-xs font-semibold ${
                otpTimeRemaining <= 60 ? 'text-red-600' : 'text-[#0057FF]'
              }`}>
                {Math.floor(otpTimeRemaining / 60)}:{String(otpTimeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otpDigits.some(d => !d) || loading}
            className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
          >
            {loading ? "Đang xác thực..." : "Tiếp tục"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative flex items-center justify-center pb-4">
        <button
          type="button"
          onClick={() => setStep('otp')}
          className="absolute left-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
        >
          ←
        </button>
        <p className="text-sm font-semibold text-[#2B3037]">Đặt mật khẩu mới</p>
        <button
          type="button"
          aria-label="Close"
          className="absolute right-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xl font-bold text-[#1F2226]">Mật khẩu mới</p>
          <p className="text-sm text-[#656F81]">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {resetSuccess && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-green-700">
            <div className="font-semibold">Đặt lại mật khẩu thành công!</div>
            <div className="text-sm mt-1">Bạn sẽ được chuyển đến trang đăng nhập để đăng nhập với mật khẩu mới...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Mật khẩu mới</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Xác nhận mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={loading}
          className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </div>
    </>
  );
}

function SignupModal({ onClose, variant = 'user' }: { onClose: () => void; variant?: 'user' | 'host' }) {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<'user' | 'host'>(variant);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [otpExpiryTime, setOtpExpiryTime] = useState<number>(0);
  const [otpTimeRemaining, setOtpTimeRemaining] = useState<number>(0);

  useEffect(() => {
    setSelectedVariant(variant);
  }, [variant]);

  useEffect(() => {
    if (otpExpiryTime <= 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((otpExpiryTime - now) / 1000));
      setOtpTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiryTime]);

  const handleSubmit = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call appropriate API based on variant
      const registerData = {
        fullName,
        username,
        email,
        password,
      };

      const response = selectedVariant === 'host' 
        ? await authApi.registerOwner(registerData)
        : await authApi.register(registerData);

      setAuthResponse(response);
      setRegisteredEmail(email);
      setStep('verify');
      setOtpCode("");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setOtpExpiryTime(Date.now() + 10 * 60 * 1000);
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join("");
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Vui lòng nhập đầy đủ 6 số mã OTP");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await authApi.verifyOtp(registeredEmail, otpValue);
      
      if (response.verified) {
        localStorage.setItem("token", authResponse.token);
        await login(authResponse);

        const role = authResponse.role?.toLowerCase?.() || "";
        if (role.includes("admin")) {
          router.push("/admin/dashboard");
        } else if (role.includes("owner") || role.includes("host") || selectedVariant === "host") {
          router.push("/host/dashboard");
        } else {
          location.reload();
        }
      } else {
        setOtpError(response.message || "Xác thực OTP thất bại");
      }
    } catch (err: any) {
      setOtpError(err.message || "Xác thực OTP thất bại");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");

    try {
      const response = await authApi.resendOtp(registeredEmail);
      if (response.success) {
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError("Mã OTP đã được gửi lại! Vui lòng kiểm tra email của bạn.");
        setOtpExpiryTime(Date.now() + 10 * 60 * 1000);
      } else {
        setOtpError(response.message || "Không thể gửi lại OTP");
      }
    } catch (err: any) {
      setOtpError(err.message || "Không thể gửi lại OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtpDigits = pastedData.split("").concat(["", "", "", "", "", ""]).slice(0, 6);
    setOtpDigits(newOtpDigits);
  };

  if (step === 'verify') {
    return (
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
        <div className="relative flex items-center justify-center pb-2">
          <p className="text-sm font-semibold text-[#2B3037]">Xác thực Email</p>
          <button
            type="button"
            aria-label="Close"
            className="absolute right-0 top-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#0057FF"/>
              </svg>
            </div>
            <p className="text-xl font-bold text-[#1F2226]">Nhập mã xác thực</p>
            <p className="text-sm text-[#656F81]">
              Chúng tôi đã gửi mã xác thực 6 số đến<br />
              <span className="font-semibold text-[#2B3037]">{registeredEmail}</span>
            </p>
          </div>

          {otpError && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              otpError.includes("gửi lại") || otpError.includes("successfully") 
                ? "bg-green-50 text-green-600" 
                : "bg-red-50 text-red-600"
            }`}>
              {otpError}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#2B3037] block text-center">Mã xác thực OTP</label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-lg border-2 border-[#E0E2E7] bg-[#F7F8FA] text-[#2B3037] focus:border-[#0057FF] focus:bg-white focus:outline-none transition"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-xs text-center text-[#8B94A4]">
                Mã OTP hết hạn trong
              </p>
              <p className={`text-xs font-semibold ${
                otpTimeRemaining <= 60 ? 'text-red-600' : 'text-[#0057FF]'
              }`}>
                {Math.floor(otpTimeRemaining / 60)}:{String(otpTimeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otpLoading || otpDigits.some(d => !d)}
            className="w-full rounded-xl bg-[#0057FF] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {otpLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xác thực...
              </span>
            ) : (
              "Xác thực & Tiếp tục"
            )}
          </button>

          <div className="flex items-center justify-center gap-2 pt-2">
            <p className="text-sm text-[#656F81]">Không nhận được mã?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={otpLoading}
              className="text-sm font-semibold text-[#0057FF] hover:underline disabled:opacity-50 transition"
            >
              Gửi lại
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep('register');
              setOtpDigits(["", "", "", "", "", ""]);
              setOtpError("");
            }}
            className="w-full text-sm text-[#656F81] hover:text-[#0057FF] transition flex items-center justify-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
            Quay lại đăng ký
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
      <div className="relative flex items-center justify-center pb-2">
        <p className="text-sm font-semibold text-[#2B3037]">
          {selectedVariant === 'host' ? 'Đăng ký chủ khách sạn' : 'Đăng ký tài khoản'}
        </p>
        <button
          type="button"
          aria-label="Close"
          className="absolute right-0 top-0 text-lg font-semibold text-[#8B94A4] transition hover:text-[#2B3037]"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full justify-center gap-2 rounded-2xl bg-[#F1F2F5] p-1">
            <button
              type="button"
              onClick={() => setSelectedVariant('user')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                selectedVariant === 'user'
                  ? 'bg-white text-[#0057FF] shadow-sm'
                  : 'text-[#656F81] hover:text-[#2B3037]'
              }`}
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => setSelectedVariant('host')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                selectedVariant === 'host'
                  ? 'bg-white text-[#0057FF] shadow-sm'
                  : 'text-[#656F81] hover:text-[#2B3037]'
              }`}
            >
              Chủ khách sạn
            </button>
          </div>
          <p className="text-xs font-medium text-[#656F81]">
            Chọn loại tài khoản phù hợp với bạn.
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#1F2226]">
            {selectedVariant === 'host' ? 'Tạo tài khoản chủ khách sạn' : 'Tạo tài khoản khách hàng'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Họ và tên</label>
          <input
            type="text"
            placeholder="Nhập họ và tên của bạn"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Tên đăng nhập</label>
          <input
            type="text"
            placeholder="Chọn tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Địa chỉ email</label>
          <input
            type="email"
            placeholder="Nhập địa chỉ email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Xác nhận mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu của bạn"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Tiếp tục"}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#E0E2E7]" />
          <span className="relative mx-auto block w-fit bg-white px-3 text-sm font-semibold text-[#656F81]">hoặc</span>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-[#CED3DD] px-4 py-3 text-sm font-semibold text-[#2B3037] shadow-sm transition hover:border-[#0057FF] hover:text-[#0057FF]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E0E2E7] bg-white text-base font-bold text-[#DB4437]">G</span>
          <span>Tiếp tục với Google</span>
        </button>
      </div>
    </div>
  );
}

function CategoryChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-[#121316] bg-[#121316] text-white'
          : 'border-[#DDDFE3] bg-white text-[#383E48] hover:border-[#121316] hover:text-[#121316]'
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

function HeroCategoryChip({ label, iconPath, active }: { label: string; iconPath: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-white text-[#121316] shadow-sm' : 'text-white/90 hover:text-white'
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={iconPath} fill={active ? '#121316' : 'currentColor'} />
      </svg>
      <span>{label}</span>
    </button>
  );
}

function SearchField({ title, subtitle, iconPath, className }: { title: string; subtitle: string; iconPath: string; className?: string }) {
  return (
    <div className={`flex min-h-[72px] min-w-[180px] h-full flex-1 items-center gap-5 px-3 py-3 md:px-4 md:py-4 ${className ?? ''}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1">
        <path d={iconPath} fill="#0057FF" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-[#2B3037]">{title}</span>
        <span className="text-sm text-[#8B94A4]">{subtitle}</span>
      </div>
    </div>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
        active
          ? "border-[#0057FF] bg-[#0057FF] text-white"
          : "border-[#DDDFE3] bg-white text-[#383E48]"
      }`}
    >
      {label}
    </span>
  );
}

function SectionHeader({ id, title, action }: { id?: string; title: string; action?: React.ReactNode }) {
  return (
    <div id={id} className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-3xl font-bold text-[#121316] md:text-4xl md:leading-[52px]">{title}</h2>
      {action}
    </div>
  );
}

function WhyTripto() {
  const features = [
    {
      title: "Không phí ẩn",
      desc: "Giá cả minh bạch, không có bất ngờ khi thanh toán.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" fill="none" className="size-8">
          <path d="M27.9993 4.66669C15.1123 4.66669 4.66602 15.113 4.66602 28C4.66602 40.887 15.1123 51.3334 27.9993 51.3334C40.8863 51.3334 51.3327 40.887 51.3327 28C51.3327 15.113 40.8863 4.66669 27.9993 4.66669ZM33.1397 37.0277C32.1947 37.9727 30.993 38.5489 29.698 38.7356V39.6667C29.698 40.6327 28.914 41.4167 27.948 41.4167C26.982 41.4167 26.198 40.6327 26.198 39.6667V38.731C23.531 38.297 21.4147 36.1481 21.102 33.3808C20.9947 32.4194 21.6853 31.5538 22.6467 31.4465C23.594 31.3275 24.4737 32.0298 24.581 32.9911C24.7304 34.3211 25.8504 35.3244 27.185 35.3244H28.8184C29.5137 35.3244 30.1694 35.0513 30.6664 34.5543C31.1634 34.0573 31.4363 33.4016 31.4363 32.7063C31.4363 31.5046 30.6197 30.4616 29.4507 30.1653L25.6987 29.2345C24.3687 28.8961 23.1833 28.1237 22.3526 27.0527C21.5266 26.0073 21.0647 24.668 21.0647 23.2983C21.0647 20.2627 23.293 17.7544 26.198 17.2807V16.3334C26.198 15.3674 26.982 14.5834 27.948 14.5834C28.914 14.5834 29.698 15.3674 29.698 16.3334V17.2573C32.414 17.6517 34.584 19.8146 34.899 22.6193C35.0063 23.5806 34.3157 24.4462 33.3544 24.5536C32.3837 24.6656 31.5274 23.9703 31.42 23.0089C31.2707 21.6789 30.1507 20.6756 28.816 20.6756H27.1827C25.7383 20.6756 24.5647 21.8494 24.5647 23.2938C24.5647 23.8794 24.7583 24.4486 25.1083 24.8919C25.477 25.3679 25.9717 25.6901 26.5503 25.8347L30.3023 26.7656C33.0323 27.4562 34.9363 29.8971 34.9363 32.7017C34.934 34.3351 34.297 35.8704 33.1397 37.0277Z" fill="#0057FF"/>
        </svg>
      )
    },
    {
      title: "Đặt phòng tức thì",
      desc: "Nhận xác nhận ngay sau khi bạn đặt.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" fill="none" className="size-8">
          <path d="M28.0422 4.66669C22.8155 7.25902 18.6667 9.33335 7 11.6667C7 14.3197 7 22.6378 7 25.4075C7 40.9638 20.223 48.741 28 51.3334C35.777 48.741 49 40.9638 49 25.4075C49 22.5492 49 14.4527 49 11.6667C37.3333 9.33335 33.1848 7.25902 28.0422 4.66669ZM36.2646 24.5701L26.9313 33.9034C26.5906 34.2441 26.1426 34.4167 25.6946 34.4167C25.2466 34.4167 24.7985 34.2464 24.4578 33.9034L19.7912 29.2368C19.1075 28.5531 19.1075 27.4447 19.7912 26.761C20.4748 26.0773 21.5833 26.0773 22.2669 26.761L25.6969 30.1909L33.7935 22.0943C34.4771 21.4107 35.5855 21.4107 36.2692 22.0943C36.9529 22.778 36.9483 23.8864 36.2646 24.5701Z" fill="#0057FF"/>
        </svg>
      )
    },
    {
      title: "Linh hoạt",
      desc: "Hủy miễn phí cho nhiều danh sách để yên tâm.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" fill="none" className="size-8">
          <path d="M29.75 11.6667V6.41669L40.25 16.9167H35C31.3133 16.9167 29.75 15.3534 29.75 11.6667ZM41.7898 27.3233L27.8599 41.3467C27.2065 42 26.8333 42.8867 26.8333 43.82V45.9667C26.8333 46.3634 26.5299 46.6667 26.1332 46.6667H14C9.33333 46.6667 7 44.3334 7 39.6667V11.6667C7 7.00002 9.33333 4.66669 14 4.66669H26.25V11.6667C26.25 17.3134 29.3533 20.4167 35 20.4167H42V26.8334C42 27.02 41.9298 27.2067 41.7898 27.3233ZM18.0833 35C18.0833 34.034 17.2993 33.25 16.3333 33.25C15.3673 33.25 14.5833 34.034 14.5833 35C14.5833 35.966 15.3673 36.75 16.3333 36.75C17.2993 36.75 18.0833 35.966 18.0833 35ZM18.0833 25.6667C18.0833 24.7007 17.2993 23.9167 16.3333 23.9167C15.3673 23.9167 14.5833 24.7007 14.5833 25.6667C14.5833 26.6327 15.3673 27.4167 16.3333 27.4167C17.2993 27.4167 18.0833 26.6327 18.0833 25.6667ZM27.4167 35C27.4167 34.034 26.6327 33.25 25.6667 33.25H22.1667C21.2007 33.25 20.4167 34.034 20.4167 35C20.4167 35.966 21.2007 36.75 22.1667 36.75H25.6667C26.6327 36.75 27.4167 35.966 27.4167 35ZM34.4167 25.6667C34.4167 24.7007 33.6327 23.9167 32.6667 23.9167H22.1667C21.2007 23.9167 20.4167 24.7007 20.4167 25.6667C20.4167 26.6327 21.2007 27.4167 22.1667 27.4167H32.6667C33.6327 27.4167 34.4167 26.6327 34.4167 25.6667ZM30.3333 43.82V49H35.5133L44.8466 39.7133L39.62 34.4867L30.3333 43.82ZM48.3933 33.25L46.0833 30.94C45.2667 30.1234 43.96 30.1234 43.1433 30.94L41.2532 32.8533L46.4798 38.08L48.3933 36.19C49.21 35.3734 49.21 34.0667 48.3933 33.25Z" fill="#0057FF"/>
        </svg>
      )
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold leading-[48px] text-[#121316] md:text-4xl">Tại Sao Du Khách Tin Tưởng Tripto</h2>
      </div>
      <div className="relative grid gap-6 md:grid-cols-3">
        {/* Curved line connecting first and second icon - bezier curve like your example */}
        <svg className="absolute left-[18%] hidden md:block pointer-events-none" width="360" height="160" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 40 130 C 240 190, 260 10, 460 40" stroke="#99BDFF" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="1"/>
          <circle cx="40" cy="130" r="3" fill="#0057FF"/>
          <circle cx="460" cy="40" r="3" fill="#0057FF"/>
        </svg>
        
        {/* Curved line connecting second and third icon - bezier curve like your example */}
        <svg className="absolute left-[52%] hidden md:block pointer-events-none" width="360" height="160" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 40 130 C 240 190, 260 10, 460 40" stroke="#99BDFF" strokeWidth="3" strokeDasharray="3 3" fill="none" opacity="1"/>
          <circle cx="40" cy="130" r="3" fill="#0057FF"/>
          <circle cx="460" cy="40" r="3" fill="#0057FF"/>
        </svg>

        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-4 p-8 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#E8EFFC] to-[#D8E5FF]">
              {feature.icon &&
                typeof feature.icon === 'object' && feature.icon.type === 'svg'
                  ? (
                      <feature.icon.type {...feature.icon.props} width={48} height={48} className="size-12" />
                    )
                  : feature.icon
              }
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-[#121316]">{feature.title}</p>
              <p className="text-sm text-[#656F81] leading-relaxed">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingDestinations() {
  const router = useRouter();

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDestinationClick = (title: string) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const params = new URLSearchParams({
      cityName: title,
      checkIn: formatDateLocal(today),
      checkOut: formatDateLocal(tomorrow),
      rooms: "1",
      adults: "1",
      children: "0",
    });

    router.push(`/search?${params.toString()}`);
  };

  const layoutClasses = [
    "sm:col-span-2 lg:col-span-3 lg:row-span-2",
    "sm:col-span-2 lg:col-span-3 lg:row-span-2",
    "lg:col-span-2",
    "lg:col-span-2",
    "lg:col-span-2",
  ];
  const heightClasses = [
    "h-[200px] sm:h-[240px] lg:h-[320px]",
    "h-[200px] sm:h-[240px] lg:h-[320px]",
    "h-[200px] sm:h-[200px] lg:h-[240px]",
    "h-[200px] sm:h-[200px] lg:h-[240px]",
    "h-[200px] sm:h-[200px] lg:h-[240px]",
  ];

  return (
    <section className="flex flex-col gap-6" id="trending">
      <SectionHeader
        title="Điểm đến đang thịnh hành"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-stretch">
        {trendingDestinations.map((item, idx) => (
          <div
            key={item.title}
            role="button"
            tabIndex={0}
            onClick={() => handleDestinationClick(item.title)}
            className={`group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer ${heightClasses[idx] ?? "h-[200px]"} ${layoutClasses[idx] ?? "lg:col-span-2"}`}
          >
            <img src={item.img} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 space-y-3 bg-gradient-to-t from-black to-transparent p-6 text-white">
              <p className="text-2xl font-bold">{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryFilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-[#121316] bg-[#121316] text-white"
          : "border-[#121316] bg-white text-[#121316] hover:bg-[#121316] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function WeekendDeals() {
  return (
    <section className="flex flex-col gap-6" id="weekend">
      <SectionHeader
        title="Deals for the Weekend"
        action={
          <div className="flex items-center gap-2">
            <NavCircle disabled />
            <NavCircle active />
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {weekendDeals.map((deal) => (
          <div key={deal.title} className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#DDDFE3] bg-white shadow-sm hover:shadow-xl hover:border-[#0057FF] transition-all duration-300">
            <div className="relative h-48 overflow-hidden group">
              <img src={deal.img} alt={deal.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute right-4 top-4 rounded-full bg-white/90 backdrop-blur p-2.5 shadow-md hover:bg-white transition-colors cursor-pointer">
                <span className="text-lg">♡</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
              <span className="inline-flex w-fit rounded-full bg-gradient-to-r from-[#049153] to-[#05a860] px-3 py-1 text-xs font-bold text-white shadow-sm">{deal.badge}</span>
              <div className="space-y-1">
                <p className="text-lg font-bold text-[#1F2226]">{deal.title}</p>
                <p className="text-sm font-medium text-[#656F81]">{deal.location}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-right text-sm">
                <span className="line-through text-[#8B94A4]">{deal.oldPrice.toLocaleString('vi-VN')} ₫</span>
                <span className="text-lg font-bold text-[#0057FF]">{deal.price.toLocaleString('vi-VN')} ₫</span>
                <span className="text-xs text-[#8B94A4]">mỗi đêm</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TravelMore() {
  const tags = [
    "10% discounts on stays",
    "Travel off season",
    "Exclusive deals",
    "Weekend special",
    "App-exclusive",
    "Long stay deals",
    "Earn points, get rewards",
    "Last-minute escape",
  ];

  return (
    <section className="space-y-4">
      <SectionHeader title="Travel more, spend less" />
      <div className="grid gap-3 md:grid-cols-4">
        {tags.map((tag) => (
          <div
            key={tag}
            className="rounded-2xl border border-[#0057FF] bg-white px-4 py-3 text-sm font-medium text-[#2B3037] shadow-sm"
          >
            {tag}
          </div>
        ))}
      </div>
    </section>
  );
}

function TopSights() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Top Sights to See" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sights.map((sight) => (
          <div key={sight.title} className="group relative h-64 overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <img src={sight.img} alt={sight.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur px-4 py-2.5 text-sm font-bold text-[#121316] shadow-lg">
              {sight.title}
              <span className="ml-1 rounded-lg bg-[#0057FF] px-2.5 py-1 text-xs font-bold text-white">{sight.flag}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopThingsToDo() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Top Things to Do in Barcelona" />
      <div className="flex flex-wrap gap-3 text-sm font-medium text-[#383E48]">
        <CategoryChip label="Explore" active />
        <CategoryChip label="Beach" />
        <CategoryChip label="Museum" />
        <CategoryChip label="Shows" />
        <CategoryChip label="Food" />
        <CategoryChip label="Night life" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {thingsToDo.map((item) => (
          <div key={item} className="group relative h-48 overflow-hidden rounded-xl bg-white shadow-md">
            <img
              src="https://www.figma.com/api/mcp/asset/fa17fbe2-67a5-4122-9a31-99140cda66a4"
              alt={item}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 left-3 text-sm font-semibold text-white">{item}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Motion() {
  return (
    <section className="space-y-6">
      <SectionHeader title="Explore Tripto in Motion" />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border-4 border-[#99BDFF] shadow-xl">
          <img src="https://www.figma.com/api/mcp/asset/d1bdbc09-32ae-40ed-8a80-1df26a8f5a6c" alt="Main video" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute left-10 top-12 max-w-xl space-y-4 text-white">
            <p className="text-4xl font-extrabold leading-tight">Step into a world of Luxury</p>
            <p className="text-lg text-white/90">Immerse yourself in captivating visuals from our most iconic and indulgent destinations.</p>
            <button className="rounded-xl bg-[#0057FF] px-5 py-3 text-white shadow-lg hover:bg-[#0046CC]">Explore all videos</button>
          </div>
        </div>
        <div className="grid gap-4">
          {videos.map((video) => (
            <div key={video.title} className="relative h-44 overflow-hidden rounded-2xl shadow-md">
              <img src={video.img} alt={video.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-lg font-semibold">{video.title}</p>
                <p className="text-sm text-white/80">4.9 ★</p>
              </div>
              <button className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-[#121316] shadow">
                ▶
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomesGuestsLove() {
  return (
    <section className="space-y-6" id="homes">
      <SectionHeader
        title="Homes Guests Love"
        action={
          <div className="flex items-center gap-2">
            <NavCircle disabled />
            <NavCircle active />
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {homes.map((home) => (
          <div key={home.title} className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#DDDFE3] bg-white shadow-sm hover:shadow-xl hover:border-[#0057FF] transition-all duration-300">
            <div className="relative h-44 overflow-hidden group">
              <img src={home.img} alt={home.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute right-4 top-4 rounded-full bg-white/90 backdrop-blur p-2.5 shadow-md hover:bg-white transition-colors cursor-pointer">
                <span className="text-lg">♡</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-lg bg-[#0057FF] px-2.5 py-1 font-bold text-white text-xs">{home.rating}</span>
                <span className="font-semibold text-[#0057FF]">Excellent</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-[#1F2226]">{home.title}</p>
                <p className="text-sm font-medium text-[#656F81]">{home.location}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-sm text-[#8B94A4]">
                <span className="text-lg font-bold text-[#0057FF]">{home.price.toLocaleString('vi-VN')} ₫</span>
                <span>mỗi đêm</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="space-y-6" id="help">
      <SectionHeader title="What travellers say" />
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <div key={item.name} className="flex flex-col gap-3 rounded-3xl border border-[#DDDFE3] bg-gradient-to-br from-[#F8FAFF] to-[#F0F5FF] p-6 shadow-sm hover:shadow-lg hover:border-[#0057FF] transition-all duration-300">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-lg">⭐</span>
              ))}
            </div>
            <p className="text-base font-semibold text-[#121316]">"{item.text}"</p>
            <div className="mt-2 pt-3 border-t border-[#E0E2E7]">
              <p className="font-bold text-[#121316]">{item.name}</p>
              <p className="text-sm text-[#656F81]">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NavCircle({ active, disabled }: { active?: boolean; disabled?: boolean }) {
  const base = "flex h-10 w-10 items-center justify-center rounded-full border";
  if (disabled) {
    return <div className={`${base} rotate-180 border-[#DDDFE3] text-[#8B94A4]`}>←</div>;
  }
  if (active) {
    return <div className={`${base} border-[#2B3037] text-[#2B3037]`}>→</div>;
  }
  return <div className={`${base} border-[#DDDFE3] text-[#8B94A4]`}>→</div>;
}
