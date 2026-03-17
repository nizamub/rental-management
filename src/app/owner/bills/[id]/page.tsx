"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, MessageSquare, Download } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface BillDetail {
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
  apartment: { id: string; name: string; floor: string | null; size: string | null };
  renter: { id: string; name: string; email: string; phone: string | null };
}

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");

  useEffect(() => {
    async function fetchBill() {
      try {
        const res = await fetch(`/api/bills/${params.id}`);
        if (res.ok) {
          setBill(await res.json());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchBill();
  }, [params.id]);

  const handleStatusChange = async (status: string) => {
    if (!bill) return;
    await fetch(`/api/bills/${bill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBill({ ...bill, status, paidAt: status === "PAID" ? new Date().toISOString() : null });
  };

  const handleSendNotification = async (type: "email" | "sms" | "both") => {
    if (!bill) return;
    setSending(true);
    setSendResult("");
    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          sendEmail: type === "email" || type === "both",
          sendSms: type === "sms" || type === "both",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult("Notification sent successfully!");
      } else {
        setSendResult("Failed to send notification. Check your email/SMS config.");
      }
    } catch {
      setSendResult("Error sending notification");
    } finally {
      setSending(false);
    }
  };

  const otherChargesTotal = Array.isArray(bill?.otherCharges)
    ? bill.otherCharges.reduce((sum, c) => sum + c.amount, 0)
    : 0;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  if (!bill) {
    return (
      <div className="text-center py-16">
        <p style={{ color: "var(--text-muted)" }}>Bill not found</p>
        <Link href="/owner/bills" className="btn-secondary mt-4 inline-block">Back to Bills</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-sm" style={{ color: "#818cf8" }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Bill Header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Bill for {getMonthName(bill.month)} {bill.year}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {bill.apartment.name} {bill.apartment.floor ? `· ${bill.apartment.floor}` : ""}
            </p>
          </div>
          <span className={`badge badge-${bill.status.toLowerCase()}`}>{bill.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p style={{ color: "var(--text-muted)" }}>Renter</p>
            <p style={{ color: "var(--text-primary)" }}>{bill.renter.name}</p>
            <p style={{ color: "var(--text-secondary)" }}>{bill.renter.email}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)" }}>Created</p>
            <p style={{ color: "var(--text-primary)" }}>{new Date(bill.createdAt).toLocaleDateString()}</p>
            {bill.paidAt && (
              <>
                <p className="mt-2" style={{ color: "var(--text-muted)" }}>Paid On</p>
                <p style={{ color: "#34d399" }}>{new Date(bill.paidAt).toLocaleDateString()}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bill Breakdown */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Bill Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Base Rent</span>
            <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.baseRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Electricity</span>
            <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.electricBill)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Gas</span>
            <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.gasBill)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>Water</span>
            <span style={{ color: "var(--text-primary)" }}>{formatCurrency(bill.waterBill)}</span>
          </div>
          {Array.isArray(bill.otherCharges) && bill.otherCharges.map((c, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>{c.label}</span>
              <span style={{ color: "var(--text-primary)" }}>{formatCurrency(c.amount)}</span>
            </div>
          ))}
          <div className="pt-3" style={{ borderTop: "2px solid rgba(99, 102, 241, 0.3)" }}>
            <div className="flex justify-between">
              <span className="font-bold text-lg" style={{ color: "#818cf8" }}>Total</span>
              <span className="font-bold text-xl" style={{ color: "#818cf8" }}>{formatCurrency(bill.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Actions</h3>
        <div className="flex flex-wrap gap-3">
          {bill.status !== "PAID" && (
            <button onClick={() => handleStatusChange("PAID")} className="btn-primary flex items-center gap-2">
              Mark as Paid
            </button>
          )}
          {bill.status === "PAID" && (
            <button onClick={() => handleStatusChange("UNPAID")} className="btn-danger flex items-center gap-2">
              Mark as Unpaid
            </button>
          )}
          {bill.status !== "PARTIAL" && (
            <button onClick={() => handleStatusChange("PARTIAL")} className="btn-secondary flex items-center gap-2">
              Mark as Partial
            </button>
          )}
        </div>
      </div>

      {/* Send Notification */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Send Notification</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleSendNotification("email")} disabled={sending}
            className="btn-secondary flex items-center gap-2">
            <Mail className="w-4 h-4" /> {sending ? "Sending..." : "Send Email"}
          </button>
          <button onClick={() => handleSendNotification("sms")} disabled={sending}
            className="btn-secondary flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> {sending ? "Sending..." : "Send SMS"}
          </button>
          <button onClick={() => handleSendNotification("both")} disabled={sending}
            className="btn-primary flex items-center gap-2">
            {sending ? "Sending..." : "Send Both"}
          </button>
        </div>
        {sendResult && (
          <p className="mt-3 text-sm" style={{ color: sendResult.includes("success") ? "#34d399" : "#f87171" }}>
            {sendResult}
          </p>
        )}
      </div>
    </div>
  );
}
