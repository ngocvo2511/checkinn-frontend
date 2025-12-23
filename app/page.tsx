"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { LocationSearch } from "@/components/LocationSearch";
import { DateRangePicker } from "@/components/DateRangePicker";
import { RoomGuestPicker } from "@/components/RoomGuestPicker";

const heroBg = "/hero.png";
const heroBadgeIcon = "https://www.figma.com/api/mcp/asset/7f84ae0a-9727-4a93-bfaf-6464772bb8df";
const trendingImages = [
  "https://www.figma.com/api/mcp/asset/02199c7c-1379-4cf7-83e5-d3da96657f55",
  "https://www.figma.com/api/mcp/asset/595c2184-fd5e-4f4f-96fd-042b3a549661",
  "https://www.figma.com/api/mcp/asset/1ae69f10-3ed4-4c8a-9ad2-5073611d804e",
  "https://www.figma.com/api/mcp/asset/9db2a657-6ecd-4414-ba65-f1435800b031",
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
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupVariant, setSignupVariant] = useState<'user' | 'host'>('user');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleEditProfile = () => {
    router.push("/personal-data");
  };

  if (!mounted) return null;

  return (
    <div className="bg-white text-[#121316]">
      <Header 
        user={user} 
        onLogin={() => setShowLogin(true)} 
        onSignup={() => { setSignupVariant('user'); setShowSignup(true); }} 
        onLogout={handleLogout}
        onEditProfile={handleEditProfile}
      />
      <Hero />
      {showLogin ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
          <LoginModal
            onClose={() => { setShowLogin(false); const stored = localStorage.getItem("user"); if (stored) setUser(JSON.parse(stored)); }}
            onOpenHostSignup={() => { setShowLogin(false); setSignupVariant('host'); setShowSignup(true); }}
          />
        </div>
      ) : null}
      {showSignup ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
          <SignupModal
            variant={signupVariant}
            onClose={() => { setShowSignup(false); const stored = localStorage.getItem("user"); if (stored) setUser(JSON.parse(stored)); }}
          />
        </div>
      ) : null}
      <main className="mx-auto flex max-w-screen-xl flex-col gap-16 px-4 pb-20 pt-10 md:px-8 lg:px-10">
        <WhyTripto />
        <TrendingDestinations />
        <WeekendDeals />
        <TravelMore />
        <TopSights />
        <TopThingsToDo />
        <Motion />
        <HomesGuestsLove />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}

function Header({ user, onLogin, onSignup, onLogout, onEditProfile }: { user: any; onLogin: () => void; onSignup: () => void; onLogout: () => void; onEditProfile: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 md:px-8 lg:px-10">
        <div className="flex items-center gap-1">
          <span className="text-2xl font-semibold text-[#0057FF]">tript</span>
          <span className="text-2xl font-semibold text-[#FFCC00]">o</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-[#0057FF] hover:bg-[#E8EFFC]">
            <span role="img" aria-label="us-flag" className="text-lg">🇺🇸</span>
            <span>USD</span>
          </button>
          <button className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#F2F3F5] text-[#0057FF] shadow-sm transition hover:bg-[#E8EFFC] md:flex">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C7.03 3 3 7.03 3 12V16C3 16.55 3.45 17 4 17H6V11H4.1C4.56 7.93 7.07 6 12 6C16.93 6 19.44 7.93 19.9 11H18V17H20C20.55 17 21 16.55 21 16V12C21 7.03 16.97 3 12 3ZM7 19C7 20.66 8.34 22 10 22H14C15.66 22 17 20.66 17 19V18H7V19Z" fill="#0057FF"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-full bg-[#F1F2F3] px-3 py-2 hover:bg-[#E1E2E7]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0057FF] text-xs font-bold text-white">
                  {user.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-[#2B3037]">{user.fullName || 'User'}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#DDDFE3] bg-white shadow-lg">
                  <button
                    onClick={() => { onEditProfile(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-[#2B3037] hover:bg-[#F1F2F3]"
                  >
                    Edit Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-[#2B3037] hover:bg-[#F1F2F3]">
                    Booking History
                  </button>
                  <hr className="my-1 border-[#DDDFE3]" />
                  <button
                    onClick={() => { onLogout(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="hidden rounded-full border border-[#DDDFE3] px-4 py-2 text-sm font-medium text-[#2B3037] hover:bg-[#F1F2F3] md:inline-flex">
                Support
              </button>
              <button
                className="rounded-xl border border-[#0057FF] bg-white px-4 py-2 text-sm font-medium text-[#0057FF] shadow-sm hover:bg-[#0057FF] hover:text-white"
                onClick={onSignup}
              >
                Sign Up
              </button>
              <button
                className="rounded-xl bg-[#0057FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0046CC]"
                onClick={onLogin}
              >
                Login
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const handleSearch = () => {
    // Validate required fields
    if (!selectedCity) {
      alert("Please select a destination");
      return;
    }
    if (!checkInDate || !checkOutDate) {
      alert("Please select check-in and check-out dates");
      return;
    }

    // Build search params
    const searchParams = new URLSearchParams({
      cityId: selectedCity.id,
      cityName: selectedCity.name,
      checkIn: checkInDate.toISOString().split('T')[0],
      checkOut: checkOutDate.toISOString().split('T')[0],
      rooms: rooms.toString(),
      adults: adults.toString(),
      children: children.toString(),
    });

    // Navigate to search results page
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <section className="relative overflow-visible bg-gradient-to-b from-[#0057FF] to-[#0f1829]">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Beach resort" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10" />
      </div>
      <div className="relative mx-auto flex max-w-screen-xl flex-col gap-8 px-4 pb-24 pt-16 md:px-8 md:pb-28 md:pt-20 lg:px-10">
        <div className="mt-6 flex flex-col items-center gap-4 text-white md:mt-8 md:max-w-4xl md:self-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm font-medium text-white border border-white/20">
            <span>✨</span>
            <span>Discover Amazing Places</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-center md:text-6xl md:leading-[72px]">Your Perfect Journey Awaits</h1>
          <p className="text-lg text-white/80 text-center md:text-xl md:max-w-2xl">Explore unique accommodations worldwide—from cozy boutiques to luxurious villas. Book with confidence, travel with joy.</p>
        </div>

        <div className="relative w-full max-w-6xl md:mx-auto mt-2">
          <div className="absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#2f3642] px-4 py-2 text-[13px] font-medium text-white shadow-xl">
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

          <div className="relative overflow-visible rounded-3xl bg-white shadow-2xl backdrop-blur">
            <div className="grid grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[repeat(2,minmax(0,1fr))_1.4fr_auto] md:gap-0 md:px-2 md:py-3 items-stretch">
              <LocationSearch onCitySelect={setSelectedCity} />
              <DateRangePicker
                checkInLabel="Check In"
                checkOutLabel="Check Out"
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
                className="flex h-full w-full items-center justify-center gap-2 rounded-2xl bg-[#0057FF] px-5 text-base font-semibold text-white shadow-lg transition hover:bg-[#0046CC] md:h-[72px] md:w-32 md:rounded-none md:rounded-r-3xl"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" fill="white"/>
                </svg>
                Search
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
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
      localStorage.setItem("user", JSON.stringify(response));

      const role = response.role?.toLowerCase?.() || "";
      if (role.includes("admin")) {
        router.push("/admin/dashboard");
      } else if (role.includes("owner") || role.includes("host")) {
        router.push("/host/dashboard");
      } else {
        alert("Login successful!");
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
      <div className="relative flex items-center justify-center pb-2">
        <p className="text-sm font-semibold text-[#2B3037]">Log in or sign up</p>
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
          <p className="text-xl font-bold text-[#1F2226]">Welcome to Tripto</p>
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
          <label className="text-sm font-semibold text-[#2B3037]">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-[#0057FF] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0046CC] disabled:opacity-50"
        >
          {loading ? "Loading..." : "Continue"}
        </button>

        <button
          type="button"
          onClick={onOpenHostSignup}
          className="w-full rounded-xl border border-[#0057FF] bg-white py-3 text-sm font-semibold text-[#0057FF] shadow-sm hover:bg-[#0057FF] hover:text-white"
        >
          Bạn là chủ khách sạn? Đăng ký ngay
        </button>

        <div className="relative py-2">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#E0E2E7]" />
          <span className="relative mx-auto block w-fit bg-white px-3 text-sm font-semibold text-[#656F81]">or</span>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-[#CED3DD] px-4 py-3 text-sm font-semibold text-[#2B3037] shadow-sm transition hover:border-[#0057FF] hover:text-[#0057FF]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E0E2E7] bg-white text-base font-bold text-[#DB4437]">G</span>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}

function SignupModal({ onClose, variant = 'user' }: { onClose: () => void; variant?: 'user' | 'host' }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<'user' | 'host'>(variant);

  useEffect(() => {
    setSelectedVariant(variant);
  }, [variant]);

  const handleSubmit = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.register({
        fullName,
        username,
        email,
        password,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response));

      const role = response.role?.toLowerCase?.() || "";
      if (role.includes("admin")) {
        router.push("/admin/dashboard");
      } else if (role.includes("owner") || role.includes("host") || selectedVariant === "host") {
        router.push("/host/dashboard");
      } else {
        alert("Registration successful!");
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
      <div className="relative flex items-center justify-center pb-2">
        <p className="text-sm font-semibold text-[#2B3037]">
          {selectedVariant === 'host' ? 'Đăng ký chủ khách sạn' : 'Sign up'}
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
              Customer
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
              Hotel owner
            </button>
          </div>
          <p className="text-xs font-medium text-[#656F81]">
            Select the account type that best describes you.
          </p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#1F2226]">
            {selectedVariant === 'host' ? 'Create your hotel owner account' : 'Create your customer account'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Full name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

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
          <label className="text-sm font-semibold text-[#2B3037]">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#E0E2E7] bg-[#F7F8FA] px-4 py-3 text-sm text-[#2B3037] placeholder:text-[#8B94A4] focus:border-[#0057FF] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#2B3037]">Confirm password</label>
          <input
            type="password"
            placeholder="Re-enter your password"
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
          {loading ? "Loading..." : "Continue"}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#E0E2E7]" />
          <span className="relative mx-auto block w-fit bg-white px-3 text-sm font-semibold text-[#656F81]">or</span>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-[#CED3DD] px-4 py-3 text-sm font-semibold text-[#2B3037] shadow-sm transition hover:border-[#0057FF] hover:text-[#0057FF]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E0E2E7] bg-white text-base font-bold text-[#DB4437]">G</span>
          <span>Continue with Google</span>
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
      title: "No hidden fees",
      desc: "Transparent pricing with no surprises at checkout.",
      icon: "💰"
    },
    {
      title: "Instant booking",
      desc: "Get confirmation right after you reserve.",
      icon: "⚡"
    },
    {
      title: "Flexibility",
      desc: "Free cancellation on many listings for peace of mind.",
      icon: "🔄"
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold leading-[48px] text-[#121316] md:text-4xl">Why Travellers Trust Tripto</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-4 rounded-3xl border border-[#E8EFFC] bg-gradient-to-br from-[#F9FBFF] to-[#F5F8FE] p-8 text-center shadow-sm hover:shadow-lg hover:border-[#0057FF] transition-all duration-300"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#E8EFFC] to-[#D8E5FF]">
              <span className="text-4xl">{feature.icon}</span>
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
  return (
    <section className="flex flex-col gap-6" id="trending">
      <SectionHeader
        title="Trending Destinations"
        action={<div className="flex gap-2 text-sm text-[#383E48]">Spring picks | 2025 spotlight</div>}
      />
      <div className="flex flex-wrap gap-3 text-sm font-medium text-[#383E48]">
        <CategoryFilterChip label="Spring Picks" active />
        <CategoryFilterChip label="Summer Hotspot" />
        <CategoryFilterChip label="Autumn Escape" />
        <CategoryFilterChip label="Winter Getaway" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trendingImages.map((img, idx) => (
          <div key={img} className="group relative h-[320px] overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500">
            <img src={img} alt="Destination" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 space-y-3 bg-gradient-to-t from-black to-transparent p-6 text-white">
              <p className="text-2xl font-bold">{["Paris, France", "Santorini, Greece", "Bali, Indonesia", "Kyoto, Japan"][idx]}</p>
              <p className="text-sm text-white/90">From ${[128, 225, 26, 190][idx]} / night</p>
              <p className="text-xs text-white/80">{["Romantic escapes, art, and cafes.", "Sunsets, sea views, and serenity.", "Beaches, nature, and calm vibes.", "Cherry blossoms and temples."][idx]}</p>
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
                <span className="line-through text-[#8B94A4]">${deal.oldPrice}</span>
                <span className="text-lg font-bold text-[#0057FF]">${deal.price}</span>
                <span className="text-xs text-[#8B94A4]">per night</span>
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
                <span className="text-lg font-bold text-[#0057FF]">${home.price}</span>
                <span>per night</span>
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

function Footer() {
  return (
    <footer className="mt-10 bg-[#121316] text-white">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-10 px-4 py-12 md:px-8 lg:px-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xl font-semibold text-white">tripto</div>
            <p className="text-sm text-white/80">
              We help you find and book the perfect stay—from cozy guesthouses to top hotels—with ease, trust, and the best deals.
            </p>
            <div className="flex gap-3 text-lg text-white/80">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-[#99BDFF] font-semibold">Explore</p>
            <ul className="space-y-2 text-white/80">
              <li>Trending Destinations</li>
              <li>Summer Hotspots</li>
              <li>Winter Getaways</li>
              <li>Weekend Deals</li>
              <li>Family-Friendly Stays</li>
            </ul>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-[#99BDFF] font-semibold">Property Types</p>
            <ul className="space-y-2 text-white/80">
              <li>Hotels</li>
              <li>Apartments</li>
              <li>Villas</li>
              <li>Cabins</li>
              <li>Glamping</li>
              <li>Domes</li>
            </ul>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-[#99BDFF] font-semibold">Get in touch</p>
            <ul className="space-y-2 text-white/80">
              <li>+1 (800) 123‑456</li>
              <li>support@tripto.com</li>
              <li className="flex gap-2 text-xs text-white/70">
                <img src={heroBadgeIcon} alt="divider" className="h-1 w-16" />
              </li>
              <li className="flex gap-2 text-xs text-white/70">Payments: Visa | MC | Stripe | PayPal</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/70">
          <span>© 2025 Tripto. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <span className="rounded border border-white/20 px-3 py-2">App Store</span>
            <span className="rounded border border-white/20 px-3 py-2">Google Play</span>
          </div>
        </div>
      </div>
    </footer>
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
