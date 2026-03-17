"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Building2, LayoutDashboard, Receipt, User, LogOut } from "lucide-react";

const navItems = [
  { href: "/renter/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/renter/bills", icon: Receipt, label: "Bills" },
  { href: "/renter/profile", icon: User, label: "Profile" },
];

export default function RenterNav() {
  const pathname = usePathname();

  return (
    <nav style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/renter/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            RentManager
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  color: isActive ? "#818cf8" : "var(--text-secondary)",
                  background: isActive ? "rgba(99, 102, 241, 0.1)" : "transparent",
                }}>
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm ml-2"
            style={{ color: "#f87171" }}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
