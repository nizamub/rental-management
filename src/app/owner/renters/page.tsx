"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Edit3, Trash2, X, Building2, Mail, Phone } from "lucide-react";
import Link from "next/link";

interface Renter {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  apartment: { id: string; name: string; floor: string | null; status: string } | null;
}

interface ApartmentOption {
  id: string;
  name: string;
  status: string;
}

export default function RentersPage() {
  const [renters, setRenters] = useState<Renter[]>([]);
  const [apartments, setApartments] = useState<ApartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRenter, setEditingRenter] = useState<Renter | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", apartmentId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [rentersRes, aptsRes] = await Promise.all([
        fetch("/api/renters"),
        fetch("/api/apartments"),
      ]);
      setRenters(await rentersRes.json());
      setApartments(await aptsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (editingRenter) {
        const updateBody: Record<string, string> = {};
        if (form.name) updateBody.name = form.name;
        if (form.email) updateBody.email = form.email;
        if (form.phone) updateBody.phone = form.phone;
        if (form.password) updateBody.password = form.password;

        const res = await fetch(`/api/renters/${editingRenter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update");
          return;
        }
      } else {
        const res = await fetch("/api/renters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to create");
          return;
        }
      }
      setShowModal(false);
      setEditingRenter(null);
      setForm({ name: "", email: "", phone: "", password: "", apartmentId: "" });
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this renter and all their bills?")) return;
    await fetch(`/api/renters/${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (renter: Renter) => {
    setEditingRenter(renter);
    setForm({ name: renter.name, email: renter.email, phone: renter.phone || "", password: "", apartmentId: "" });
    setShowModal(true);
    setError("");
  };

  const openAdd = () => {
    setEditingRenter(null);
    setForm({ name: "", email: "", phone: "", password: "", apartmentId: "" });
    setShowModal(true);
    setError("");
  };

  const vacantApartments = apartments.filter((a) => a.status === "VACANT");

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Renters</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{renters.length} total renters</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Renter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {renters.map((renter) => (
          <div key={renter.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
                  <span className="text-white font-semibold">{renter.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{renter.name}</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Since {new Date(renter.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <span className="truncate">{renter.email}</span>
              </div>
              {renter.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <span>{renter.phone}</span>
                </div>
              )}
              {renter.apartment ? (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ background: "rgba(99, 102, 241, 0.05)" }}>
                  <Building2 className="w-4 h-4" style={{ color: "#818cf8" }} />
                  <span style={{ color: "var(--text-primary)" }}>{renter.apartment.name}</span>
                  {renter.apartment.floor && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {renter.apartment.floor}</span>
                  )}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>Not assigned to apartment</p>
              )}
            </div>

            <div className="flex gap-2">
              <Link href={`/owner/renters/${renter.id}`} className="btn-secondary flex-1 text-center text-xs py-2">
                View Details
              </Link>
              <button onClick={() => openEdit(renter)} className="btn-secondary flex items-center justify-center px-3 py-2">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={() => handleDelete(renter.id)} className="btn-danger flex items-center justify-center px-3 py-2">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {renters.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>No renters yet. Create the first renter account!</p>
        </div>
      )}

      {/* Add/Edit Renter Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingRenter ? "Edit Renter" : "Add Renter"}
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Full Name *</label>
                <input className="input-field" placeholder="e.g. John Doe" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Email *</label>
                <input className="input-field" type="email" placeholder="e.g. renter@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Phone</label>
                <input className="input-field" placeholder="+880..." value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
                  Password {editingRenter ? "(leave blank to keep)" : "*"}
                </label>
                <input className="input-field" type="password" placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              {!editingRenter && (
                <div>
                  <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Assign to Apartment</label>
                  <select className="select-field" value={form.apartmentId}
                    onChange={(e) => setForm({ ...form, apartmentId: e.target.value })}>
                    <option value="">None (assign later)</option>
                    {vacantApartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>{apt.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={handleSave}
                disabled={!form.name || !form.email || (!editingRenter && !form.password) || saving}
                className="btn-primary w-full py-3">
                {saving ? "Saving..." : editingRenter ? "Update Renter" : "Create Renter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
