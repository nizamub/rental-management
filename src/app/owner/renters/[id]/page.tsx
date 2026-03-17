"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2, Receipt } from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface RenterDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  apartment: { id: string; name: string; floor: string | null; size: string | null } | null;
  bills: { id: string; month: number; year: number; totalAmount: number; status: string; apartment: { name: string } }[];
}

export default function RenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [renter, setRenter] = useState<RenterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRenter() {
      try {
        const res = await fetch(`/api/renters/${params.id}`);
        if (res.ok) setRenter(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchRenter();
  }, [params.id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  if (!renter) return <div className="text-center py-16"><p style={{ color: "var(--text-muted)" }}>Renter not found</p></div>;

  const totalBilled = renter.bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = renter.bills.filter(b => b.status === "PAID").reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="animate-fade-in max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-sm" style={{ color: "#818cf8" }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
            <span className="text-white text-xl font-bold">{renter.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{renter.name}</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Since {new Date(renter.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span style={{ color: "var(--text-secondary)" }}>{renter.email}</span></div>
          {renter.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span style={{ color: "var(--text-secondary)" }}>{renter.phone}</span></div>}
          {renter.apartment && <div className="flex items-center gap-2"><Building2 className="w-4 h-4" style={{ color: "#818cf8" }} /><span style={{ color: "var(--text-primary)" }}>{renter.apartment.name}</span></div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stat-card blue"><p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(totalBilled)}</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Billed</p></div>
        <div className="stat-card green"><p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(totalPaid)}</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>Total Paid</p></div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4" style={{ borderBottom: "1px solid var(--border-color)" }}><h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Bill History</h3></div>
        {renter.bills.length === 0 ? (
          <div className="text-center py-12"><p style={{ color: "var(--text-muted)" }}>No bills</p></div>
        ) : (
          <table className="data-table"><thead><tr><th>Period</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            {renter.bills.map(b => (
              <tr key={b.id}><td style={{ color: "var(--text-primary)" }}>{getMonthName(b.month)} {b.year}</td><td style={{ fontWeight: 600 }}>{formatCurrency(b.totalAmount)}</td><td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td></tr>
            ))}
          </tbody></table>
        )}
      </div>
    </div>
  );
}
