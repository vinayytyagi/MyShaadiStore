"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Tags,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Plus,
  Search,
  Map as MapIcon,
  MoreHorizontal,
  Layers,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";
const LIST_LIMIT = 500;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function JourneyStepsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "order").trim();
  const dir = (searchParams.get("dir") || "asc").toLowerCase() === "desc" ? "desc" : "asc";

  const [steps, setSteps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [draftQ, setDraftQ] = useState(queryQ);

  useEffect(() => {
    setDraftQ(queryQ);
  }, [queryQ]);

  useEffect(() => {
    if (draftQ === queryQ) return;
    const h = setTimeout(() => {
      const q = new URLSearchParams(searchParams.toString());
      if (draftQ.trim()) q.set("q", draftQ.trim());
      else q.delete("q");
      q.set("page", "1");
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    }, 400);
    return () => clearTimeout(h);
  }, [draftQ, queryQ, pathname, router, searchParams]);

  const setSort = useCallback(
    (field) => {
      const q = new URLSearchParams(searchParams.toString());
      const cur = (q.get("sort") || "order").trim();
      const curDir = (q.get("dir") || "asc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "order" ? "asc" : "desc");
      }
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const reload = useCallback(async ({ showSpinner = false } = {}) => {
    const token = getToken();
    if (!token) {
      setSteps([]);
      setCategories([]);
      return;
    }
    if (showSpinner) setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("limit", String(LIST_LIMIT));
      qs.set("sort", sort);
      qs.set("dir", dir);
      if (queryQ) qs.set("q", queryQ);
      const [stepsRes, catsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/journey-steps?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${API_BASE}/admin/categories?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ]);
      setSteps(stepsRes.steps || []);
      setCategories(catsRes.categories || []);
    } catch (err) {
      console.error("Failed to load journey data:", err);
    } finally {
      setLoading(false);
    }
  }, [queryQ, sort, dir]);

  useEffect(() => {
    void reload({ showSpinner: true });
  }, [reload]);

  const reorderEnabled =
    !queryQ && sort === "order" && dir === "asc";

  async function persistOrder(nextIds) {
    const token = getToken();
    if (!token) return;
    setReordering(true);
    try {
      const res = await fetch(`${API_BASE}/admin/journey-steps/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stepIds: nextIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Reorder failed");
      }
      await reload();
      toast.success("Journey order saved");
    } catch (e) {
      toast.error(e.message || "Failed to save order");
      await reload();
    } finally {
      setReordering(false);
    }
  }

  function moveStep(from, to) {
    if (!reorderEnabled || reordering || from === to || from < 0 || to < 0 || from >= steps.length || to >= steps.length) {
      return;
    }
    const next = [...steps];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    void persistOrder(next.map((s) => s.step_id));
  }

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

  const catsByStep = useMemo(() => {
    const map = new Map();
    for (const c of categories) {
      const k = c.journey_step_id;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(c);
    }
    return map;
  }, [categories]);

  function SortHead({ field, children, className }) {
    const active = sort === field;
    return (
      <TableHead className={cn("font-semibold text-slate-700", className)}>
        <button
          type="button"
          onClick={() => setSort(field)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-slate-100/80",
            active && "text-violet-700",
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
        title="Journey steps"
        description="Configure the sequence of the user's wedding planning journey. Reorder with arrows when sorted by order (default)."
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
                  <CardTitle className="text-lg font-semibold text-slate-900">Journey milestones</CardTitle>
                  <CardDescription>
                    Search and sort are applied on the server. Reordering updates the live site sequence.
                    {!reorderEnabled ? (
                      <span className="block text-amber-700/90 mt-1">
                        Clear search and sort by <span className="font-mono">order ↑</span> to reorder rows.
                      </span>
                    ) : null}
                  </CardDescription>
                </div>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  placeholder="Search title, slug, subtitle…"
                  className="pl-10 h-10 border-slate-200 focus:border-violet-300 ring-0 focus-visible:ring-0"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                <p className="text-sm font-medium text-slate-400">Loading</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-12 font-semibold text-slate-700">#</TableHead>
                      <SortHead field="order">Order</SortHead>
                      <SortHead field="title">Milestone</SortHead>
                      <TableHead className="font-semibold text-slate-700">Category depth</TableHead>
                      <SortHead field="is_active">Status</SortHead>
                      <TableHead className="font-semibold text-slate-700 w-[100px] text-center">Move</TableHead>
                      <TableHead className="text-right w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {steps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">
                          No journey steps match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      steps.map((s, idx) => {
                        const stepCats = (catsByStep.get(s.step_id) || []).filter((c) => !c.parent_category_id);
                        const slug = (s.slug || "").trim();
                        return (
                          <TableRow key={s.step_id} className="hover:bg-slate-50/30 transition-colors group">
                            <TableCell className="text-sm font-medium text-slate-500 tabular-nums">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold border border-slate-200 shadow-sm">
                                {Number.isFinite(Number(s.order)) ? Number(s.order) : idx}
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
                                  <span
                                    key={c.category_id}
                                    className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                                  >
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
                                <Badge variant="secondary" className="flex items-center gap-1.5 w-fit px-2.5 py-1">
                                  <EyeOff className="h-3 w-3" />
                                  Draft
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  disabled={!reorderEnabled || reordering || idx === 0}
                                  onClick={() => moveStep(idx, idx - 1)}
                                  aria-label="Move up"
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  disabled={!reorderEnabled || reordering || idx >= steps.length - 1}
                                  onClick={() => moveStep(idx, idx + 1)}
                                  aria-label="Move down"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
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
                                      Edit details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="rounded-lg focus:bg-pink-50 transition-colors">
                                    <Link
                                      href={slug ? `/categories?step=${encodeURIComponent(slug)}` : `/categories?stepId=${encodeURIComponent(s.step_id)}`}
                                      className="flex items-center gap-2 cursor-pointer w-full"
                                    >
                                      <Tags className="h-4 w-4 text-slate-500" />
                                      Manage step categories
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-50" />
                                  <DropdownMenuItem
                                    onClick={() => toggleActive(s)}
                                    className={cn(
                                      "rounded-lg transition-colors cursor-pointer flex items-center gap-2",
                                      s.is_active
                                        ? "text-red-600 focus:bg-red-50 focus:text-red-700 font-medium"
                                        : "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-medium",
                                    )}
                                  >
                                    {s.is_active ? (
                                      <>
                                        <ToggleLeft className="h-4 w-4" />
                                        Unpublish milestone
                                      </>
                                    ) : (
                                      <>
                                        <ToggleRight className="h-4 w-4" />
                                        Publish milestone
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
