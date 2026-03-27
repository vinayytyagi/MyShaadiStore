"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Eye, 
  FileText, 
  Mail, 
  Search, 
  ChevronRight, 
  User, 
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mss_token");
}

export default function QuotationRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/quotation-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRequests(data.requests || []))
      .catch((err) => console.error("Failed to load requests:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const searchable = `${r.customer?.name || ""} ${r.customer?.phone || ""} ${r.quotation_request_id}`.toLowerCase();
    return searchable.includes(q);
  });

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Inbox and quotations"
        description="Review and respond to customer item baskets and pricing inquiries."
        action={
          <Badge variant="outline" className="flex h-10 items-center gap-2 border-slate-200 bg-white px-4 py-1.5 text-slate-600 font-medium">
            <Mail className="h-4 w-4 text-emerald-500" />
            {requests.length} basket inquiries
          </Badge>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-50 py-5">
           <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Quotation Journal</CardTitle>
                <CardDescription>Historical record of user price requests</CardDescription>
              </div>
            </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search customer context..." 
              className="pl-10 h-10 border-slate-200 focus:border-emerald-300 ring-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Opening inquiry box...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-[260px]">Customer Prospect</TableHead>
                    <TableHead className="font-semibold text-slate-700">Basket Content</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Submission Date</TableHead>
                    <TableHead className="text-right w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                        {requests.length === 0 ? "Inbox is empty." : "No matching inquiries found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.quotation_request_id} className="hover:bg-slate-50/30 transition-colors group cursor-pointer" onClick={() => (window.location.href=`/quotation-requests/${r.quotation_request_id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold border border-slate-200">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 truncate">{r.customer?.name || "Interested Lead"}</span>
                              <span className="text-xs text-slate-400">{r.customer?.phone || "Phone hidden"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                             <Layers className="h-4 w-4 text-emerald-400" />
                             {Array.isArray(r.items) ? r.items.length : 0} Items
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">in basket</span>
                          </div>
                        </TableCell>
                         <TableCell>
                           <Badge 
                             variant="outline" 
                             className={cn(
                               "flex items-center gap-1.5 w-fit rounded-full px-3 py-1 font-bold shadow-sm transition-all",
                               r.email_status === "sent" 
                                 ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/60 shadow-emerald-50" 
                                 : "bg-amber-100/80 text-amber-700 border-amber-200/60 shadow-amber-50"
                             )}
                           >
                             {r.email_status === "sent" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                             {(r.email_status || "Queueing").toUpperCase()}
                           </Badge>
                         </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(r.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
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
      </Card>
    </div>
  );
}
