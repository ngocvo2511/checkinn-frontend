"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth";

const heroBg = "https://www.figma.com/api/mcp/asset/4fd2eff1-ae11-42de-a378-7e5a8847d77f";
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
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="bg-white text-[#121316]">
      <Header onLogin={() => setShowLogin(true)} onSignup={() => setShowSignup(true)} />
      <Hero />
      {showLogin ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
          <LoginModal onClose={() => setShowLogin(false)} />
        </div>
      ) : null}
      {showSignup ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-10 sm:py-16">
          <SignupModal onClose={() => setShowSignup(false)} />
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

function Header({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#DDDFE3] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 md:px-8 lg:px-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-[#0057FF]">tripto</span>
          <span className="rounded-full bg-[#FFCC00] px-2 py-0.5 text-xs font-semibold text-[#121316]">new</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-[#383E48] md:flex">
          <a className="hover:text-[#0057FF]" href="#trending">Destinations</a>
          <a className="hover:text-[#0057FF]" href="#weekend">Deals</a>
          <a className="hover:text-[#0057FF]" href="#homes">Homes</a>
          <a className="hover:text-[#0057FF]" href="#help">Support</a>
        </nav>
        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0f1829]">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Beach resort" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/15" />
      </div>
      <div className="relative mx-auto flex max-w-screen-xl flex-col gap-8 px-4 pb-14 pt-16 md:px-8 md:pt-20 lg:px-10">
        <div className="mt-6 flex flex-col items-start gap-4 text-white md:mt-10 md:max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#99BDFF]">Luxury stays | Villas | Apartments</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Your Trip Starts Here
          </h1>
          <p className="text-lg text-white/90 md:text-xl">
            Find unique stays across hotels, villas, and more. Instant booking, flexible options, and trusted reviews.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl bg-white/90 p-4 shadow-2xl backdrop-blur lg:grid-cols-[2fr_2fr_2fr_auto]">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#2B3037]">Location</span>
            <input
              className="rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm text-[#383E48] outline-none focus:border-[#0057FF]"
              placeholder="Where are you going?"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#2B3037]">Check in</span>
            <input
              className="rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm text-[#383E48] outline-none focus:border-[#0057FF]"
              placeholder="Add dates"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#2B3037]">Check out</span>
            <input
              className="rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm text-[#383E48] outline-none focus:border-[#0057FF]"
              placeholder="Add dates"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[#2B3037]">Rooms & guests</span>
            <div className="flex items-center justify-between rounded-xl border border-[#DDDFE3] px-3 py-2 text-sm text-[#383E48]">
              <span>1 room, 2 adults</span>
              <span className="text-[#0057FF]">Edit</span>
            </div>
          </div>
          <button className="col-span-full flex items-center justify-center gap-2 rounded-xl bg-[#0057FF] px-5 py-3 text-white shadow-lg transition hover:bg-[#0046CC] lg:col-span-1 lg:row-span-2 lg:self-end">
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-full bg-white/80 px-3 py-2 text-sm font-medium text-[#2B3037] shadow-md backdrop-blur lg:self-start">
          <FilterChip label="Hotel" active />
          <FilterChip label="House" />
          <FilterChip label="Guest House" />
          <FilterChip label="Cabins" />
          <FilterChip label="Glamping" />
          <FilterChip label="Domes" />
        </div>
      </div>
    </section>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
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

      alert("Login successful!");
      onClose();
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

function SignupModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      alert("Registration successful!");
      onClose();
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#E8E9F1] bg-white/95 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur sm:p-8">
      <div className="relative flex items-center justify-center pb-2">
        <p className="text-sm font-semibold text-[#2B3037]">Sign up</p>
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
          <p className="text-xl font-bold text-[#1F2226]">Create your Tripto account</p>
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
      <h2 className="text-2xl font-semibold text-[#121316] md:text-[40px] md:leading-[52px]">{title}</h2>
      {action}
    </div>
  );
}

function WhyTripto() {
  const features = [
    {
      title: "No hidden fees",
      desc: "Transparent pricing with no surprises at checkout.",
    },
    {
      title: "Instant booking",
      desc: "Get confirmation right after you reserve.",
    },
    {
      title: "Flexibility",
      desc: "Free cancellation on many listings for peace of mind.",
    },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-[36px] font-semibold leading-[46px] text-[#121316]">Why Travellers Trust Tripto</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center gap-4 rounded-2xl border border-[#E8EFFC] bg-[#F9FBFF] p-6 text-center shadow-sm"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8EFFC]">
              <span className="text-xl text-[#0057FF]">★</span>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-[#383E48]">{feature.title}</p>
              <p className="text-sm text-[#656F81]">{feature.desc}</p>
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
        <CategoryChip label="Spring Picks" active />
        <CategoryChip label="Summer Hotspot" />
        <CategoryChip label="Autumn Escape" />
        <CategoryChip label="Winter Getaway" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trendingImages.map((img, idx) => (
          <div key={img} className="group relative h-[320px] overflow-hidden rounded-2xl shadow-lg">
            <img src={img} alt="Destination" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="absolute bottom-4 left-4 space-y-2 text-white">
              <p className="text-xl font-semibold">{["Paris, France", "Santorini, Greece", "Bali, Indonesia", "Kyoto, Japan"][idx]}</p>
              <p className="text-sm text-white/90">From ${[128, 225, 26, 190][idx]} / night</p>
              <p className="text-xs text-white/80">{["Romantic escapes, art, and cafes.", "Sunsets, sea views, and serenity.", "Beaches, nature, and calm vibes.", "Cherry blossoms and temples."][idx]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryChip({ label, active }: { label: string; active?: boolean }) {
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
          <div key={deal.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#DDDFE3] bg-white shadow-sm">
            <div className="relative h-44">
              <img src={deal.img} alt={deal.title} className="h-full w-full object-cover" />
              <div className="absolute right-3 top-3 rounded-full bg-white p-2 shadow">
                <span className="text-[#383E48]">♡</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <span className="inline-flex w-fit rounded-full bg-[#049153] px-3 py-1 text-xs font-medium text-white">{deal.badge}</span>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-[#1F2226]">{deal.title}</p>
                <p className="text-sm font-medium text-[#2B3037]">{deal.location}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-right text-sm text-[#8B94A4]">
                <span className="line-through">${deal.oldPrice}</span>
                <span className="text-lg font-semibold text-[#1F2226]">${deal.price}</span>
                <span className="text-xs">per night</span>
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
          <div key={sight.title} className="relative h-60 overflow-hidden rounded-2xl shadow-lg">
            <img src={sight.img} alt={sight.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-[#121316] backdrop-blur">
              {sight.title}
              <span className="rounded bg-[#121316] px-1.5 py-0.5 text-xs text-white">{sight.flag}</span>
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
          <div key={home.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#DDDFE3] bg-white shadow-sm">
            <div className="relative h-40">
              <img src={home.img} alt={home.title} className="h-full w-full object-cover" />
              <div className="absolute right-3 top-3 rounded-full bg-white p-2 shadow">
                <span className="text-[#383E48]">♡</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-md bg-[#F1F2F3] px-2 py-1 font-semibold text-[#003499]">{home.rating}</span>
                <span className="text-[#0046CC]">Excellent</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-[#1F2226]">{home.title}</p>
                <p className="text-sm font-medium text-[#2B3037]">{home.location}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-sm text-[#8B94A4]">
                <span className="text-lg font-semibold text-[#1F2226]">${home.price}</span>
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
          <div key={item.name} className="flex flex-col gap-3 rounded-2xl border border-[#DDDFE3] bg-[#F8FAFF] p-5 shadow-sm">
            <p className="text-lg font-semibold text-[#121316]">{item.name}</p>
            <p className="text-sm font-medium text-[#383E48]">{item.location}</p>
            <p className="text-sm text-[#656F81]">“{item.text}”</p>
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
              <span></span>
              <span></span>
              <span></span>
              <span></span>
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
