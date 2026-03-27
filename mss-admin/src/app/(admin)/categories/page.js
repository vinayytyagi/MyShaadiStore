"use client";

import { useEffect, useState } from "react";
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

  const step = steps.find((s) => s.step_id === stepId);
  const isShopping = step?.slug === "shopping";
  const stepNameById = new Map(steps.map((s) => [s.step_id, s.title]));

  const filtered = categories.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${c.name} ${c.slug}`.toLowerCase().includes(q);
  });

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
                      <TableHead className="font-semibold text-slate-700 w-[300px]">Category Identity</TableHead>
                      <TableHead className="font-semibold text-slate-700">Journey Phase</TableHead>
                      {isShopping && <TableHead className="font-semibold text-slate-700">Parent Context</TableHead>}
                      <TableHead className="font-semibold text-slate-700">System Slug</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isShopping ? 6 : 5} className="h-32 text-center text-slate-400 italic">
                          {categories.length === 0 ? "No categories yet. Click 'Add New' to begin." : "No matching results found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((c) => (
                        <TableRow key={c.category_id} className="hover:bg-slate-50/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                                {c.image_url ? (
                                  <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                                ) : (
                                  <LayoutGrid className="h-5 w-5 text-slate-300" />
                                )}
                              </div>
                              <span className="font-bold text-slate-800">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-medium">
                              {stepNameById.get(c.journey_step_id) || "Global"}
                            </Badge>
                          </TableCell>
                          {isShopping && (
                            <TableCell>
                              {c.parent_category_id ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                                  {categories.find((p) => p.category_id === c.parent_category_id)?.name || "Parent Category"}
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-pink-400 uppercase tracking-tighter">Root Level</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 lowercase">
                              <Globe className="h-3 w-3" />
                              {c.slug}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full font-black text-[10px] transition-all shadow-sm",
                                c.is_active 
                                  ? "border-emerald-200/60 bg-emerald-100/80 text-emerald-700 shadow-emerald-50" 
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              )}
                            >
                              {c.is_active && (
                                <div className="relative flex h-1.5 w-1.5">
                                  <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                  <div className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                </div>
                              )}
                              {c.is_active ? "LIVE" : "DRAFT"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                  <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-slate-100">
                                <DropdownMenuLabel className="text-xs text-slate-400 font-bold uppercase tracking-wider px-2 py-2">Category Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                  <Link href={`/categories/${c.category_id}/edit`} className="flex items-center gap-2 cursor-pointer w-full">
                                    <Pencil className="h-4 w-4 text-slate-500" />
                                    Edit Settings
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                  <Link href={`/items?categoryId=${c.category_id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                    <ChevronRight className="h-4 w-4 text-slate-500" />
                                    View Related Items
                                  </Link>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
