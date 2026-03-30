"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Plus,
  Pencil,
  MoreHorizontal,
  ExternalLink,
  MapPin,
  IndianRupee,
  BadgeCheck,
  Search,
  ArrowUpDown,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/Combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const ITEMS_PAGE_SIZE = 10;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function ItemsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stepSlug = searchParams.get("step") || "";
  const categoryId = searchParams.get("category") || "";
  const subcategoryId = searchParams.get("subcategory") || "";
  const vendorId = searchParams.get("vendor") || "";
  const listQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "updated_at").trim();
  const dir = (searchParams.get("dir") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [draftQ, setDraftQ] = useState(listQ);
  const [steps, setSteps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);

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
      const s = q.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    }, 400);
    return () => clearTimeout(h);
  }, [draftQ, listQ, pathname, router, searchParams]);

  const setSort = useCallback(
    (field) => {
      const q = new URLSearchParams(searchParams.toString());
      const cur = (q.get("sort") || "updated_at").trim();
      const curDir = (q.get("dir") || "desc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "name" || field === "slug" || field === "location_city" || field === "status" ? "asc" : "desc");
      }
      q.set("page", "1");
      const s = q.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const replaceQuery = useCallback(
    (updates) => {
      const q = new URLSearchParams(searchParams.toString());
      if (updates.step !== undefined) {
        if (updates.step) q.set("step", updates.step);
        else q.delete("step");
        q.delete("category");
        q.delete("subcategory");
        q.set("page", "1");
      }
      if (updates.category !== undefined) {
        if (updates.category) q.set("category", updates.category);
        else q.delete("category");
        if (updates.subcategory === undefined) q.delete("subcategory");
        q.set("page", "1");
      }
      if (updates.subcategory !== undefined) {
        if (updates.subcategory) q.set("subcategory", updates.subcategory);
        else q.delete("subcategory");
        q.set("page", "1");
      }
      if (updates.vendor !== undefined) {
        if (updates.vendor) q.set("vendor", updates.vendor);
        else q.delete("vendor");
        q.set("page", "1");
      }
      const s = q.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadItems = useCallback(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (stepSlug) qs.set("step", stepSlug);
    if (categoryId) qs.set("categoryId", categoryId);
    if (subcategoryId) qs.set("subcategoryId", subcategoryId);
    if (vendorId) qs.set("vendorId", vendorId);
    if (listQ) qs.set("q", listQ);
    qs.set("sort", sort);
    qs.set("dir", dir);
    qs.set("page", String(page));
    qs.set("limit", String(ITEMS_PAGE_SIZE));
    fetch(`${API_BASE}/admin/items?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setTotal(Number(d.total) || 0);
      })
      .catch((err) => console.error("Failed to load items:", err))
      .finally(() => setLoading(false));
  }, [stepSlug, categoryId, subcategoryId, vendorId, listQ, sort, dir, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/journey-steps?limit=500&sort=order&dir=asc`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSteps(d.steps || []));
    fetch(`${API_BASE}/admin/vendors?limit=500`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors || []));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const url = stepSlug
      ? `${API_BASE}/admin/categories?step=${encodeURIComponent(stepSlug)}`
      : `${API_BASE}/admin/categories`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, [stepSlug]);

  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        value: s.slug,
        label: `${Number(s.order) || 0}. ${s.title}`,
        keywords: `${s.slug} ${s.title}`,
      })),
    [steps],
  );

  const parentCategories = categories.filter((c) => !c.parent_category_id);
  const subcategories = categories.filter((c) => !!c.parent_category_id);
  const categoryOptions = parentCategories.map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug || "" }));
  const subcategoryOptions = subcategories
    .filter((c) => (categoryId ? c.parent_category_id === categoryId : false))
    .map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug || "" }));

  const hasSubcategoryFilter = categoryId && subcategoryOptions.length > 0;

  const vendorOptions = vendors.map((v) => ({
    value: v.vendor_id,
    label: `${v.business_name}${v.city ? ` (${v.city})` : ""}`,
    keywords: `${v.vendor_type || ""} ${v.city || ""} ${v.contact_email || v.email || ""}`.trim(),
  }));

  const canPrev = page > 1;
  const canNext = page * ITEMS_PAGE_SIZE < total;

  function goPage(nextPage) {
    const q = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) q.delete("page");
    else q.set("page", String(nextPage));
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

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
    <div className="space-y-8 px-1 pb-10">
      <SectionHeader
        title="Products and venues"
        description="Filters update the URL and reload the catalog from the server. Leave journey phase as “All phases” to see everything."
        action={
          <Button asChild className="h-10 gap-2 rounded-lg bg-pink-600 px-4 font-medium hover:bg-pink-700">
            <Link href="/items/new">
              <Plus className="h-4 w-4" />
              Add item
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-100">
          <CardHeader className="space-y-4 border-b border-slate-50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="h-5 w-5 text-pink-500" />
                  Item catalog
                </CardTitle>
                <CardDescription>
                  Journey phase uses the step slug in the URL (e.g. <span className="font-mono text-xs">?step=venues</span>
                  ). Category and vendor filters trigger a new API request.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-600">
                {loading ? "…" : `${total.toLocaleString()} total · page ${page}`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Journey phase</label>
                <Combobox
                  value={stepSlug}
                  onChange={(slug) => replaceQuery({ step: slug || "" })}
                  options={[{ value: "", label: "All phases", keywords: "all" }, ...stepOptions]}
                  placeholder="All phases"
                  className="w-full border-slate-100 bg-slate-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                <Combobox
                  value={categoryId}
                  onChange={(v) => replaceQuery({ category: v || "" })}
                  options={[{ value: "", label: "All categories", keywords: "all" }, ...categoryOptions]}
                  placeholder="Select category"
                  disabled={!stepSlug}
                  className="w-full border-slate-100 bg-slate-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</label>
                <Combobox
                  value={vendorId}
                  onChange={(v) => replaceQuery({ vendor: v || "" })}
                  options={[{ value: "", label: "All vendors", keywords: "all" }, ...vendorOptions]}
                  placeholder="Select vendor"
                  className="w-full border-slate-100 bg-slate-50/50"
                />
              </div>
              {hasSubcategoryFilter ? (
                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Subcategory</label>
                  <Combobox
                    value={subcategoryId}
                    onChange={(v) => replaceQuery({ subcategory: v || "" })}
                    options={[{ value: "", label: "All subcategories", keywords: "all" }, ...subcategoryOptions]}
                    placeholder="Select subcategory"
                    disabled={!categoryId}
                    className="w-full border-slate-100 bg-slate-50/50"
                  />
                </div>
              ) : null}
            </div>
            <div className="relative w-full pt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Search name, slug, description, city (server)…"
                className="h-10 border-slate-200 pl-10 ring-0 focus:border-pink-300 focus-visible:ring-0"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                <p className="text-sm font-medium text-slate-400">Loading</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-10 font-semibold text-slate-700">#</TableHead>
                      <SortHead field="name" className="min-w-[240px]">
                        Item
                      </SortHead>
                      <TableHead className="font-semibold text-slate-700">Vendor & category</TableHead>
                      <SortHead field="price">Price</SortHead>
                      <SortHead field="location_city">Location</SortHead>
                      <SortHead field="status">Status</SortHead>
                      <TableHead className="w-[80px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center italic text-slate-400">
                          No items for these filters. Try “All phases” or change the URL query.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((i, idx) => {
                        const vendor = vendors.find((v) => v.vendor_id === i.vendor_id);
                        const category = categories.find((c) => c.category_id === i.category_id);
                        const step = steps.find((s) => s.step_id === i.journey_step_id);
                        const primaryImage = i.images?.[0] || i.image_url;
                        const rowNum = (page - 1) * ITEMS_PAGE_SIZE + idx + 1;

                        return (
                          <TableRow key={i.item_id} className="transition-colors hover:bg-slate-50/30">
                            <TableCell className="text-sm font-medium tabular-nums text-slate-500">{rowNum}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                  {primaryImage ? (
                                    <Image
                                      src={primaryImage}
                                      alt={i.name}
                                      fill
                                      className="h-full w-full object-cover"
                                      sizes="56px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <Package className="h-5 w-5 text-slate-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-bold text-slate-800">{i.name}</span>
                                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-pink-500">
                                    {step?.title || "Phase"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                  <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                                  {vendor?.business_name || "Unknown vendor"}
                                </div>
                                <div className="text-xs text-slate-500">{category?.name || "—"}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm font-bold leading-none text-slate-900">
                                  <IndianRupee className="h-3.5 w-3.5 text-slate-600" />
                                  {Number(i.price).toLocaleString()}
                                </div>
                                {i.price_type ? (
                                  <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                                    per {i.price_type}
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {i.location_city || i.location || "Online"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex w-fit items-center gap-1.5 rounded-full px-3 py-1 font-bold shadow-sm transition-all",
                                  i.status === "Active"
                                    ? "border-emerald-200/60 bg-emerald-100/80 text-emerald-700 shadow-emerald-50"
                                    : "border-slate-200 bg-slate-100 text-slate-500",
                                )}
                              >
                                {i.status === "Active" && (
                                  <div className="relative flex h-2 w-2">
                                    <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                    <div className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                  </div>
                                )}
                                {i.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-slate-100">
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 p-1 shadow-lg">
                                  <DropdownMenuLabel className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Item actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-50" />
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50">
                                    <Link href={`/items/${i.item_id}/edit`} className="flex w-full cursor-pointer items-center gap-2">
                                      <Pencil className="h-4 w-4 text-slate-500" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="flex cursor-pointer items-center gap-2 rounded-lg focus:bg-pink-50">
                                    <ExternalLink className="h-4 w-4 text-slate-500" />
                                    View on site
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <div className="flex flex-col gap-3 border-t border-slate-50 bg-slate-50/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {total.toLocaleString()} items · {ITEMS_PAGE_SIZE} per page
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
              <div className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 font-mono text-xs font-bold">
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
