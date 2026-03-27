"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Search,
  ChevronDown,
  Shapes,
  Route,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const nav = [
  { group: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { group: "Management", items: [
    { href: "/vendors", label: "Vendors", icon: Users },
    { href: "/journey-steps", label: "Journey Steps", icon: Route },
    { href: "/budget", label: "Budget", icon: Wallet },
    { href: "/categories", label: "Categories", icon: Shapes },
    { href: "/items", label: "Products & Venues", icon: Package },
  ]},
  { group: "Sales & Inquiries", items: [
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/quotation-requests", label: "Quotations", icon: FileText },
    { href: "/users", label: "Customers", icon: UserCircle },
  ]},
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutConfirmText, setLogoutConfirmText] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mss_token") : null;
    const u = typeof window !== "undefined" ? localStorage.getItem("mss_user") : null;
    if (!token || !u) {
      router.replace("/login");
      return;
    }
    try {
      setUser(JSON.parse(u));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    if (logoutConfirmText.toUpperCase() === "LOGOUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("mss_token");
          localStorage.removeItem("mss_user");
        }
        router.replace("/login");
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="text-xs font-medium text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static overflow-hidden",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-50 shrink-0">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-pink-600 text-white font-bold shadow-lg shadow-pink-200 transition-transform group-hover:scale-105">
                M
              </div>
              <div className="flex flex-col">
                <span className="font-semibold leading-tight text-slate-900">M.S.S. Admin</span>
                <span className="mt-0.5 text-[10px] text-slate-400 leading-none">Control center</span>
              </div>
            </Link>
          )}
          {!sidebarOpen && (
             <div className="flex size-10 items-center justify-center rounded-xl bg-pink-500 text-white font-black mx-auto shadow-lg shadow-pink-100">
               M
             </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6 custom-scrollbar scroll-smooth">
          {nav.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {sidebarOpen && (
                <h3 className="mb-2 px-4 text-[10px] font-medium text-slate-400 opacity-70">
                  {group.group}
                </h3>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} title={!sidebarOpen ? item.label : ""} className="cursor-pointer">
                    <div
                      className={cn(
                        "mb-0.5 group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium sidebar-item-transition",
                        isActive
                          ? "bg-pink-50 text-pink-600"
                          : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                      )}
                    >
                      <Icon className={cn("size-4.5 shrink-0 transition-colors duration-200", isActive ? "text-pink-600" : "text-slate-400 group-hover:text-slate-600")} />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                      {isActive && (
                        <div className={cn(
                            "absolute bg-pink-500 rounded-full transition-all duration-300",
                            sidebarOpen ? "right-2 size-1.5" : "left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full"
                        )} />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 max-h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-500 hover:bg-slate-100 rounded-full h-9 w-9"
              >
                {sidebarOpen ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
              </Button>
              <div className="hidden sm:flex relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                <Input 
                  placeholder="Global Search..." 
                  className="pl-9 h-9 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-full ring-0 focus-visible:ring-0 text-sm"
                />
              </div>
          </div>

          <div className="flex items-center gap-3">
            <Separator orientation="vertical" className="h-6 mx-1 bg-slate-200 opacity-50" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-1 pr-3 py-1 h-10 rounded-full hover:bg-slate-50 flex items-center gap-2.5 outline-none ring-0">
                  <Avatar className="h-8 w-8 border-2 border-slate-100 shadow-sm">
                    <AvatarImage src="" />
                  <AvatarFallback className="bg-linear-to-br from-pink-500 to-rose-500 text-[11px] font-bold text-white">
                      {user?.email?.[0].toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="max-w-[120px] truncate text-sm font-semibold text-slate-700">Super Admin</span>
                    <span className="text-[10px] text-slate-400">Administrator</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-y-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1 rounded-2xl shadow-2xl border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold leading-tight text-slate-900">M.S.S. Master</p>
                    <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100/60 mx-1" />
                <DropdownMenuItem 
                   onClick={() => setLogoutDialogOpen(true)} 
                   className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <LogOut className="size-4 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-sm">Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-auto p-6 lg:p-10 scroll-smooth bg-slate-50/30">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Security Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={(open) => {
          setLogoutDialogOpen(open);
          if(!open) setLogoutConfirmText("");
      }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
          <DialogHeader className="space-y-4">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                <LogOut className="size-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold tracking-tight text-slate-900">Confirm logout</DialogTitle>
            <DialogDescription className="px-4 text-center text-sm text-slate-500">
              To terminate your current administrative session, type <span className="cursor-default select-none rounded bg-red-50 px-2 py-0.5 font-semibold text-red-600">LOGOUT</span> below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
             <Input 
               value={logoutConfirmText}
               onChange={(e) => setLogoutConfirmText(e.target.value)}
               placeholder="Confirm action..."
               className="h-11 rounded-xl border-slate-200 bg-slate-50/50 text-center font-medium tracking-[0.15em] text-slate-900 transition-all focus:bg-white"
               autoFocus
             />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button 
                variant="ghost" 
                onClick={() => setLogoutDialogOpen(false)}
                className="h-11 w-full rounded-lg text-slate-500 hover:bg-slate-50 sm:flex-1"
            >
                Stay Logged In
            </Button>
            <Button 
                onClick={handleLogout}
                disabled={logoutConfirmText.toUpperCase() !== "LOGOUT"}
                className={cn(
                    "h-11 w-full rounded-lg transition-all shadow-lg sm:flex-1",
                    logoutConfirmText.toUpperCase() === "LOGOUT" 
                        ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border-transparent"
                )}
            >
                Log Out Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
