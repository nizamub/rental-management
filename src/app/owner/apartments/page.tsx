"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Edit3, Trash2, UserPlus, X, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Apartment {
  id: string;
  name: string;
  floor: string | null;
  size: string | null;
  status: string;
  renterId: string | null;
  renter: { id: string; name: string; email: string; phone: string | null } | null;
  _count: { bills: number };
}

interface Renter {
  id: string;
  name: string;
  email: string;
  apartment: { id: string } | null;
}

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const [assigningApt, setAssigningApt] = useState<Apartment | null>(null);
  const [form, setForm] = useState({ name: "", floor: "", size: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [aptsRes, rentersRes] = await Promise.all([
        fetch("/api/apartments"),
        fetch("/api/renters"),
      ]);
      setApartments(await aptsRes.json());
      setRenters(await rentersRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingApt ? `/api/apartments/${editingApt.id}` : "/api/apartments";
      const method = editingApt ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingApt(null);
        setForm({ name: "", floor: "", size: "" });
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this apartment?")) return;
    await fetch(`/api/apartments/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleAssign = async (renterId: string | null) => {
    if (!assigningApt) return;
    await fetch(`/api/apartments/${assigningApt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ renterId }),
    });
    setShowAssignModal(false);
    setAssigningApt(null);
    fetchData();
  };

  const openEdit = (apt: Apartment) => {
    setEditingApt(apt);
    setForm({ name: apt.name, floor: apt.floor || "", size: apt.size || "" });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingApt(null);
    setForm({ name: "", floor: "", size: "" });
    setShowModal(true);
  };

  const unassignedRenters = renters.filter((r) => !r.apartment);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Apartments</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {apartments.length} total · {apartments.filter(a => a.status === "OCCUPIED").length} occupied
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Apartment
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {apartments.map((apt) => (
          <div key={apt.id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: apt.status === "OCCUPIED" ? "rgba(99, 102, 241, 0.15)" : "rgba(107, 114, 128, 0.15)" }}>
                  <Building2 className="w-5 h-5" style={{ color: apt.status === "OCCUPIED" ? "#818cf8" : "#9ca3af" }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{apt.name}</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{apt.floor || "—"}</p>
                </div>
              </div>
              <span className={`badge badge-${apt.status.toLowerCase()}`}>{apt.status}</span>
            </div>

            <div className="space-y-2 mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              {apt.size && <p>Size: {apt.size}</p>}
              <p>Bills: {apt._count.bills}</p>
              {apt.renter && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ background: "rgba(99, 102, 241, 0.05)" }}>
                  <Users className="w-4 h-4" style={{ color: "#818cf8" }} />
                  <span style={{ color: "var(--text-primary)" }}>{apt.renter.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => openEdit(apt)} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-xs py-2">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => { setAssigningApt(apt); setShowAssignModal(true); }} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-xs py-2">
                <UserPlus className="w-3 h-3" /> {apt.renter ? "Reassign" : "Assign"}
              </button>
              <button onClick={() => handleDelete(apt.id)} className="btn-danger flex items-center justify-center px-3 py-2">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {apartments.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>No apartments yet. Add your first apartment!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingApt ? "Edit Apartment" : "Add Apartment"}
              </h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Name *</label>
                <input className="input-field" placeholder="e.g. Apt 2B" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Floor</label>
                <input className="input-field" placeholder="e.g. 2nd Floor" value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: "var(--text-secondary)" }}>Size</label>
                <input className="input-field" placeholder="e.g. 850 sq ft" value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })} />
              </div>
              <button onClick={handleSave} disabled={!form.name || saving} className="btn-primary w-full py-3">
                {saving ? "Saving..." : editingApt ? "Update Apartment" : "Add Apartment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Renter Modal */}
      {showAssignModal && assigningApt && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Assign Renter to {assigningApt.name}
              </h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            {assigningApt.renter && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Currently assigned: <span style={{ color: "var(--text-primary)" }}>{assigningApt.renter.name}</span>
                </p>
                <button onClick={() => handleAssign(null)} className="btn-danger mt-2 text-xs py-1 px-3">
                  Unassign
                </button>
              </div>
            )}
            <div className="space-y-2">
              {unassignedRenters.length === 0 ? (
                <p className="text-center py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                  No unassigned renters available
                </p>
              ) : (
                unassignedRenters.map((renter) => (
                  <button key={renter.id} onClick={() => handleAssign(renter.id)}
                    className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-all"
                    style={{ background: "rgba(10, 10, 26, 0.4)", border: "1px solid var(--border-color)" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}>
                      <span className="text-white text-sm font-semibold">{renter.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{renter.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{renter.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
