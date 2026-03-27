"use client";

import { useEffect, useState } from "react";
import { 
  UserCircle, 
  Users, 
  Search, 
  Eye, 
  ChevronRight, 
  Mail, 
  Phone, 
  BadgeIndianRupee,
  Clock,
  Calendar,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SectionHeader from "@/components/ui/section-header";

const API_BASE = "/api/v1";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page]);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("mss_token");
    try {
      const res = await fetch(
        `${API_BASE}/admin/users?page=${pagination.page}&limit=${pagination.limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch users");
      setUsers(data.users || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.phone?.includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-8 pb-10 px-1">
      <SectionHeader
        title="Customer directory"
        description="Browse and manage registered couples and planning users."
        action={
          <Badge variant="outline" className="flex h-10 items-center gap-2 border-slate-200 bg-white px-4 py-1.5 text-slate-600 font-medium">
            <Users className="h-4 w-4 text-blue-500" />
            {pagination.total} registered users
          </Badge>
        }
      />

      <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-b border-slate-50 py-5">
           <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 ring-1 ring-blue-100">
                <UserCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">User Management</CardTitle>
                <CardDescription>Track onboarding progress and wedding budgets</CardDescription>
              </div>
            </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Search by name, contact or wedding info..." 
              className="pl-10 h-10 border-slate-200 focus:border-blue-300 ring-0 focus-visible:ring-0"
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-sm font-medium text-slate-400">Syncing user database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-[240px]">Customer Profile</TableHead>
                    <TableHead className="font-semibold text-slate-700">Contact Info</TableHead>
                    <TableHead className="font-semibold text-slate-700">Planning Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Allocated Budget</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap">Joined Date</TableHead>
                    <TableHead className="text-right w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                        {users.length === 0 ? "No customers registered yet." : "No matching users found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id} className="hover:bg-slate-50/30 transition-colors group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 shrink-0 border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
                              <AvatarImage src="" />
                              <AvatarFallback className="bg-linear-to-br from-slate-100 to-slate-200 text-slate-500 font-semibold uppercase">
                                {user.name?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-800 truncate">{user.name || "Unnamed User"}</span>
                              <Badge 
                                variant={user.status === 'Active' ? 'success' : 'secondary'} 
                                className={cn(
                                  "w-fit text-[9px] px-1.5 py-0.5 mt-1 leading-none uppercase tracking-wider flex items-center gap-1",
                                  user.status === 'Active' && "bg-emerald-50 text-emerald-800 border-emerald-100"
                                )}
                              >
                                {user.status === 'Active' && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                )}
                                {user.status || 'Active'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1 text-xs text-slate-500">
                             <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[140px]">{user.email || "No email"}</span>
                             </div>
                             <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {user.phone || "—"}
                             </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-slate-600">
                                {user.onboarding?.engagement_status === 'yes' ? 'Engaged' :
                                 user.onboarding?.engagement_status === 'getting_engaged_soon' ? 'Planning' : 'Just exploring'}
                              </span>
                              {user.onboarding?.wedding_date && (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(user.onboarding.wedding_date).toLocaleDateString()}
                                </span>
                              )}
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5">
                             <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                               <BadgeIndianRupee className="h-4 w-4 text-emerald-500" />
                               {user.onboarding?.budget_total ? 
                                 (Number(user.onboarding.budget_total) >= 100000 ? 
                                  `₹${(Number(user.onboarding.budget_total) / 100000).toFixed(1)}L` : 
                                  `₹${Number(user.onboarding.budget_total).toLocaleString()}`) : "₹0"}
                             </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                             <Calendar className="h-3.5 w-3.5" />
                             {new Date(user.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                           </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                           <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100" onClick={() => router.push(`/admin/users/${user._id}`)}>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
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
        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {pagination.total} records total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-lg border-slate-200"
              disabled={pagination.page === 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono">
              {pagination.page}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-lg border-slate-200"
              disabled={pagination.page * pagination.limit >= pagination.total}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
