"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Calculator, Plus, X } from "lucide-react";
import { formatCurrency, calculateElectricBill, calculateTotalBill, getMonthName } from "@/lib/utils";

interface Apartment {
  id: string;
  name: string;
  floor: string | null;
  status: string;
  renterId: string | null;
  renter: { id: string; name: string } | null;
}

interface OtherCharge {
  label: string;
  amount: number;
}

export default function GenerateBillPage() {
  const router = useRouter();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({ costPerUnit: 8 });

  const [selectedAptId, setSelectedAptId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [baseRent, setBaseRent] = useState<number>(0);
  const [prevUnit, setPrevUnit] = useState<number>(0);
  const [currUnit, setCurrUnit] = useState<number>(0);
  const [costPerUnit, setCostPerUnit] = useState<number>(8);
  const [gasBill, setGasBill] = useState<number>(0);
  const [waterBill, setWaterBill] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);
  const [error, setError] = useState("");

  const selectedApt = apartments.find((a) => a.id === selectedAptId);
  const electricBill = calculateElectricBill(prevUnit, currUnit, costPerUnit);
  const totalBill = calculateTotalBill(baseRent, electricBill, gasBill, waterBill, otherCharges);

  useEffect(() => {
    async function fetchData() {
      try {
        const [aptsRes, settingsRes] = await Promise.all([
          fetch("/api/apartments"),
          fetch("/api/settings"),
        ]);
        const aptsData = await aptsRes.json();
        setApartments(aptsData.filter((a: Apartment) => a.status === "OCCUPIED"));
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        setCostPerUnit(settingsData.costPerUnit || 8);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch existing meter reading when apartment/month changes
  useEffect(() => {
    if (!selectedAptId || !month || !year) return;
    async function fetchReading() {
      try {
        const res = await fetch(`/api/readings?apartmentId=${selectedAptId}&month=${month}&year=${year}`);
        const readings = await res.json();
        if (readings.length > 0) {
          setPrevUnit(readings[0].prevUnit);
          setCurrUnit(readings[0].currUnit);
          setCostPerUnit(readings[0].costPerUnit);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchReading();
  }, [selectedAptId, month, year]);

  const addOtherCharge = () => {
    setOtherCharges([...otherCharges, { label: "", amount: 0 }]);
  };

  const removeOtherCharge = (index: number) => {
    setOtherCharges(otherCharges.filter((_, i) => i !== index));
  };

  const updateOtherCharge = (index: number, field: keyof OtherCharge, value: string | number) => {
    const updated = [...otherCharges];
    updated[index] = { ...updated[index], [field]: value };
    setOtherCharges(updated);
  };

  const handleSubmit = async () => {
    if (!selectedApt?.renter) {
      setError("Selected apartment has no renter assigned");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Save meter reading
      await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: selectedAptId,
          month, year, prevUnit, currUnit, costPerUnit,
        }),
      });

      // Generate bill
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: selectedAptId,
          renterId: selectedApt.renter.id,
          month, year, baseRent, electricBill,
          gasBill, waterBill,
          otherCharges: otherCharges.filter((c) => c.label && c.amount > 0),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate bill");
        return;
      }

      const bill = await res.json();
      router.push(`/owner/bills/${bill.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Generate Bill</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Create a new monthly bill for an apartment
        </p>
      </div>

      <div className="space-y-6">
        {/* Apartment & Period */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FileText className="w-4 h-4" style={{ color: "#818cf8" }} /> Bill Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Apartment *</label>
              <select className="select-field" value={selectedAptId} onChange={(e) => setSelectedAptId(e.target.value)}>
                <option value="">Select apartment</option>
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>{apt.name} — {apt.renter?.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Month *</label>
              <select className="select-field" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Year *</label>
              <input className="input-field" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Base Rent */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Base Rent</h3>
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Monthly Rent (৳)</label>
            <input className="input-field" type="number" value={baseRent}
              onChange={(e) => setBaseRent(Number(e.target.value))} placeholder="0" />
          </div>
        </div>

        {/* Electricity */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Calculator className="w-4 h-4" style={{ color: "#818cf8" }} /> Electricity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Previous Reading</label>
              <input className="input-field" type="number" value={prevUnit}
                onChange={(e) => setPrevUnit(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Current Reading</label>
              <input className="input-field" type="number" value={currUnit}
                onChange={(e) => setCurrUnit(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Cost/Unit (৳)</label>
              <input className="input-field" type="number" value={costPerUnit}
                onChange={(e) => setCostPerUnit(Number(e.target.value))} />
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Net Units: <strong style={{ color: "var(--text-primary)" }}>{currUnit - prevUnit}</strong> ×{" "}
              ৳{costPerUnit} = <strong style={{ color: "#818cf8" }}>{formatCurrency(electricBill)}</strong>
            </p>
          </div>
        </div>

        {/* Other Utilities */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Other Utilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Gas Bill (৳)</label>
              <input className="input-field" type="number" value={gasBill}
                onChange={(e) => setGasBill(Number(e.target.value))} placeholder="0" />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Water Bill (৳)</label>
              <input className="input-field" type="number" value={waterBill}
                onChange={(e) => setWaterBill(Number(e.target.value))} placeholder="0" />
            </div>
          </div>

          {/* Other Charges */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm" style={{ color: "var(--text-secondary)" }}>Additional Charges</label>
              <button onClick={addOtherCharge} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Charge
              </button>
            </div>
            {otherCharges.map((charge, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <input className="input-field flex-1" placeholder="Label" value={charge.label}
                  onChange={(e) => updateOtherCharge(i, "label", e.target.value)} />
                <input className="input-field w-32" type="number" placeholder="Amount" value={charge.amount}
                  onChange={(e) => updateOtherCharge(i, "amount", Number(e.target.value))} />
                <button onClick={() => removeOtherCharge(i)} className="btn-danger px-3">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Bill Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Base Rent</span>
              <span style={{ color: "var(--text-primary)" }}>{formatCurrency(baseRent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Electricity ({currUnit - prevUnit} units)</span>
              <span style={{ color: "var(--text-primary)" }}>{formatCurrency(electricBill)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Gas</span>
              <span style={{ color: "var(--text-primary)" }}>{formatCurrency(gasBill)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>Water</span>
              <span style={{ color: "var(--text-primary)" }}>{formatCurrency(waterBill)}</span>
            </div>
            {otherCharges.filter(c => c.label).map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>{c.label}</span>
                <span style={{ color: "var(--text-primary)" }}>{formatCurrency(c.amount)}</span>
              </div>
            ))}
            <div className="pt-3" style={{ borderTop: "2px solid rgba(99, 102, 241, 0.3)" }}>
              <div className="flex justify-between">
                <span className="font-semibold" style={{ color: "#818cf8" }}>Total</span>
                <span className="text-xl font-bold" style={{ color: "#818cf8" }}>{formatCurrency(totalBill)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!selectedAptId || saving}
          className="btn-primary w-full py-3 text-base">
          {saving ? "Generating..." : "Generate Bill"}
        </button>
      </div>
    </div>
  );
}
