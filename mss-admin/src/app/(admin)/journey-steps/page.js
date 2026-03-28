"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowUpDown, 
  Tags, 
  ToggleLeft, 
  ToggleRight, 
  Pencil, 
  Plus, 
  Search, 
  Map as MapIcon, 
  MoreHorizontal, 
  Layers,
  ChevronRight,
  EyeOff,
  Eye
} from "lucide-react";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

async function fetchJourneyLists() {
  const token = getToken();
  if (!token) return null;
  const [stepsRes, catsRes] = await Promise.all([
    fetch(`${API_BASE}/admin/journey-steps`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    fetch(`${API_BASE}/admin/categories`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
  ]);
  return {
    steps: stepsRes.steps || [],
    categories: catsRes.categories || [],
  };
}

export default function JourneyStepsPage() {
  const [steps, setSteps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function reload({ showSpinner = false } = {}) {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchJourneyLists();
      if (!data) {
        setSteps([]);
        setCategories([]);
        return;
      }
      setSteps(data.steps);
      setCategories(data.categories);
    } catch (err) {
      console.error("Failed to load journey data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function toggleActive(step) {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API_BASE}/admin/journey-steps/${step.step_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !step.is_active }),
      });
      await reload({ showSpinner: true });
      toast.success(step.is_active ? `"${step.title}" is now hidden` : `"${step.title}" is now live`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...steps].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    if (!q) return sorted;
    return sorted.filter((s) =>
      `${s.title} ${s.slug} ${s.subtitle || ""}`.toLowerCase().includes(q)
    );
  }, [steps, search]);

  const catsByStep = useMemo(() => {
    const map = new Map();
    for (const c of categories) {
      const k = c.journey_step_id;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(c);
    }
    return map;
  }, [categories]);

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Journey steps"
        description="Configure the sequence of the user's wedding planning journey."
        action={
          <Button asChild className="h-10 gap-2 rounded-lg bg-pink-600 px-4 font-medium hover:bg-pink-700">
            <Link href="/journey-steps/new">
              <Plus className="h-4 w-4" />
              Add step
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
          <CardHeader className="space-y-4 pb-6 border-b border-slate-50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-50 ring-1 ring-violet-100">
                  <MapIcon className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Journey Milestones</CardTitle>
                  <CardDescription>Drag and drop support coming soon • Current sequence shown below</CardDescription>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Find milestone..." 
                  className="pl-10 h-10 border-slate-200 focus:border-violet-300 ring-0 focus-visible:ring-0"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                <p className="text-sm font-medium text-slate-400">Loading roadmap milestones...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 w-[100px]">Order</TableHead>
                      <TableHead className="font-semibold text-slate-700">Milestone Phase</TableHead>
                      <TableHead className="font-semibold text-slate-700">Category Depth</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                          {steps.length === 0 ? "No journey steps defined." : "No matching milestones."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((s) => {
                        const stepCats = (catsByStep.get(s.step_id) || []).filter((c) => !c.parent_category_id);
                        return (
                          <TableRow key={s.step_id} className="hover:bg-slate-50/30 transition-colors group">
                            <TableCell>
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold border border-slate-200 shadow-sm transition-transform group-hover:scale-110">
                                {Number(s.order) || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-base">{s.title}</span>
                                <span className="text-xs font-mono text-slate-400 mt-1">/{s.slug}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="gap-1.5 bg-white border-slate-200 text-slate-600 font-bold">
                                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                                  {stepCats.length} Master
                                </Badge>
                                {stepCats.slice(0, 2).map((c) => (
                                  <span key={c.category_id} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    {c.name}
                                  </span>
                                ))}
                                {stepCats.length > 2 && (
                                  <span className="text-[10px] font-bold text-violet-400">+{stepCats.length - 2} more</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {s.is_active ? (
                                <Badge 
                                  variant="outline" 
                                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full font-black text-[10px] border-emerald-200/60 bg-emerald-100/80 text-emerald-700 shadow-sm shadow-emerald-50 w-fit shrink-0"
                                >
                                  <div className="relative flex h-1.5 w-1.5">
                                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <div className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                  </div>
                                  LIVE
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center gap-1.5 w-fit px-2.5 py-1"
                                >
                                  <EyeOff className="h-3 w-3" />
                                  Draft
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-lg border-slate-100">
                                  <DropdownMenuLabel className="px-2 py-2 text-xs font-medium text-slate-500">Step actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-50" />
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                    <Link href={`/journey-steps/${s.step_id}/edit`} className="flex items-center gap-2 cursor-pointer w-full">
                                      <Pencil className="h-4 w-4 text-slate-500" />
                                      Edit Sequence & Info
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                    <Link href={`/categories?stepId=${s.step_id}`} className="flex items-center gap-2 cursor-pointer w-full">
                                      <Tags className="h-4 w-4 text-slate-500" />
                                      Manage Step Categories
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-50" />
                                  <DropdownMenuItem 
                                    onClick={() => toggleActive(s)}
                                    className={cn(
                                      "rounded-lg transition-colors cursor-pointer flex items-center gap-2",
                                      s.is_active ? "text-red-600 focus:bg-red-50 focus:text-red-700 font-medium" : "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-medium"
                                    )}
                                  >
                                    {s.is_active ? (
                                      <>
                                        <ToggleLeft className="h-4 w-4" />
                                        Unpublish Milestone
                                      </>
                                    ) : (
                                      <>
                                        <ToggleRight className="h-4 w-4" />
                                        Publish Milestone
                                      </>
                                    )}
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
