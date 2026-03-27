"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthUser, getAuthToken, saveAuthCookies, clearAuthCookies } from "@/lib/authCookies";
import { fetchMyProfile, updateMyProfile, fetchMyOrders } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import { formatLakhs } from "@/lib/utils";

/* ── Icons ─────────────────────────────────────────── */
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M14.5 2.5a2.121 2.121 0 113 3L6.25 16.75 2 18l1.25-4.25L14.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 20.25s-6.75-4.35-9-8.25C1.1 8.8 2.9 5.25 6.75 5.25c2.05 0 3.24 1.1 4.02 2.2.5.7 1.46.7 1.96 0 .78-1.1 1.97-2.2 4.02-2.2 3.85 0 5.65 3.55 3.75 6.75-2.25 3.9-9 8.25-9 8.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Helpers ────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(amount) {
  return formatLakhs(amount);
}

const MAX_BUDGET_PER_STEP = 5000000;
const BUDGET_STEP = 50000;

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w.charAt(0).toUpperCase()).slice(0, 2).join("");
}

/* ── Main Component ────────────────────────────────── */
export default function ProfileClient() {
  const user = useAuthUser();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Edit states
  const [editingBasic, setEditingBasic] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editImage, setEditImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  // Wedding edit
  const [editingWedding, setEditingWedding] = useState(false);
  const [editWeddingDate, setEditWeddingDate] = useState("");
  const [editGuestsCount, setEditGuestsCount] = useState("");
  const [editVenueLocation, setEditVenueLocation] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);
  const [editBudgetAllocations, setEditBudgetAllocations] = useState([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchMyProfile(token).catch(() => null),
      fetchMyOrders(token).catch(() => ({ orders: [] })),
    ]).then(([prof, ordersData]) => {
        if (prof) {
            setProfile(prof);
            setEditName(prof.name || "");
            setEditEmail(prof.email || "");
            setEditImage(prof.image_url || "");
            setAddresses(prof.addresses || []);
            
            const onboarding = prof.onboarding || {};
            setEditWeddingDate(onboarding.wedding_date || "");
            setEditGuestsCount(onboarding.guests_count || "");
            setEditVenueLocation(onboarding.venue_location || "");
            setEditBudgetAllocations(onboarding.budget_allocations || []);
        }
        setOrders(ordersData?.orders || []);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSaveBasic() {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = getAuthToken();
      const result = await updateMyProfile(token, { name: editName, email: editEmail, image_url: editImage });
      setProfile(result.user);
      // Update cookie so header reflects changes
      saveAuthCookies({ token, user: result.user });
      setEditingBasic(false);
      setSaveMsg("Profile updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWedding() {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = getAuthToken();
      const payload = {
        onboarding: {
          ...profile.onboarding,
          wedding_date: editWeddingDate,
          guests_count: editGuestsCount,
          venue_location: editVenueLocation,
        }
      };
      
      const result = await updateMyProfile(token, payload);
      setProfile(result.user);
      saveAuthCookies({ token, user: result.user });
      setEditingWedding(false);
      setSaveMsg("Wedding details updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBudget() {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = getAuthToken();
      const total = editBudgetAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const payload = {
        onboarding: {
          ...profile.onboarding,
          budget_allocations: editBudgetAllocations.map((item) => ({
            ...item,
            amount: Number(item.amount) || 0,
          })),
          budget_total: total,
        },
      };
      const result = await updateMyProfile(token, payload);
      setProfile(result.user);
      saveAuthCookies({ token, user: result.user });
      setEditingBudget(false);
      setSaveMsg("Budget updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAddresses(updatedAddresses) {
    setSaving(true);
    try {
      const token = getAuthToken();
      const result = await updateMyProfile(token, { addresses: updatedAddresses });
      setProfile(result.user);
      setAddresses(result.user.addresses || []);
      setEditingAddress(false);
      setSaveMsg("Addresses updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddAddress() {
    if (!newAddress.line1.trim() || !newAddress.city.trim() || !newAddress.pincode.trim()) return;
    const updated = [...addresses, { ...newAddress }];
    setAddresses(updated);
    setNewAddress({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
    setShowAddForm(false);
    handleSaveAddresses(updated);
  }

  function handleRemoveAddress(index) {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    handleSaveAddresses(updated);
  }

  function handleLogout() {
    clearAuthCookies();
    window.location.href = "/";
  }

  /* ── Not logged in ─────────────────────────────────── */
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-3xl border border-slate-100 bg-white/80 px-8 py-16 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff4f86] to-[#ff8fb1] text-white shadow-[0_20px_50px_rgba(255,79,134,0.3)]">
            <UserIcon />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-700">My Profile</h1>
          <p className="mt-2 text-slate-500">Please log in to view your profile.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-[#ff4f86] px-8 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-[#ff3d79]"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff4f86] border-t-transparent" />
        </div>
      </main>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <UserIcon /> },
    { id: "orders", label: "Orders", icon: <PackageIcon /> },
    { id: "wedding", label: "Wedding details", icon: <HeartIcon /> },
    { id: "budget", label: "Budget", icon: <HeartIcon /> },
    { id: "addresses", label: "Addresses", icon: <LocationIcon /> },
  ];

  const onboarding = profile?.onboarding || {};
  const budgetAllocations = Array.isArray(onboarding.budget_allocations) ? onboarding.budget_allocations : [];
  const editableBudgetTotal = editBudgetAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero / Avatar section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-linear-to-br from-[#ff4f86]/5 via-white to-[#fff1f6] p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ff4f86]/5 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#ff8fb1]/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-[#ff4f86] to-[#ff8fb1] text-2xl font-extrabold text-white shadow-[0_20px_50px_rgba(255,79,134,0.3)]">
            {profile?.image_url ? (
              <img src={profile.image_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(profile?.name)
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-700">
              {profile?.name || "User"}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">+91 {profile?.phone || user.phone || ""}</p>
            {profile?.email && <p className="text-sm text-slate-400">{profile.email}</p>}
            <p className="mt-1 text-xs text-slate-300">Member since {formatDate(profile?.created_at)}</p>
          </div>
          <div className="sm:ml-auto">
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100"
            >
              <LogoutIcon /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Success message */}
      {saveMsg && (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-600 animate-in fade-in duration-300">
          {saveMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white/80 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#ff4f86] text-white shadow-[0_8px_20px_rgba(255,79,134,0.25)]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* ── Profile Tab ──────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700">Personal information</h2>
              {!editingBasic && (
                <button
                  onClick={() => setEditingBasic(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#ff4f86] transition hover:bg-[#fff1f6]"
                >
                  <PencilIcon /> Edit
                </button>
              )}
            </div>

            {editingBasic ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Phone</label>
                  <input
                    type="text"
                    value={`+91 ${profile?.phone || ""}`}
                    disabled
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">Phone number cannot be changed</p>
                </div>
                <div className="pt-2">
                  <ImageUpload 
                    label="Profile Photo"
                    initialUrl={editImage}
                    onUploadComplete={(url) => setEditImage(url)}
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleSaveBasic}
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-[#ff3d79] disabled:opacity-60"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckIcon />}
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingBasic(false); setEditName(profile?.name || ""); setEditEmail(profile?.email || ""); }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 px-5 py-4">
                  <p className="text-xs text-slate-400">Full Name</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{profile?.name || "—"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-5 py-4">
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">+91 {profile?.phone || "—"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-5 py-4">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">{profile?.email || "Not provided"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 px-5 py-4">
                  <p className="text-xs text-slate-400">Account Status</p>
                  <p className="mt-1 text-sm font-bold text-emerald-600">{profile?.status || "Active"}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ──────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700">
                Recent Orders ({orders.length})
              </h2>
              <Link href="/orders" className="text-sm font-semibold text-[#ff4f86] transition hover:text-[#ff3d79]">
                View All →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-white/80 px-8 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
                <PackageIcon />
                <p className="mt-3 text-sm text-slate-500">No orders yet</p>
                <Link href="/" className="mt-4 inline-block rounded-xl bg-[#ff4f86] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff3d79]">
                  Start Shopping
                </Link>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="group block rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur transition hover:border-[#ff4f86]/30 hover:shadow-[0_8px_30px_rgba(255,79,134,0.08)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-700">{order.order_number}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        order.status === "Paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                        order.status === "Cancelled" ? "border-red-200 bg-red-50 text-red-600" :
                        "border-amber-200 bg-amber-50 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                      <span className="font-bold text-slate-700">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* ── Wedding Details Tab ─────────────────────────── */}
        {activeTab === "wedding" && (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700">Wedding details</h2>
              {!editingWedding && (
                <button
                  onClick={() => setEditingWedding(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#ff4f86] transition hover:bg-[#fff1f6]"
                >
                  <PencilIcon /> Edit
                </button>
              )}
            </div>

            {editingWedding ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Wedding Date</label>
                    <input
                      type="date"
                      value={editWeddingDate?.split("T")[0] || ""}
                      onChange={(e) => setEditWeddingDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Guest Count</label>
                    <input
                      type="number"
                      value={editGuestsCount}
                      onChange={(e) => setEditGuestsCount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Venue Location</label>
                    <input
                      type="text"
                      value={editVenueLocation}
                      onChange={(e) => setEditVenueLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff4f86] focus:ring-2 focus:ring-[#ff4f86]/20"
                      placeholder="e.g. Mumbai, Maharashtra"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3 text-sm text-slate-600">
                  Budget allocations are managed in the <span className="font-bold text-[#ff4f86]">Budget</span> tab.
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                  <button
                    onClick={handleSaveWedding}
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30_rgba(255,79,134,0.25)] transition hover:bg-[#ff3d79] disabled:opacity-60"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckIcon />}
                    Save Wedding Details
                  </button>
                  <button
                    onClick={() => {
                      setEditingWedding(false);
                      const currentOnboarding = profile?.onboarding || {};
                      setEditWeddingDate(currentOnboarding.wedding_date || "");
                      setEditGuestsCount(currentOnboarding.guests_count || "");
                      setEditVenueLocation(currentOnboarding.venue_location || "");
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-linear-to-br from-[#fff1f6] to-white px-5 py-4 border border-pink-50">
                    <p className="text-xs text-slate-400">Wedding Date</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {onboarding.wedding_date ? formatDate(onboarding.wedding_date) :
                       onboarding.wedding_month || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-[#fff1f6] to-white px-5 py-4 border border-pink-50">
                    <p className="text-xs text-slate-400">Venue Location</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{onboarding.venue_location || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-[#fff1f6] to-white px-5 py-4 border border-pink-50">
                    <p className="text-xs text-slate-400">Guest Count</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">{onboarding.guests_count || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-[#fff1f6] to-white px-5 py-4 border border-pink-50">
                    <p className="text-xs text-slate-400">Total Budget</p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {onboarding.budget_total ? formatCurrency(onboarding.budget_total) : "—"}
                    </p>
                  </div>
                </div>

              </>
            )}
          </div>
        )}

        {activeTab === "budget" && (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700">Budget planner</h2>
              {!editingBudget && (
                <button
                  onClick={() => setEditingBudget(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#ff4f86] transition hover:bg-[#fff1f6]"
                >
                  <PencilIcon /> Edit
                </button>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-pink-100 bg-linear-to-br from-[#fff1f6] to-white px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total Budget</p>
              <p className="mt-1 text-2xl font-black text-[#ff4f86]">
                {formatCurrency(editingBudget ? editableBudgetTotal : onboarding.budget_total || 0)}
              </p>
            </div>

            {editingBudget ? (
              <div className="mt-6 space-y-4">
                {editBudgetAllocations.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    No budget breakdown found yet. Update journey step budgets first.
                  </p>
                ) : (
                  editBudgetAllocations.map((alloc, idx) => (
                    <div key={`${alloc.step_id || alloc.slug || "step"}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-slate-700">{alloc.title || alloc.slug || "Step"}</div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                          {formatCurrency(alloc.amount)}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[210px,1fr]">
                        <input
                          type="number"
                          min="0"
                          max={Math.max(Number(alloc.max_budget) || 0, Number(alloc.amount) || 0, MAX_BUDGET_PER_STEP)}
                          step={BUDGET_STEP}
                          value={Number(alloc.amount) || 0}
                          onChange={(e) => {
                            const maxBudget = Math.max(Number(alloc.max_budget) || 0, Number(alloc.amount) || 0, MAX_BUDGET_PER_STEP);
                            const value = Math.max(0, Math.min(maxBudget, Number(e.target.value) || 0));
                            setEditBudgetAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: value } : item))
                            );
                          }}
                          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#ff4f86]"
                        />
                        <input
                          type="range"
                          min="0"
                          max={Math.max(Number(alloc.max_budget) || 0, Number(alloc.amount) || 0, MAX_BUDGET_PER_STEP)}
                          step={BUDGET_STEP}
                          value={Number(alloc.amount) || 0}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setEditBudgetAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: value } : item))
                            );
                          }}
                          className="w-full cursor-pointer accent-[#ff4f86]"
                        />
                      </div>
                    </div>
                  ))
                )}

                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={handleSaveBudget}
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-[#ff3d79] disabled:opacity-60"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckIcon />}
                    Save Budget
                  </button>
                  <button
                    onClick={() => {
                      setEditingBudget(false);
                      setEditBudgetAllocations(profile?.onboarding?.budget_allocations || []);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                  >
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                {budgetAllocations.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    No budget allocations found yet.
                  </p>
                ) : (
                  budgetAllocations.map((alloc, i) => (
                    <div key={`${alloc.step_id || alloc.slug || "step"}-${i}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3">
                      <span className="text-sm font-medium text-slate-600">{alloc.title || alloc.slug || "Step"}</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(alloc.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Addresses Tab ───────────────────────────────── */}
        {activeTab === "addresses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-700">
                Saved Addresses ({addresses.length})
              </h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#ff4f86] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,79,134,0.25)] transition hover:bg-[#ff3d79]"
              >
                <PlusIcon /> Add Address
              </button>
            </div>

            {/* Address cards */}
            {addresses.length === 0 && !showAddForm && (
              <div className="rounded-3xl border border-slate-100 bg-white/80 px-8 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
                <LocationIcon />
                <p className="mt-3 text-sm text-slate-500">No saved addresses</p>
                <p className="text-xs text-slate-400">Add an address so you can check out faster!</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-[#fff1f6] px-2.5 py-1 text-xs font-semibold text-[#ff4f86]">
                      {addr.label || "Address"}
                    </span>
                    <button
                      onClick={() => handleRemoveAddress(i)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Remove address"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="mt-3 space-y-0.5 text-sm text-slate-600">
                    {addr.line1 && <p>{addr.line1}</p>}
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>{[addr.city, addr.state].filter(Boolean).join(", ")}</p>
                    {addr.pincode && <p className="font-semibold">{addr.pincode}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Add address form */}
            {showAddForm && (
              <div className="rounded-3xl border border-[#ff4f86]/20 bg-white/90 p-6 shadow-[0_8px_40px_rgba(255,79,134,0.08)] backdrop-blur">
                <h3 className="text-sm font-semibold text-slate-700">New Address</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Label</label>
                    <select
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff4f86]"
                    >
                      <option>Home</option>
                      <option>Work</option>
                      <option>Wedding Venue</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">Pincode *</label>
                    <input type="text" maxLength={6} value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff4f86]" placeholder="110001" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400">Address Line 1 *</label>
                    <input type="text" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff4f86]" placeholder="House no, Building, Street" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400">Address Line 2</label>
                    <input type="text" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff4f86]" placeholder="Area, Landmark" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">City *</label>
                    <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff4f86]" placeholder="Delhi" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400">State</label>
                    <input type="text" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#ff4f86]" placeholder="Delhi" />
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <button onClick={handleAddAddress} disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-[#ff3d79] disabled:opacity-60">
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckIcon />}
                    Save Address
                  </button>
                  <button onClick={() => setShowAddForm(false)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50">
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
