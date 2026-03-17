"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/owner/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/owner/apartments", icon: Building2, label: "Apartments" },
  { href: "/owner/renters", icon: Users, label: "Renters" },
  { href: "/owner/readings", icon: Zap, label: "Meter Readings" },
  { href: "/owner/bills", icon: Receipt, label: "Bills" },
  { href: "/owner/bills/generate", icon: FileText, label: "Generate Bill" },
  { href: "/owner/reports", icon: BarChart3, label: "Reports" },
  { href: "/owner/settings", icon: Settings, label: "Settings" },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40"
      style={{
        width: collapsed ? '72px' : '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Logo */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>RentManager</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owner Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/owner/dashboard" && pathname.startsWith(item.href) && item.href !== "/owner/bills/generate");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link w-full"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link w-full"
          style={{ color: '#f87171' }}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
