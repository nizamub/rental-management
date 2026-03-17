"use client";

import { useEffect, useState } from "react";
import { Receipt, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getMonthName } from "@/lib/utils";

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
  paidAt: string | null;
  createdAt: string;
  apartment: { name: string; floor: string | null };
  renter: { name: string; email: string };
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBills = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/bills?${params}`);
      setBills(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, [statusFilter]);

  const handleStatusChange = async (billId: string, newStatus: string) => {
    await fetch(`/api/bills/${billId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchBills();
  };

  const filtered = bills.filter((b) =>
    b.apartment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.renter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Bills</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {bills.length} total · {bills.filter(b => b.status === "UNPAID").length} unpaid
          </p>
        </div>
        <Link href="/owner/bills/generate" className="btn-primary flex items-center gap-2">
          <Receipt className="w-4 h-4" /> Generate Bill
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input className="input-field pl-10" placeholder="Search by apartment or renter..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <select className="select-field" style={{ width: "auto", minWidth: 140 }}
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)" }}>No bills found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Apartment</th>
                  <th>Renter</th>
                  <th>Period</th>
                  <th>Rent</th>
                  <th>Electric</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr key={bill.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{bill.apartment.name}</td>
                    <td>{bill.renter.name}</td>
                    <td>{getMonthName(bill.month)} {bill.year}</td>
                    <td>{formatCurrency(bill.baseRent)}</td>
                    <td>{formatCurrency(bill.electricBill)}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{formatCurrency(bill.totalAmount)}</td>
                    <td>
                      <span className={`badge badge-${bill.status.toLowerCase()}`}>{bill.status}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/owner/bills/${bill.id}`} className="text-xs" style={{ color: "#818cf8" }}>
                          View
                        </Link>
                        {bill.status !== "PAID" && (
                          <button onClick={() => handleStatusChange(bill.id, "PAID")}
                            className="text-xs px-2 py-1 rounded" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#34d399" }}>
                            Mark Paid
                          </button>
                        )}
                        {bill.status === "PAID" && (
                          <button onClick={() => handleStatusChange(bill.id, "UNPAID")}
                            className="text-xs px-2 py-1 rounded" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#f87171" }}>
                            Mark Unpaid
                          </button>
                        )}
                      </div>
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
