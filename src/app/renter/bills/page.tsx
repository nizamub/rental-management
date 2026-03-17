"use client";

import { useEffect, useState } from "react";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface Bill {
  id: string;
  month: number;
  year: number;
  baseRent: number;
  electricBill: number;
  gasBill: number;
  waterBill: number;
  otherCharges: { label: string; amount: number }[] | null;
  totalAmount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  apartment: { name: string; floor: string | null };
}

export default function RenterBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch("/api/bills");
        setBills(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchBills();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Bill History</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{bills.length} bills total</p>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-16">
          <Receipt className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>No bills yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="glass-card overflow-hidden">
              <button className="w-full p-5 flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(99, 102, 241, 0.1)" }}>
                    <Receipt className="w-5 h-5" style={{ color: "#818cf8" }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {getMonthName(bill.month)} {bill.year}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{bill.apartment.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold" style={{ color: "#818cf8" }}>{formatCurrency(bill.totalAmount)}</p>
                    <span className={`badge badge-${bill.status.toLowerCase()} text-xs`}>{bill.status}</span>
                  </div>
                  {expandedId === bill.id ? (
                    <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  )}
                </div>
              </button>

              {expandedId === bill.id && (
                <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: "1px solid var(--border-color)" }}>
                  <div className="pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>Base Rent</span>
                      <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.baseRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>Electricity</span>
                      <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.electricBill)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>Gas</span>
                      <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.gasBill)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-secondary)" }}>Water</span>
                      <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.waterBill)}</span>
                    </div>
                    {Array.isArray(bill.otherCharges) && bill.otherCharges.map((c, i) => (
                      <div key={i} className="flex justify-between">
                        <span style={{ color: "var(--text-secondary)" }}>{c.label}</span>
                        <span style={{ color: "var(--text-primary)" }}>{formatCurrency(c.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-2" style={{ borderTop: "1px solid var(--border-color)" }}>
                      <div className="flex justify-between font-bold">
                        <span style={{ color: "#818cf8" }}>Total</span>
                        <span style={{ color: "#818cf8" }}>{formatCurrency(bill.totalAmount)}</span>
                      </div>
                    </div>
                    {bill.paidAt && (
                      <p className="text-xs pt-2" style={{ color: "#34d399" }}>
                        Paid on {new Date(bill.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
