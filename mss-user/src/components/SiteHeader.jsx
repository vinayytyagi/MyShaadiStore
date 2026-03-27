"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { clearAuthCookies, useAuthUser } from "@/lib/authCookies";
import BasketButton from "@/components/BasketButton";
import { clearAllCarts } from "@/lib/cartStore";
import { User, Package, Truck, LogOut } from "lucide-react";
import { toast } from "sonner";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 20.25s-6.75-4.35-9-8.25C1.1 8.8 2.9 5.25 6.75 5.25c2.05 0 3.24 1.1 4.02 2.2.5.7 1.46.7 1.96 0 .78-1.1 1.97-2.2 4.02-2.2 3.85 0 5.65 3.55 3.75 6.75-2.25 3.9-9 8.25-9 8.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteHeader({ steps = [] }) {
  const pathname = usePathname();
  const shoppingStep = useMemo(() => steps.find((step) => step.slug === "shopping"), [steps]);
  const user = useAuthUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isJourneyActive = pathname?.startsWith("/journey/");
  const isShoppingActive =
    pathname?.startsWith("/shopping") || (shoppingStep && pathname === `/journey/${shoppingStep.slug}`);
  const navLinkClass = "border-b-2 border-transparent pb-1 transition hover:text-slate-900";
  const activeNavLinkClass = "border-b-2 border-[#ff4f86] pb-1 text-slate-800";

  function handleLogout() {
    clearAuthCookies();
    clearAllCarts();
    toast.success("Logged out successfully.");
    window.location.href = "/";
  }

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-20">
        <Link href="/" className="flex cursor-pointer items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4f86] text-white">
            <HeartIcon />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-slate-700">MyShaadiStore</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
          <Link href="/" className={pathname === "/" ? activeNavLinkClass : navLinkClass}>
            Home
          </Link>

          <div className="group relative">
            <button
              className={`flex cursor-pointer items-center gap-1 ${
                isJourneyActive ? activeNavLinkClass : navLinkClass
              }`}
            >
              Journey
              <ChevronDown />
            </button>

            <div className="pointer-events-none absolute left-1/2 top-full mt-4 w-[360px] -translate-x-1/2 rounded-3xl border border-slate-100 bg-white p-4 opacity-0 shadow-[0_25px_80px_rgba(16,24,40,0.12)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
              <p className="mb-3 text-xs font-medium text-slate-400">
                Journey Steps
              </p>
              <div className="grid gap-2">
                {steps.map((step, index) => (
                  <Link
                    key={step.step_id}
                    href={`/journey/${step.slug}`}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition ${
                      pathname === `/journey/${step.slug}`
                        ? "bg-[#fff1f6] text-[#ff4f86]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        pathname === `/journey/${step.slug}` ? "text-[#ff4f86]" : "text-slate-700"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        pathname === `/journey/${step.slug}` ? "text-[#ff77a1]" : "text-slate-400"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href={shoppingStep ? `/journey/${shoppingStep.slug}` : "/shopping"}
            className={isShoppingActive ? activeNavLinkClass : navLinkClass}
          >
            Shopping
          </Link>
          <Link
            href="/how-it-works"
            className={pathname === "/how-it-works" ? activeNavLinkClass : navLinkClass}
          >
            How it works
          </Link>
          <Link
            href="/orders/track"
            className={pathname === "/orders/track" ? activeNavLinkClass : navLinkClass}
          >
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <BasketButton />
          {user ? (
            <div className="group relative">
              <button className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#ff4f86] hover:text-[#ff4f86]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-[#ff4f86] to-[#ff8fb1] text-xs font-semibold text-white">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>
                {user.name ? user.name.split(" ")[0] : `+91 ${normalizePhone(user.phone) || ""}`}
                <ChevronDown />
              </button>
              <div className="pointer-events-none absolute right-0 top-full mt-3 w-56 rounded-2xl border border-slate-100 bg-white p-2 opacity-0 shadow-[0_25px_80px_rgba(16,24,40,0.12)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <Link href="/profile" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/profile' ? 'bg-[#fff1f6] text-[#ff4f86]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <Link href="/orders" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/orders' ? 'bg-[#fff1f6] text-[#ff4f86]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Package className="h-4 w-4" />
                  My Orders
                </Link>
                <Link href="/orders/track" className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${pathname === '/orders/track' ? 'bg-[#fff1f6] text-[#ff4f86]' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Truck className="h-4 w-4" />
                  Track Order
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={() => setShowLogoutModal(true)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="cursor-pointer rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="cursor-pointer rounded-2xl bg-[#ff4f86] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-[#ff3d79]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      {showLogoutModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm logout</h3>
            <p className="mt-2 text-sm text-slate-500">Are you sure you want to logout from your account?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
