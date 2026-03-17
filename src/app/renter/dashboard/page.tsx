"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, Receipt, Calendar } from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";
import Link from "next/link";

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
}

interface ApartmentInfo {
  name: string;
  floor: string | null;
  size: string | null;
}

export default function RenterDashboard() {
  const { data: session } = useSession();
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [apartment, setApartment] = useState<ApartmentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const billsRes = await fetch("/api/bills");
        const bills: Bill[] = await billsRes.json();
        if (bills.length > 0) {
          setCurrentBill(bills[0]);
          setApartment({
            name: bills[0].apartment.name,
            floor: bills[0].apartment.floor,
            size: null,
          });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Welcome back, {session?.user?.name || "Renter"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Here&apos;s your rental overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Bill */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5" style={{ color: "#818cf8" }} />
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Current Bill</h3>
          </div>

          {currentBill ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {getMonthName(currentBill.month)} {currentBill.year}
                  </p>
                  <p className="text-3xl font-bold mt-1" style={{ color: "#818cf8" }}>
                    {formatCurrency(currentBill.totalAmount)}
                  </p>
                </div>
                <span className={`badge badge-${currentBill.status.toLowerCase()}`}>
                  {currentBill.status}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Base Rent</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatCurrency(currentBill.baseRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Electricity</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatCurrency(currentBill.electricBill)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Gas</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatCurrency(currentBill.gasBill)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Water</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatCurrency(currentBill.waterBill)}</span>
                </div>
              </div>

              <Link href={`/renter/bills`} className="btn-secondary w-full text-center block py-2 text-sm">
                View All Bills
              </Link>
            </>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)" }}>No bills yet</p>
            </div>
          )}
        </div>

        {/* Apartment Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5" style={{ color: "#818cf8" }} />
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Apartment Info</h3>
          </div>
          {apartment ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{apartment.name}</p>
                {apartment.floor && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{apartment.floor}</p>}
                {apartment.size && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{apartment.size}</p>}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)" }}>No apartment assigned</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
