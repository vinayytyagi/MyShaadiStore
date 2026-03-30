"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UserCircle,
  Users,
  Search,
  ChevronRight,
  Mail,
  Phone,
  BadgeIndianRupee,
  Clock,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const PAGE_SIZE = 25;

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const listQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "created_at").trim();
  const dir = (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [draftQ, setDraftQ] = useState(listQ);

  useEffect(() => {
    setDraftQ(listQ);
  }, [listQ]);

  useEffect(() => {
    if (draftQ === listQ) return;
    const h = setTimeout(() => {
      const q = new URLSearchParams(searchParams.toString());
      if (draftQ.trim()) q.set("q", draftQ.trim());
      else q.delete("q");
      q.set("page", "1");
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    }, 400);
    return () => clearTimeout(h);
  }, [draftQ, listQ, pathname, router, searchParams]);

  const setSort = useCallback(
    (field) => {
      const q = new URLSearchParams(searchParams.toString());
      const cur = (q.get("sort") || "created_at").trim();
      const curDir = (q.get("dir") || "desc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "name" || field === "phone" || field === "email" ? "asc" : "desc");
      }
      q.set("page", "1");
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function goPage(nextPage) {
    const q = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) q.delete("page");
    else q.set("page", String(nextPage));
    router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("mss_token");
    try {
      const qs = new URLSearchParams();
      if (listQ) qs.set("q", listQ);
      qs.set("sort", sort);
      qs.set("dir", dir);
      qs.set("page", String(page));
      qs.set("limit", String(PAGE_SIZE));
      const res = await fetch(`${API_BASE}/admin/users?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data.users || []);
      setTotal(Number(data.total) || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [listQ, sort, dir, page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const canPrev = page > 1;
  const canNext = page * PAGE_SIZE < total;

  function SortHead({ field, children, className }) {
    const active = sort === field;
    return (
      <TableHead className={cn("font-semibold text-slate-700", className)}>
        <button
          type="button"
          onClick={() => setSort(field)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-slate-100/80",
            active && "text-blue-700",
          )}
        >
          {children}
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Customer directory"
        description="Browse and manage registered couples and planning users."
        action={
          <Badge variant="outline" className="flex h-10 items-center gap-2 border-slate-200 bg-white px-4 py-1.5 text-slate-600 font-medium">
            <Users className="h-4 w-4 text-blue-500" />
            {loading ? "…" : `${total.toLocaleString()} registered users`}
          </Badge>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-50 py-5">
           <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 ring-1 ring-blue-100">
                <UserCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">User Management</CardTitle>
                <CardDescription>Search and sort are server-side; filters live in the URL.</CardDescription>
              </div>
            </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search name, phone, email…"
              className="pl-10 h-10 border-slate-200 focus:border-blue-300 ring-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Syncing user database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-10 font-semibold text-slate-700">#</TableHead>
                    <SortHead field="name" className="min-w-[200px]">
                      Customer profile
                    </SortHead>
                    <SortHead field="email">Contact</SortHead>
                    <TableHead className="font-semibold text-slate-700">Planning status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Allocated budget</TableHead>
                    <SortHead field="created_at" className="whitespace-nowrap">
                      Joined
                    </SortHead>
                    <TableHead className="w-[60px] text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-red-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">
                        {total === 0 ? "No customers registered yet." : "No matching users found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user, idx) => (
                      <TableRow key={user._id} className="group transition-colors hover:bg-slate-50/30">
                        <TableCell className="text-sm font-medium tabular-nums text-slate-500">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0 border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-linear-to-br from-slate-100 to-slate-200 text-slate-500 font-semibold uppercase">
                                {user.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 truncate">{user.name || "Unnamed User"}</span>
                              <Badge 
                                variant={user.status === 'Active' ? 'success' : 'secondary'} 
                                className={cn(
                                  "w-fit text-[9px] px-1.5 py-0.5 mt-1 leading-none uppercase tracking-wider flex items-center gap-1",
                                  user.status === 'Active' && "bg-emerald-50 text-emerald-800 border-emerald-100"
                                )}
                              >
                                {user.status === 'Active' && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                )}
                                {user.status || 'Active'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1 text-xs text-slate-500">
                             <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[140px]">{user.email || "No email"}</span>
                             </div>
                             <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {user.phone || "—"}
                             </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-slate-600">
                                {user.onboarding?.engagement_status === 'yes' ? 'Engaged' :
                                 user.onboarding?.engagement_status === 'getting_engaged_soon' ? 'Planning' : 'Just exploring'}
                              </span>
                              {user.onboarding?.wedding_date && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(user.onboarding.wedding_date).toLocaleDateString()}
                                </span>
                              )}
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5">
                             <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                               <BadgeIndianRupee className="h-4 w-4 text-emerald-500" />
                               {user.onboarding?.budget_total ? 
                                 (Number(user.onboarding.budget_total) >= 100000 ? 
                                  `₹${(Number(user.onboarding.budget_total) / 100000).toFixed(1)}L` : 
                                  `₹${Number(user.onboarding.budget_total).toLocaleString()}`) : "₹0"}
                             </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                             <Calendar className="h-3.5 w-3.5" />
                             {new Date(user.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                           </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                           <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100" onClick={() => router.push(`/admin/users/${user._id}`)}>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {total.toLocaleString()} records · {PAGE_SIZE} per page
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-slate-200 px-4"
              disabled={!canPrev || loading}
              onClick={() => goPage(page - 1)}
            >
              Previous
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold">
              {page}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-slate-200 px-4"
              disabled={!canNext || loading}
              onClick={() => goPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
