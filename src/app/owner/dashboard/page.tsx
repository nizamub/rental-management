"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Receipt, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface DashboardData {
  totalApartments: number;
  occupiedApartments: number;
  vacantApartments: number;
  totalRenters: number;
  totalBills: number;
  unpaidBills: number;
  expectedIncome: number;
  collectedIncome: number;
  recentBills: {
    id: string;
    month: number;
    year: number;
    totalAmount: number;
    status: string;
    apartment: { name: string };
    renter: { name: string };
  }[];
}

export default function OwnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [aptsRes, billsRes, rentersRes] = await Promise.all([
          fetch("/api/apartments"),
          fetch("/api/bills"),
          fetch("/api/renters"),
        ]);

        const apartments = await aptsRes.json();
        const bills = await billsRes.json();
        const renters = await rentersRes.json();

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const currentMonthBills = bills.filter(
          (b: { month: number; year: number }) => b.month === currentMonth && b.year === currentYear
        );

        setData({
          totalApartments: apartments.length,
          occupiedApartments: apartments.filter((a: { status: string }) => a.status === "OCCUPIED").length,
          vacantApartments: apartments.filter((a: { status: string }) => a.status === "VACANT").length,
          totalRenters: renters.length,
          totalBills: bills.length,
          unpaidBills: bills.filter((b: { status: string }) => b.status === "UNPAID").length,
          expectedIncome: currentMonthBills.reduce((sum: number, b: { totalAmount: number }) => sum + b.totalAmount, 0),
          collectedIncome: currentMonthBills
            .filter((b: { status: string }) => b.status === "PAID")
            .reduce((sum: number, b: { totalAmount: number }) => sum + b.totalAmount, 0),
          recentBills: bills.slice(0, 5),
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "Total Apartments",
      value: data.totalApartments,
      sub: `${data.occupiedApartments} occupied · ${data.vacantApartments} vacant`,
      icon: Building2,
      color: "purple",
      gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    },
    {
      label: "Active Renters",
      value: data.totalRenters,
      sub: "Registered accounts",
      icon: Users,
      color: "blue",
      gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
    },
    {
      label: "Expected Income",
      value: formatCurrency(data.expectedIncome),
      sub: `${getMonthName(new Date().getMonth() + 1)} ${new Date().getFullYear()}`,
      icon: TrendingUp,
      color: "green",
      gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
    },
    {
      label: "Unpaid Bills",
      value: data.unpaidBills,
      sub: "Pending payments",
      icon: AlertTriangle,
      color: "pink",
      gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Welcome back! Here&apos;s your property overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: stat.gradient, opacity: 0.9 }}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              {stat.value}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {stat.label}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Income Progress */}
      <div className="glass-card p-6 mb-8">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Monthly Collection Progress
        </h3>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Collected: {formatCurrency(data.collectedIncome)}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            / {formatCurrency(data.expectedIncome)}
          </span>
        </div>
        <div className="w-full h-3 rounded-full" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${data.expectedIncome > 0 ? (data.collectedIncome / data.expectedIncome) * 100 : 0}%`,
              background: "linear-gradient(90deg, #6366f1, #818cf8)",
              minWidth: data.collectedIncome > 0 ? "8px" : "0",
            }}
          />
        </div>
      </div>

      {/* Recent Bills */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent Bills
          </h3>
          <Link
            href="/owner/bills"
            className="flex items-center gap-1 text-sm"
            style={{ color: "#818cf8" }}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {data.recentBills.length === 0 ? (
          <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            No bills generated yet. <Link href="/owner/bills/generate" style={{ color: "#818cf8" }}>Generate your first bill</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Apartment</th>
                  <th>Renter</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBills.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ color: "var(--text-primary)" }}>{bill.apartment.name}</td>
                    <td>{bill.renter.name}</td>
                    <td>{getMonthName(bill.month)} {bill.year}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td>
                      <span className={`badge badge-${bill.status.toLowerCase()}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
