"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Mail,
  Search,
  ChevronRight,
  User,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const PAGE_SIZE = 25;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function QuotationRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const listQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "created_at").trim();
  const dir = (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [requests, setRequests] = useState([]);
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
      const cur = (q.get("sort") || "created_at").trim();
      const curDir = (q.get("dir") || "desc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "email_status" ? "asc" : "desc");
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
    fetch(`${API_BASE}/admin/quotation-requests?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setTotal(Number(data.total) || 0);
      })
      .catch((err) => console.error("Failed to load requests:", err))
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
            active && "text-emerald-800",
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
        title="Inbox and quotations"
        description="Review and respond to customer item baskets and pricing inquiries."
        action={
          <Badge variant="outline" className="flex h-10 items-center gap-2 border-slate-200 bg-white px-4 py-1.5 text-slate-600 font-medium">
            <Mail className="h-4 w-4 text-emerald-500" />
            {loading ? "…" : `${total.toLocaleString()} inquiries`}
          </Badge>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-50 bg-white py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Quotation journal</CardTitle>
              <CardDescription>Search by customer or request id; sort and page via the URL.</CardDescription>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Search name, phone, email, id…"
              className="h-10 border-slate-200 pl-10 ring-0 focus:border-emerald-300 focus-visible:ring-0"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Opening inquiry box...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-10 font-semibold text-slate-700">#</TableHead>
                    <TableHead className="w-[260px] font-semibold text-slate-700">Customer</TableHead>
                    <TableHead className="font-semibold text-slate-700">Basket</TableHead>
                    <SortHead field="email_status">Email status</SortHead>
                    <SortHead field="created_at">Submitted</SortHead>
                    <TableHead className="w-[80px] text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                        {total === 0 ? "Inbox is empty." : "No matching inquiries found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r, idx) => (
                      <TableRow
                        key={r.quotation_request_id}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/30"
                        onClick={() => router.push(`/quotation-requests/${r.quotation_request_id}`)}
                      >
                        <TableCell className="text-sm font-medium tabular-nums text-slate-500">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-bold text-slate-500">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-bold text-slate-800">{r.customer?.name || "Interested lead"}</span>
                              <span className="text-xs text-slate-400">{r.customer?.phone || "Phone hidden"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <Layers className="h-4 w-4 text-emerald-400" />
                            {Array.isArray(r.items) ? r.items.length : 0} items
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">in basket</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-bold shadow-sm transition-all",
                              r.email_status === "sent"
                                ? "border-emerald-200/60 bg-emerald-100/80 text-emerald-700 shadow-emerald-50"
                                : "border-amber-200/60 bg-amber-100/80 text-amber-700 shadow-amber-50",
                            )}
                          >
                            {r.email_status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {(r.email_status || "Queueing").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(r.created_at).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <ChevronRight className="h-5 w-5" />
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
  );
}
