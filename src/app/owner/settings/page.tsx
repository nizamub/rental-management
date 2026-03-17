"use client";

import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SettingsData {
  id: string;
  costPerUnit: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  buildingName: string;
  buildingAddress: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        setSettings(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) setMessage("Settings saved!");
      else setMessage("Failed to save");
    } catch { setMessage("Error saving"); }
    finally { setSaving(false); }
  };

  if (loading || !settings) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Manage system configuration</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Settings className="w-4 h-4" style={{ color: "#818cf8" }} /> Electricity Settings
          </h3>
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Default Cost Per Unit (৳)</label>
            <input className="input-field" type="number" step="0.5" value={settings.costPerUnit}
              onChange={(e) => setSettings({ ...settings, costPerUnit: Number(e.target.value) })} />
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Building Info</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Building Name</label>
              <input className="input-field" value={settings.buildingName}
                onChange={(e) => setSettings({ ...settings, buildingName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Address</label>
              <input className="input-field" value={settings.buildingAddress}
                onChange={(e) => setSettings({ ...settings, buildingAddress: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Owner Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Name</label>
              <input className="input-field" value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input className="input-field" type="email" value={settings.ownerEmail}
                onChange={(e) => setSettings({ ...settings, ownerEmail: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Phone</label>
              <input className="input-field" value={settings.ownerPhone}
                onChange={(e) => setSettings({ ...settings, ownerPhone: e.target.value })} />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && <p className="text-sm text-center" style={{ color: message.includes("saved") ? "#34d399" : "#f87171" }}>{message}</p>}
      </div>
    </div>
  );
}
