"use client";

import { useEffect, useState } from "react";
import { Zap, Save } from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface Apartment {
  id: string;
  name: string;
  floor: string | null;
  status: string;
}

interface Reading {
  id: string;
  month: number;
  year: number;
  prevUnit: number;
  currUnit: number;
  costPerUnit: number;
  apartment: { name: string };
}

export default function MeterReadingsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [prevUnit, setPrevUnit] = useState<number>(0);
  const [currUnit, setCurrUnit] = useState<number>(0);
  const [costPerUnit, setCostPerUnit] = useState<number>(8);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [aptsRes, readingsRes, settingsRes] = await Promise.all([
          fetch("/api/apartments"),
          fetch("/api/readings"),
          fetch("/api/settings"),
        ]);
        const apts = await aptsRes.json();
        setApartments(apts.filter((a: Apartment) => a.status === "OCCUPIED"));
        setReadings(await readingsRes.json());
        const settings = await settingsRes.json();
        setCostPerUnit(settings.costPerUnit || 8);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!selectedAptId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apartmentId: selectedAptId, month, year, prevUnit, currUnit, costPerUnit }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Saved! Electric bill: ${formatCurrency(data.electricBill)}`);
        // Refresh readings
        const readingsRes = await fetch("/api/readings");
        setReadings(await readingsRes.json());
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Error saving reading");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Meter Readings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Record electricity meter readings for each apartment
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 mb-8 max-w-2xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Zap className="w-4 h-4" style={{ color: "#fbbf24" }} /> New Reading
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Apartment</label>
            <select className="select-field" value={selectedAptId} onChange={(e) => setSelectedAptId(e.target.value)}>
              <option value="">Select apartment</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>{apt.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Month</label>
              <select className="select-field" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Year</label>
              <input className="input-field" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Previous Unit</label>
            <input className="input-field" type="number" value={prevUnit} onChange={(e) => setPrevUnit(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Current Unit</label>
            <input className="input-field" type="number" value={currUnit} onChange={(e) => setCurrUnit(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Cost/Unit (৳)</label>
            <input className="input-field" type="number" value={costPerUnit} onChange={(e) => setCostPerUnit(Number(e.target.value))} />
          </div>
        </div>

        {selectedAptId && currUnit > prevUnit && (
          <div className="p-3 rounded-lg mb-4" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Net: <strong>{currUnit - prevUnit}</strong> units × ৳{costPerUnit} ={" "}
              <strong style={{ color: "#818cf8" }}>{formatCurrency((currUnit - prevUnit) * costPerUnit)}</strong>
            </p>
          </div>
        )}

        <button onClick={handleSave} disabled={!selectedAptId || saving}
          className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Reading"}
        </button>

        {message && (
          <p className="mt-3 text-sm" style={{ color: message.includes("Error") || message.includes("Failed") ? "#f87171" : "#34d399" }}>
            {message}
          </p>
        )}
      </div>

      {/* Recent Readings */}
      <div className="glass-card overflow-hidden">
        <div className="p-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Recent Readings</h3>
        </div>
        {readings.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--text-muted)" }}>No readings yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Apartment</th>
                  <th>Period</th>
                  <th>Previous</th>
                  <th>Current</th>
                  <th>Net Units</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{r.apartment.name}</td>
                    <td>{getMonthName(r.month)} {r.year}</td>
                    <td>{r.prevUnit}</td>
                    <td>{r.currUnit}</td>
                    <td style={{ color: "var(--text-primary)" }}>{r.currUnit - r.prevUnit}</td>
                    <td>৳{r.costPerUnit}</td>
                    <td style={{ color: "#818cf8", fontWeight: 600 }}>
                      {formatCurrency((r.currUnit - r.prevUnit) * r.costPerUnit)}
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
