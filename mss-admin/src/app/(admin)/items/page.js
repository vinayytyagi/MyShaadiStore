"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Package, 
  Plus, 
  Pencil, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ExternalLink,
  MapPin,
  IndianRupee,
  BadgeCheck,
  ChevronDown
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
import { Combobox } from "@/components/Combobox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ stepId: "", categoryId: "", subcategoryId: "", vendorId: "" });

  function loadItems(nextFilters = filters) {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (nextFilters.stepId) qs.set("journeyStepId", nextFilters.stepId);
    if (nextFilters.categoryId) qs.set("categoryId", nextFilters.categoryId);
    if (nextFilters.subcategoryId) qs.set("subcategoryId", nextFilters.subcategoryId);
    if (nextFilters.vendorId) qs.set("vendorId", nextFilters.vendorId);
    fetch(`${API_BASE}/admin/items?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch((err) => console.error("Failed to load items:", err))
      .finally(() => setLoading(false));
  }

  function loadStepsAndVendors() {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = d.steps || [];
        setSteps(list);
        // Default to first step if nothing selected
        if (list.length > 0 && !filters.stepId) {
          setFilters((f) => ({ ...f, stepId: list[0].step_id }));
        }
      });
    fetch(`${API_BASE}/admin/vendors`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors || []));
  }

  function loadCategories(stepId) {
    const token = getToken();
    if (!token || !stepId) {
      setCategories([]);
      return;
    }
    fetch(`${API_BASE}/admin/categories?journeyStepId=${encodeURIComponent(stepId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }

  useEffect(() => {
    loadStepsAndVendors();
  }, []);

  useEffect(() => {
    if (filters.stepId) loadCategories(filters.stepId);
    setFilters((f) => ({ ...f, categoryId: "", subcategoryId: "" }));
  }, [filters.stepId]);

  useEffect(() => {
    loadItems(filters);
  }, [filters.stepId, filters.categoryId, filters.subcategoryId, filters.vendorId]);

  const stepOptions = steps.map((s) => ({
    value: s.step_id,
    label: `${Number(s.order) || 0}. ${s.title}`,
    keywords: s.slug,
  }));
  const currentStep = steps.find((s) => s.step_id === filters.stepId);
  const isShopping = currentStep?.slug === "shopping";
  const parentCategories = categories.filter((c) => !c.parent_category_id);
  const subcategories = categories.filter((c) => !!c.parent_category_id);
  const categoryOptions = parentCategories.map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));
  const subcategoryOptions = subcategories
    .filter((c) => (filters.categoryId ? c.parent_category_id === filters.categoryId : true))
    .map((c) => ({ value: c.category_id, label: c.name, keywords: c.slug }));
  const vendorOptions = vendors.map((v) => ({
    value: v.vendor_id,
    label: `${v.business_name}${v.city ? ` (${v.city})` : ""}`,
    keywords: `${v.vendor_type || ""} ${v.city || ""} ${v.contact_email || v.email || ""}`.trim(),
  }));

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Products and venues"
        description="Manage your entire catalog across wedding journey phases."
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
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
          <CardHeader className="space-y-4 pb-6 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-pink-500" />
                  Item Catalog
                </CardTitle>
                <CardDescription>
                  Filter by phase, category or vendor to find specific items.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-100 bg-slate-50 px-3 py-1 text-slate-600 font-medium">
                {items.length} Items Found
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Journey Phase</label>
                <Combobox
                  value={filters.stepId}
                  onChange={(v) => setFilters((f) => ({ ...f, stepId: v }))}
                  options={[{ value: "", label: "All phases" }, ...stepOptions]}
                  placeholder="Select phase"
                  className="w-full bg-slate-50/50 border-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Category</label>
                <Combobox
                  value={filters.categoryId}
                  onChange={(v) => setFilters((f) => ({ ...f, categoryId: v, subcategoryId: "" }))}
                  options={[{ value: "", label: "All categories" }, ...categoryOptions]}
                  placeholder="Select category"
                  disabled={!filters.stepId}
                  className="w-full bg-slate-50/50 border-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Vendor Partner</label>
                <Combobox
                  value={filters.vendorId}
                  onChange={(v) => setFilters((f) => ({ ...f, vendorId: v }))}
                  options={[{ value: "", label: "All vendors" }, ...vendorOptions]}
                  placeholder="Select vendor"
                  className="w-full bg-slate-50/50 border-slate-100"
                />
              </div>
              {isShopping && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Subcategory</label>
                  <Combobox
                    value={filters.subcategoryId}
                    onChange={(v) => setFilters((f) => ({ ...f, subcategoryId: v }))}
                    options={[{ value: "", label: "All subcategories" }, ...subcategoryOptions]}
                    placeholder="Select subcategory"
                    disabled={!filters.categoryId}
                    className="w-full bg-slate-50/50 border-slate-100"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                <p className="text-sm font-medium text-slate-400">Syncing with catalog...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 w-[300px]">Item Information</TableHead>
                      <TableHead className="font-semibold text-slate-700">Vendor & Category</TableHead>
                      <TableHead className="font-semibold text-slate-700">Price Info</TableHead>
                      <TableHead className="font-semibold text-slate-700">Location</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                          No items found for the selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((i) => {
                        const vendor = vendors.find((v) => v.vendor_id === i.vendor_id);
                        const category = categories.find((c) => c.category_id === i.category_id);
                        const step = steps.find((s) => s.step_id === i.journey_step_id);
                        const primaryImage = i.images?.[0] || i.image_url;

                        return (
                          <TableRow key={i.item_id} className="hover:bg-slate-50/30 transition-colors">
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
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-slate-800 truncate">{i.name}</span>
                                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mt-1">
                                    {step?.title || "Phase"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                                  <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                                  {vendor?.business_name || "Unknown Vendor"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {category?.name || "No Category"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm font-bold text-slate-900 leading-none">
                                  <IndianRupee className="h-3.5 w-3.5 text-slate-600" />
                                  {Number(i.price).toLocaleString()}
                                </div>
                                {i.price_type && (
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                                    per {i.price_type}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {i.location_city || i.location || "Online"}
                              </div>
                            </TableCell>
                             <TableCell>
                               <Badge 
                                 variant="outline" 
                                 className={cn(
                                   "flex items-center gap-1.5 w-fit px-3 py-1 rounded-full font-bold transition-all shadow-sm",
                                   i.status === "Active" 
                                     ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/60 shadow-emerald-50" 
                                     : "bg-slate-100 text-slate-500 border-slate-200"
                                 )}
                               >
                                 {i.status === "Active" && (
                                   <div className="relative flex h-2 w-2">
                                     <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                     <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                   </div>
                                 )}
                                 {i.status}
                               </Badge>
                             </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-100">
                                  <DropdownMenuLabel className="text-xs text-slate-400 font-bold uppercase tracking-wider px-2 py-2">Item Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-50" />
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                    <Link href={`/items/${i.item_id}/edit`} className="flex items-center gap-2 cursor-pointer w-full">
                                      <Pencil className="h-4 w-4 text-slate-500" />
                                      Edit Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-lg focus:bg-pink-50 transition-colors cursor-pointer flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-slate-500" />
                                    View on Site
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
        </Card>
      </div>
    </div>
  );
}
