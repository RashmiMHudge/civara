
import React, { useState, useEffect } from "react";
import "../../styles/admin.css";
import API_BASE from "../../config/api";

const SHIFT_DEFAULT_TIMES = {
  Morning: { startTime: "06:00", endTime: "14:00" },
  Afternoon: { startTime: "14:00", endTime: "22:00" },
  Night: { startTime: "22:00", endTime: "06:00" },
};

const SecurityShifts = () => {
  const [plans, setPlans] = useState([]);
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    date: "",
    shift: "",
    gate: "",
    required: "",
    guardId: "",
    startTime: "",
    endTime: "",
  });


  const fetchShifts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/shifts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch shifts");
      setPlans(data);
    } catch (err) {
      setError(err.message || "Failed to load shifts");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchShifts();
    fetchGuards();
  }, []);

  const fetchGuards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/security-staff`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch guards");
      const activeGuards = (Array.isArray(data) ? data : []).filter((g) => g.isActive !== false);
      setGuards(activeGuards);
    } catch (err) {
      setGuards([]);
    }
  };

  // Add shift via backend
  const addShift = async () => {
    if (!form.date || !form.shift || !form.gate || !form.required || !form.startTime || !form.endTime || !form.guardId) {
      alert("Please fill all fields");
      return;
    }
    try {
      const selectedGuard = guards.find((g) => g.guardId === form.guardId);
      const res = await fetch(`${API_BASE}/api/shifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          guardId: form.guardId || null,
          guardName: selectedGuard?.name || null,
          gate: form.gate,
          shiftType: form.shift,
          date: form.date,
          required: Number(form.required),
          startTime: form.startTime,
          endTime: form.endTime,
          status: "Planned"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add shift");
      setShowModal(false);
      setForm({
        date: "",
        shift: "",
        gate: "",
        required: "",
        guardId: "",
        startTime: "",
        endTime: "",
      });
      fetchShifts();
    } catch (err) {
      alert(err.message || "Failed to add shift");
    }
  };

  /* =====================
     DELETE SHIFT
  ===================== */
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_BASE}/api/shifts/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!res.ok) throw new Error("Failed to delete shift");
      setDeleteId(null);
      fetchShifts();
    } catch (err) {
      alert(err.message || "Failed to delete shift");
    }
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header between">
        <div>
          <h1 className="page-title">Security Shifts</h1>
          <p className="page-subtitle">
            Plan guard requirements per gate and shift
          </p>
        </div>

        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Plan Shift
        </button>
      </div>

      {/* SHIFTS GRID */}
      <div className="shift-grid">
        {plans.map((plan) => (
          <div className="shift-card" key={plan._id}>
            <div className="shift-card-header">
              <h3>{plan.date}</h3>
              <span className="status-pill planned">{plan.status}</span>
            </div>

            <div className="shift-card-body">
              <div className="shift-info">
                <span className="label">Shift</span>
                <span className="value">{plan.shiftType}</span>
              </div>

              <div className="shift-info">
                <span className="label">Gate</span>
                <span className="value">{plan.gate}</span>
              </div>

              <div className="shift-info">
                <span className="label">Required Guards</span>
                <span className="value">{plan.required || 1}</span>
              </div>
              {plan.guardName && (
                <div className="shift-info">
                  <span className="label">Primary Guard</span>
                  <span className="value">{plan.guardName} ({plan.guardId})</span>
                </div>
              )}
              {plan.assignedGuards && plan.assignedGuards.length > 0 && (
                <div className="shift-info">
                  <span className="label">Assigned Guards</span>
                  <span className="value">
                    {plan.assignedGuards.map(g => g.guardName).join(", ")}
                  </span>
                </div>
              )}
            </div>

            <div className="shift-card-footer">
              <button
                className="danger-btn-outline"
                onClick={() => setDeleteId(plan._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="muted-text">Loading shift plans...</p>}
      {!loading && error && <p className="error-text">{error}</p>}
      {!loading && !error && plans.length === 0 && (
        <p className="muted-text">No shift plans created yet.</p>
      )}

      {/* ADD SHIFT MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
              <h2>Plan Security Shift</h2>

              <div className="modal-content">
                <label>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />

                <label>Shift *</label>
                <select
                  value={form.shift}
                  onChange={(e) => {
                    const nextShift = e.target.value;
                    const defaults = SHIFT_DEFAULT_TIMES[nextShift] || { startTime: "", endTime: "" };
                    setForm({
                      ...form,
                      shift: nextShift,
                      startTime: defaults.startTime,
                      endTime: defaults.endTime,
                    });
                  }}
                >
                  <option value="">Select Shift</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Night</option>
                </select>

                <label>Start Time *</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />

                <label>End Time *</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />

                <label>Gate *</label>
                <select
                  value={form.gate}
                  onChange={(e) => setForm({ ...form, gate: e.target.value })}
                >
                  <option value="">Select Gate</option>
                  <option>Main Gate</option>
                  <option>Block A</option>
                  <option>Block B</option>
                  <option>Block C</option>
                </select>

                <label>Required Guards *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  value={form.required}
                  onChange={(e) =>
                    setForm({ ...form, required: e.target.value })
                  }
                />

                <label>Assign Guard (optional)</label>
                <select
                  value={form.guardId}
                  onChange={(e) => setForm({ ...form, guardId: e.target.value })}
                >
                  <option value="">Select Guard *</option>
                  {guards.map((g) => (
                    <option key={g._id} value={g.guardId}>
                      {g.name} ({g.guardId || "SEC-PENDING"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button className="secondary-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="primary-btn" onClick={addShift}>
                  Save Shift
                </button>
              </div>
            </div>
          </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteId && (
        <div className="modal-backdrop">
          <div className="modal-card small-modal">
            <h3>Delete Shift Plan?</h3>
            <p>This action cannot be undone.</p>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button className="danger-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityShifts;
