"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, MoreHorizontal, Pencil, Store, Mail, MapPin, Percent, CircleX, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const PAGE_SIZE = 25;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function VendorsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const listQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "business_name").trim();
  const dir = (searchParams.get("dir") || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const cur = (q.get("sort") || "business_name").trim();
      const curDir = (q.get("dir") || "asc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "created_at" || field === "updated_at" ? "desc" : "asc");
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

  const load = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (listQ) qs.set("q", listQ);
    qs.set("sort", sort);
    qs.set("dir", dir);
    qs.set("page", String(page));
    qs.set("limit", String(PAGE_SIZE));
    fetch(`${API_BASE}/admin/vendors?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setVendors(d.vendors || []);
        setTotal(Number(d.total) || 0);
      })
      .catch((err) => console.error("Failed to load vendors:", err))
      .finally(() => setLoading(false));
  }, [listQ, sort, dir, page]);

  useEffect(() => {
    load();
  }, [load]);

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
            active && "text-pink-700",
          )}
        >
          {children}
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <SectionHeader
        title="Vendor management"
        description="Oversee wedding service partners and their credentials."
        action={
          <Button asChild className="h-10 gap-2 rounded-lg bg-pink-600 px-4 font-medium hover:bg-pink-700">
            <Link href="/vendors/new">
              <Plus className="h-4 w-4" />
              New vendor
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        {/* Statistics or Filters Row (Optional) */}
        
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-50 py-5">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Store className="h-5 w-5 text-pink-500" />
                All Vendors
              </CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${total.toLocaleString()} vendors · page ${page}`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Search business name, email or city…"
                className="pl-10 h-10 border-slate-200 focus:border-pink-300 ring-0 focus-visible:ring-0"
              />
            </div>
          </CardHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Loading vendor base...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-10 font-semibold text-slate-700">#</TableHead>
                    <SortHead field="business_name">Business</SortHead>
                    <SortHead field="vendor_type">Type</SortHead>
                    <SortHead field="city">Location</SortHead>
                    <TableHead className="font-semibold text-slate-700">Commission</TableHead>
                    <SortHead field="status">Status</SortHead>
                    <TableHead className="text-right w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">
                        No vendors match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((v, idx) => (
                      <TableRow key={v.vendor_id} className="hover:bg-slate-50/30 transition-colors">
                        <TableCell className="text-sm font-medium tabular-nums text-slate-500">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{v.business_name}</span>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                              <Mail className="h-3 w-3" />
                              {v.contact_email || v.email || "No email"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-medium">
                            {v.vendor_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {v.city || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-pink-50/50 w-fit px-2 py-0.5 rounded-lg border border-pink-100">
                            <Percent className="h-3.5 w-3.5 text-pink-500" />
                            {v.commission_percentage != null ? `${v.commission_percentage}%` : "0%"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "flex items-center gap-1.5 w-fit px-3 py-1 rounded-full font-bold transition-all",
                              v.status === "Active" 
                                ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-50" 
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            {v.status === "Active" ? (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                            ) : (
                              <CircleX className="h-3 w-3" />
                            )}
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-100">
                              <DropdownMenuLabel className="px-2 py-2 text-xs font-medium text-slate-500">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-slate-50" />
                              <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                <Link href={`/vendors/${v.vendor_id}/edit`} className="flex items-center gap-2 cursor-pointer w-full">
                                  <Pencil className="h-4 w-4 text-slate-500" />
                                  Edit Vendor
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg focus:bg-pink-50 text-pink-600 focus:text-pink-700 transition-colors cursor-pointer flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Review Items
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-slate-50 bg-slate-50/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {total.toLocaleString()} records · {PAGE_SIZE} per page
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-slate-200"
                disabled={!canPrev || loading}
                onClick={() => goPage(page - 1)}
              >
                Previous
              </Button>
              <div className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold">
                {page}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-slate-200"
                disabled={!canNext || loading}
                onClick={() => goPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
