"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Bill {
  id: string;
  month: number;
  year: number;
  baseRent: number;
  electricBill: number;
  gasBill: number;
  waterBill: number;
  totalAmount: number;
  status: string;
  apartment: { name: string; floor: string | null };
  renter: { name: string; email: string };
}

const CHART_COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#38bdf8"];
const PIE_COLORS = ["#34d399", "#f87171", "#fbbf24"];

export default function ReportsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/bills");
        setBills(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const years = useMemo(() => {
    const ySet = new Set(bills.map((b) => b.year));
    return Array.from(ySet).sort((a, b) => b - a);
  }, [bills]);

  const yearBills = useMemo(
    () => bills.filter((b) => b.year === selectedYear),
    [bills, selectedYear]
  );

  // Monthly revenue chart data
  const monthlyData = useMemo(() => {
    const months: { month: string; billed: number; collected: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const mBills = yearBills.filter((b) => b.month === m);
      months.push({
        month: getMonthName(m).slice(0, 3),
        billed: mBills.reduce((sum, b) => sum + b.totalAmount, 0),
        collected: mBills
          .filter((b) => b.status === "PAID")
          .reduce((sum, b) => sum + b.totalAmount, 0),
      });
    }
    return months;
  }, [yearBills]);

  // Status breakdown
  const statusData = useMemo(() => {
    const paid = yearBills.filter((b) => b.status === "PAID").length;
    const unpaid = yearBills.filter((b) => b.status === "UNPAID").length;
    const partial = yearBills.filter((b) => b.status === "PARTIAL").length;
    return [
      { name: "Paid", value: paid },
      { name: "Unpaid", value: unpaid },
      { name: "Partial", value: partial },
    ].filter((d) => d.value > 0);
  }, [yearBills]);

  // Summary stats
  const totalBilled = yearBills.reduce((s, b) => s + b.totalAmount, 0);
  const totalCollected = yearBills
    .filter((b) => b.status === "PAID")
    .reduce((s, b) => s + b.totalAmount, 0);
  const totalUnpaid = yearBills
    .filter((b) => b.status === "UNPAID")
    .reduce((s, b) => s + b.totalAmount, 0);
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // Per-apartment breakdown
  const aptBreakdown = useMemo(() => {
    const map: Record<string, { name: string; billed: number; collected: number; unpaid: number }> = {};
    yearBills.forEach((b) => {
      const key = b.apartment.name;
      if (!map[key]) map[key] = { name: key, billed: 0, collected: 0, unpaid: 0 };
      map[key].billed += b.totalAmount;
      if (b.status === "PAID") map[key].collected += b.totalAmount;
      if (b.status === "UNPAID") map[key].unpaid += b.totalAmount;
    });
    return Object.values(map).sort((a, b) => b.billed - a.billed);
  }, [yearBills]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Reports
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Financial overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <select
            className="select-field"
            style={{ width: "auto", minWidth: 120 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="stat-card purple">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5" style={{ color: "#818cf8" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Billed</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(totalBilled)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {yearBills.length} bills in {selectedYear}
          </p>
        </div>

        <div className="stat-card green">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5" style={{ color: "#34d399" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Collected</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-xs mt-1" style={{ color: "#34d399" }}>
            {collectionRate.toFixed(1)}% collection rate
          </p>
        </div>

        <div className="stat-card pink">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5" style={{ color: "#f87171" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Unpaid</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(totalUnpaid)}
          </p>
          <p className="text-xs mt-1" style={{ color: "#f87171" }}>
            {yearBills.filter((b) => b.status === "UNPAID").length} pending bills
          </p>
        </div>

        <div className="stat-card blue">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5" style={{ color: "#38bdf8" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Avg Bill</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {formatCurrency(yearBills.length > 0 ? totalBilled / yearBills.length : 0)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Per apartment/month
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Monthly Revenue — {selectedYear}
          </h3>
          {yearBills.length === 0 ? (
            <div className="flex items-center justify-center h-[250px]">
              <p style={{ color: "var(--text-muted)" }}>No billing data for {selectedYear}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="month" tick={{ fill: "#6b6b8a", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b6b8a", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#16163a",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 10,
                    color: "#f0f0ff",
                    fontSize: 13,
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="billed" name="Billed" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Pie */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Payment Status
          </h3>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px]">
              <p style={{ color: "var(--text-muted)" }}>No data</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#16163a",
                      border: "1px solid rgba(99,102,241,0.2)",
                      borderRadius: 10,
                      color: "#f0f0ff",
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span style={{ color: "var(--text-secondary)" }}>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per-Apartment Breakdown */}
      <div className="glass-card overflow-hidden">
        <div className="p-5" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Per-Apartment Breakdown — {selectedYear}
          </h3>
        </div>
        {aptBreakdown.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-muted)" }}>No data</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Apartment</th>
                  <th>Total Billed</th>
                  <th>Collected</th>
                  <th>Unpaid</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {aptBreakdown.map((apt) => {
                  const rate = apt.billed > 0 ? (apt.collected / apt.billed) * 100 : 0;
                  return (
                    <tr key={apt.name}>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {apt.name}
                      </td>
                      <td>{formatCurrency(apt.billed)}</td>
                      <td style={{ color: "#34d399" }}>{formatCurrency(apt.collected)}</td>
                      <td style={{ color: "#f87171" }}>{formatCurrency(apt.unpaid)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: "60px",
                              background: "rgba(99,102,241,0.1)",
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${rate}%`,
                                background:
                                  rate >= 80
                                    ? "#34d399"
                                    : rate >= 50
                                    ? "#fbbf24"
                                    : "#f87171",
                              }}
                            />
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {rate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
