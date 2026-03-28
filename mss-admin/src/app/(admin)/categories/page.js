"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FolderTree, Plus, Pencil, MoreHorizontal, Layers, LayoutGrid, Search, Globe, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function CategoriesPage() {
  const sp = useSearchParams();
  const [steps, setSteps] = useState([]);
  const [stepId, setStepId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = d.steps || [];
        setSteps(list);
        const fromQuery = sp.get("stepId") || "";
        setStepId(fromQuery || "");
      });
  }, [sp]);

  function loadCats(activeStepId) {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (activeStepId) qs.set("journeyStepId", activeStepId);
    fetch(`${API_BASE}/admin/categories?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCats(stepId);
  }, [stepId]);

  const stepOptions = [
    { value: "", label: "Filter by all phases", keywords: "all" },
    ...steps.map((s) => ({
      value: s.step_id,
      label: `${Number(s.order) || 0}. ${s.title}`,
      keywords: s.slug,
    })),
  ];

  const stepNameById = new Map(steps.map((s) => [s.step_id, s.title]));

  const { parentCategories, childrenByParentId } = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_category_id);
    const m = new Map();
    for (const c of categories) {
      if (!c.parent_category_id) continue;
      const arr = m.get(c.parent_category_id) || [];
      arr.push(c);
      m.set(c.parent_category_id, arr);
    }
    return { parentCategories: parents, childrenByParentId: m };
  }, [categories]);

  const q = search.trim().toLowerCase();
  const filteredParents = parentCategories.filter((p) => {
    if (!q) return true;
    const pHit = `${p.name} ${p.slug || ""}`.toLowerCase().includes(q);
    const subs = childrenByParentId.get(p.category_id) || [];
    const subHit = subs.some((c) => `${c.name} ${c.slug || ""}`.toLowerCase().includes(q));
    return pHit || subHit;
  });

  function visibleSubcategories(parent) {
    const subs = childrenByParentId.get(parent.category_id) || [];
    if (!q) return subs;
    const parentHit = `${parent.name} ${parent.slug || ""}`.toLowerCase().includes(q);
    if (parentHit) return subs;
    return subs.filter((c) => `${c.name} ${c.slug || ""}`.toLowerCase().includes(q));
  }

  return (
    <div className="space-y-8 pb-10 px-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Category Library</h1>
          <p className="text-sm text-slate-500 mt-1">
            Build your store hierarchy across various wedding journey steps.
          </p>
        </div>
        <Button asChild className="h-11 gap-2 bg-pink-600 hover:bg-pink-700 shadow-md">
          <Link href={stepId ? `/categories/new?stepId=${encodeURIComponent(stepId)}` : "/categories/new"}>
            <Plus className="h-4 w-4" />
            Add New Category
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
          <CardHeader className="space-y-4 pb-6 border-b border-slate-50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-50 ring-1 ring-pink-100">
                  <FolderTree className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Hierarchy Management</CardTitle>
                  <CardDescription>
                    {stepId ? `Showing categories for "${stepNameById.get(stepId)}"` : 'Showing all categories across the platform'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                   <Combobox
                    value={stepId}
                    onChange={setStepId}
                    options={stepOptions}
                    placeholder="All journey phases"
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search name or slug..." 
                    className="pl-10 h-10 border-slate-200 focus:border-pink-300 ring-0 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                <p className="text-sm font-medium text-slate-400">Loading hierarchy...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 w-[300px]">Category</TableHead>
                      <TableHead className="font-semibold text-slate-700">Journey phase</TableHead>
                      <TableHead className="font-semibold text-slate-700">Slug (auto)</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                          {categories.length === 0 ? "No categories yet. Click 'Add New' to begin." : "No matching results found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredParents.map((parent) => {
                        const subs = visibleSubcategories(parent);
                        return (
                        <Fragment key={parent.category_id}>
                          <TableRow className="hover:bg-slate-50/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                  {parent.image_url ? (
                                    <img src={parent.image_url} alt={parent.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <LayoutGrid className="h-5 w-5 text-slate-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-800">{parent.name}</span>
                                  {subs.length > 0 ? (
                                    <p className="text-[11px] font-medium text-slate-400">
                                      {subs.length} subcategor{subs.length === 1 ? "y" : "ies"} — edit to manage
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-slate-200 bg-white font-medium text-slate-600">
                                {stepNameById.get(parent.journey_step_id) || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-mono text-xs lowercase text-slate-400">
                                <Globe className="h-3 w-3 shrink-0" />
                                {parent.slug || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 font-black text-[10px] shadow-sm transition-all",
                                  parent.is_active
                                    ? "border-emerald-200/60 bg-emerald-100/80 text-emerald-700 shadow-emerald-50"
                                    : "border-slate-200 bg-slate-100 text-slate-500",
                                )}
                              >
                                {parent.is_active ? "LIVE" : "DRAFT"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-slate-100">
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 p-1 shadow-lg">
                                  <DropdownMenuLabel className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Actions
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-50" />
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50">
                                    <Link href={`/categories/${parent.category_id}/edit`} className="flex w-full cursor-pointer items-center gap-2">
                                      <Pencil className="h-4 w-4 text-slate-500" />
                                      Edit category
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50">
                                    <Link href={`/items?categoryId=${parent.category_id}`} className="flex w-full cursor-pointer items-center gap-2">
                                      <ChevronRight className="h-4 w-4 text-slate-500" />
                                      View items
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {subs.map((child) => (
                            <TableRow
                              key={child.category_id}
                              className="border-l-2 border-l-pink-200/60 bg-slate-50/40 hover:bg-slate-50/80"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3 pl-8">
                                  <Layers className="h-4 w-4 shrink-0 text-pink-400" />
                                  <span className="text-sm font-semibold text-slate-700">{child.name}</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Subcategory</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-slate-200 bg-white text-xs font-medium text-slate-500">
                                  {stepNameById.get(child.journey_step_id) || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 font-mono text-xs lowercase text-slate-400">
                                  <Globe className="h-3 w-3 shrink-0" />
                                  {child.slug || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 font-black text-[10px]",
                                    child.is_active
                                      ? "border-emerald-200/60 bg-emerald-100/80 text-emerald-700"
                                      : "border-slate-200 bg-slate-100 text-slate-500",
                                  )}
                                >
                                  {child.is_active ? "LIVE" : "DRAFT"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-slate-100">
                                      <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 p-1 shadow-lg">
                                    <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50">
                                      <Link href={`/categories/${child.category_id}/edit`} className="flex w-full cursor-pointer items-center gap-2">
                                        <Pencil className="h-4 w-4 text-slate-500" />
                                        Edit subcategory
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50">
                                      <Link href={`/items?categoryId=${parent.category_id}`} className="flex w-full cursor-pointer items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                        Items (parent)
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
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
