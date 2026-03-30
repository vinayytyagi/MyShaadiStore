"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FolderTree, Plus, Pencil, MoreHorizontal, Layers, LayoutGrid, Search, Globe, ChevronRight, ArrowUpDown } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const API_BASE = "/api/v1";
const CAT_SEARCH_PAGE = 10;

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function CategoriesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stepSlug = searchParams.get("step") || "";
  const queryQ = (searchParams.get("q") || "").trim();
  const sort = (searchParams.get("sort") || "name").trim();
  const dir = (searchParams.get("dir") || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [steps, setSteps] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
      const cur = (q.get("sort") || "name").trim();
      const curDir = (q.get("dir") || "asc").toLowerCase();
      if (cur === field) {
        q.set("dir", curDir === "asc" ? "desc" : "asc");
      } else {
        q.set("sort", field);
        q.set("dir", field === "name" || field === "slug" ? "asc" : "desc");
      }
      q.set("page", "1");
      router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/journey-steps?limit=500&sort=order&dir=asc`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setSteps(d.steps || []));
  }, []);

  useEffect(() => {
    if (!steps.length) return;
    const legacy = searchParams.get("stepId");
    if (legacy && !searchParams.get("step")) {
      const row = steps.find((s) => s.step_id === legacy);
      if (row) {
        const q = new URLSearchParams(searchParams.toString());
        q.delete("stepId");
        q.set("step", row.slug);
        router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false });
      }
    }
  }, [steps, searchParams, pathname, router]);

  const replaceStep = useCallback(
    (nextSlug) => {
      const q = new URLSearchParams(searchParams.toString());
      if (nextSlug) q.set("step", nextSlug);
      else q.delete("step");
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

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams();
    if (stepSlug) qs.set("step", stepSlug);
    if (queryQ) {
      qs.set("q", queryQ);
      qs.set("sort", sort);
      qs.set("dir", dir);
      qs.set("page", String(page));
      qs.set("limit", String(CAT_SEARCH_PAGE));
    } else {
      qs.set("limit", "2000");
      qs.set("sort", sort);
      qs.set("dir", dir);
    }
    fetch(`${API_BASE}/admin/categories?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setTotal(Number(d.total) || (d.categories || []).length);
      })
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setLoading(false));
  }, [stepSlug, queryQ, sort, dir, page]);

  const stepOptions = useMemo(
    () =>
      steps.map((s) => ({
        value: s.slug,
        label: `${Number(s.order) || 0}. ${s.title}`,
        keywords: `${s.slug} ${s.title}`,
      })),
    [steps],
  );

  const stepNameById = new Map(steps.map((s) => [s.step_id, s.title]));
  const slugByStepId = useMemo(() => new Map(steps.map((s) => [s.step_id, s.slug])), [steps]);

  const selectedStepId = stepSlug ? steps.find((s) => s.slug === stepSlug)?.step_id || "" : "";

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

  const flatSearchMode = !!queryQ;
  const canPrev = page > 1;
  const canNext = flatSearchMode && page * CAT_SEARCH_PAGE < total;

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

  function itemsHrefForCategory(cat) {
    const slug = slugByStepId.get(cat.journey_step_id) || "";
    const qs = new URLSearchParams();
    if (slug) qs.set("step", slug);
    qs.set("category", cat.category_id);
    return `/items?${qs.toString()}`;
  }

  return (
    <div className="space-y-8 px-1 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-3xl font-bold tracking-tight text-slate-900">Category library</h1>
          <p className="mt-1 text-sm text-slate-500">
            Phase and search are in the URL; each change refetches from the API.
          </p>
        </div>
        <Button asChild className="h-11 gap-2 bg-pink-600 shadow-md hover:bg-pink-700">
          <Link href={selectedStepId ? `/categories/new?stepId=${encodeURIComponent(selectedStepId)}` : "/categories/new"}>
            <Plus className="h-4 w-4" />
            Add category
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-100">
          <CardHeader className="space-y-4 border-b border-slate-50 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-pink-50 p-2.5 ring-1 ring-pink-100">
                  <FolderTree className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Hierarchy</CardTitle>
                  <CardDescription>
                    {stepSlug
                      ? `Phase “${steps.find((s) => s.slug === stepSlug)?.title || stepSlug}”`
                      : "All journey phases"}
                    {queryQ ? ` · search “${queryQ}” · ${total.toLocaleString()} match${total === 1 ? "" : "es"}` : ""}
                  </CardDescription>
                </div>
              </div>
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <div className="w-full sm:w-64">
                  <Combobox
                    value={stepSlug}
                    onChange={(slug) => replaceStep(slug || "")}
                    options={[{ value: "", label: "All journey phases", keywords: "all" }, ...stepOptions]}
                    placeholder="All journey phases"
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                    placeholder="Search name or slug (API)…"
                    className="h-10 border-slate-200 pl-10 ring-0 focus:border-pink-300 focus-visible:ring-0"
                  />
                </div>
              </div>
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
                      <SortHead field="name" className="min-w-[200px]">
                        Category
                      </SortHead>
                      <TableHead className="font-semibold text-slate-700">Journey phase</TableHead>
                      <SortHead field="slug">Slug</SortHead>
                      <SortHead field="is_active">Status</SortHead>
                      <TableHead className="w-[80px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center italic text-slate-400">
                          No categories for these filters.
                        </TableCell>
                      </TableRow>
                    ) : flatSearchMode ? (
                      categories.map((c, idx) => (
                        <TableRow key={c.category_id} className="hover:bg-slate-50/30">
                          <TableCell className="text-sm font-medium tabular-nums text-slate-500">
                            {(page - 1) * CAT_SEARCH_PAGE + idx + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{c.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {c.parent_category_id ? "Subcategory" : "Parent"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                              {stepNameById.get(c.journey_step_id) || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-slate-400">{c.slug || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-black text-[10px]",
                                c.is_active ? "border-emerald-200 text-emerald-700" : "text-slate-500",
                              )}
                            >
                              {c.is_active ? "LIVE" : "DRAFT"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/categories/${c.category_id}/edit`}>Edit</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      parentCategories.map((parent, pIdx) => {
                        const subs = childrenByParentId.get(parent.category_id) || [];
                        return (
                          <Fragment key={parent.category_id}>
                            <TableRow className="transition-colors hover:bg-slate-50/30">
                              <TableCell className="text-sm font-medium tabular-nums text-slate-500">{pIdx + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                    {parent.image_url ? (
                                      <Image
                                        src={parent.image_url}
                                        alt={parent.name}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                        unoptimized
                                      />
                                    ) : (
                                      <LayoutGrid className="h-5 w-5 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800">{parent.name}</span>
                                    {subs.length > 0 ? (
                                      <p className="text-[11px] font-medium text-slate-400">
                                        {subs.length} subcategor{subs.length === 1 ? "y" : "ies"}
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
                                      <Link href={itemsHrefForCategory(parent)} className="flex w-full cursor-pointer items-center gap-2">
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
                                <TableCell className="text-slate-300 text-center text-xs">·</TableCell>
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
                                        <Link href={itemsHrefForCategory(parent)} className="flex w-full cursor-pointer items-center gap-2">
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
          {flatSearchMode ? (
            <div className="flex flex-col gap-3 border-t border-slate-50 bg-slate-50/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {total.toLocaleString()} matches · {CAT_SEARCH_PAGE} per page
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
          ) : null}
        </Card>
      </div>
    </div>
  );
}
