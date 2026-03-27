"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserCircle, Mail, Phone, MapPin, Calendar, DollarSign, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:5000";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) fetchUser();
  }, [params.id]);

  async function fetchUser() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/users/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch user");
      setUser(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const variants = {
      Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Partial: "bg-amber-100 text-amber-800 border-amber-200",
      Inactive: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return (
      <Badge className={`border ${variants[status] || variants.Inactive} px-3 py-1 text-sm`}>
        {status || "Unknown"}
      </Badge>
    );
  }

  function formatOnboardingStatus(status) {
    if (!status) return "Not started";
    const map = {
      yes: "Engaged",
      getting_engaged_soon: "Getting Engaged Soon",
      just_exploring: "Just Exploring",
    };
    return map[status] || status;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCurrency(amount) {
    if (!amount) return "₹0";
    const num = Number(amount);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    return `₹${num.toLocaleString("en-IN")}`;
  }

  function getWeddingDateInfo() {
    if (!user.onboarding) return null;
    const { wedding_date_type, wedding_date, wedding_month } = user.onboarding;
    
    if (!wedding_date_type) return "Not specified";
    
    if (wedding_date_type === "exact" && wedding_date) {
      return formatDate(wedding_date);
    }
    if (wedding_date_type === "month" && wedding_month) {
      return new Date(wedding_month + "-01").toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }
    if (wedding_date_type === "not_decided") {
      return "Not decided yet";
    }
    return wedding_date_type;
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground">Loading user details...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || "User not found"}</p>
        <Button onClick={() => router.push("/admin/users")}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
          <p className="text-sm text-muted-foreground">
            Complete information about {user.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle className="size-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div className="font-medium">{user.name || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Phone Number</div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span>{user.phone || "-"}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span>{user.email || "Not provided"}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="mt-1">{getStatusBadge(user.status)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completed Signup</div>
              <div className="flex items-center gap-2">
                {user.completed_signup ? (
                  <>
                    <CheckCircle className="size-4 text-emerald-600" />
                    <span className="font-medium">Yes</span>
                  </>
                ) : (
                  <>
                    <Clock className="size-4 text-amber-600" />
                    <span className="font-medium">In Progress</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="size-5" />
              Onboarding Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Engagement Status</div>
              <div className="font-medium">
                {formatOnboardingStatus(user.onboarding?.engagement_status)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Wedding Date</div>
              <div className="font-medium">{getWeddingDateInfo()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Venue Location</div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span>{user.onboarding?.venue_location || "Not specified"}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Guest Count</div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span>{user.onboarding?.guests_count || "Not specified"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="size-5" />
              Budget Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(user.onboarding?.budget_total)}
              </div>
            </div>

            {user.onboarding?.budget_allocations && user.onboarding.budget_allocations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Budget Allocations
                </div>
                {user.onboarding.budget_allocations.map((allocation, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm">{allocation.title}</span>
                    <span className="font-medium">{formatCurrency(allocation.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="size-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="text-sm text-muted-foreground">Created At</div>
                <div className="mt-1 font-medium">{formatDate(user.created_at)}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="mt-1 font-medium">{formatDate(user.updated_at)}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4">
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="mt-1 font-mono text-sm">{user._id}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
