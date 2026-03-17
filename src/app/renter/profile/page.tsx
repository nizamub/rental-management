"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Save } from "lucide-react";

export default function RenterProfilePage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ name: "", phone: "", currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({ ...f, name: session.user.name || "" }));
      setLoading(false);
    }
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage("");
    try {
      const updateBody: Record<string, string> = {};
      if (form.name) updateBody.name = form.name;
      if (form.phone) updateBody.phone = form.phone;
      if (form.newPassword) updateBody.password = form.newPassword;

      const res = await fetch(`/api/renters/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });

      if (res.ok) {
        setMessage("Profile updated!");
        setForm({ ...form, currentPassword: "", newPassword: "" });
      } else {
        const data = await res.json();
        setMessage(data.error || "Update failed");
      }
    } catch {
      setMessage("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Profile</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Update your personal info</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{session?.user?.name}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{session?.user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Full Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
            <input className="input-field" placeholder="+880..." value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Change Password</p>
            <div className="space-y-3">
              <input className="input-field" type="password" placeholder="New Password" value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Update Profile"}
          </button>

          {message && (
            <p className="text-sm text-center" style={{ color: message.includes("updated") ? "#34d399" : "#f87171" }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
