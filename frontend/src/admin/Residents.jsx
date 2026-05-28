import React, { useCallback, useEffect, useState } from "react";
import "../styles/admin.css";
import { QRCodeCanvas } from "qrcode.react";
import AddResidentModal from "./AddResidentModal";
import API_BASE from "../config/api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);
  const [qrResident, setQrResident] = useState(null);
  const [resetResident, setResetResident] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const [verifyBusyId, setVerifyBusyId] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // 🔹 CONFIRMATION MODAL STATE
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionReason, setActionReason] = useState("");

  /* ======================
     ANALYTICS
  ====================== */
  const total = residents.length;
  const active = residents.filter(r => r.status === "Active").length;
  const inactive = total - active;

  const maintenanceStats = {
    Paid: residents.filter(r => r.maintenanceStatus === "Paid").length,
    Pending: residents.filter(r => r.maintenanceStatus === "Pending").length,
    Overdue: residents.filter(r => r.maintenanceStatus === "Overdue").length,
  };

  const ownerCount = residents.filter(r => r.role === "OWNER").length;
  const tenantCount = residents.filter(r => r.role === "TENANT").length;

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];
  const ROLE_COLORS = ["#22c55e", "#f59e0b"];

  /* ======================
     HELPERS
  ====================== */

  const mapResident = useCallback((resident) => {
    const derivedId = resident?.residentId || resident?.id || resident?._id || resident?.email || "-";
    const dbId = resident?._id || (typeof resident?.id === "string" && resident.id.length === 24 ? resident.id : null);
    const maintenance = resident?.maintenanceStatus || "Pending";
    const displayCode = resident?.flat
      ? `${resident?.block ? `${resident.block}-` : ""}${resident.flat}`
      : resident?.residentId || resident?.email || "-";

    return {
      ...resident,
      id: derivedId,
      dbId,
      displayCode,
      role: resident?.occupancyType || resident?.residentType || "RESIDENT",
      status: resident?.isActive === false ? "Inactive" : "Active",
      maintenanceStatus: maintenance,
      qrValue: resident?.qrValue || String(derivedId),
      block: resident?.block || "-",
      flat: resident?.flat || "-",
      phone: resident?.phone || "-",
      documents: Array.isArray(resident?.documents) ? resident.documents : [],
    };
  }, []);

  const fetchResidents = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setFetchError(data?.message || "Failed to load residents. Please login as admin again.");
        setResidents([]);
        return;
      }

      const users = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      const residentUsers = Array.isArray(users)
        ? users.filter((u) => u.role === "resident").map(mapResident)
        : [];

      setResidents(residentUsers);
    } catch (err) {
      setFetchError("Backend not reachable. Please try again.");
      setResidents([]);
    } finally {
      setLoading(false);
    }
  }, [mapResident]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const addResident = async () => {
    await fetchResidents();
    setSearch("");
    setShowAdd(false);
  };

  const handleAdminResetPassword = async () => {
    if (!resetResident?.email) {
      alert("Resident email is not available");
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      alert("Please fill both password fields");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match");
      return;
    }

    if (String(newPassword).length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setResetBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/residents/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          residentId: resetResident.dbId,
          email: resetResident.email,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to reset password");
        return;
      }

      alert("Resident password reset successfully");
      setResetResident(null);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      alert("Unable to reset password right now");
    } finally {
      setResetBusy(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (!confirmAction.residentId) {
      alert("This resident is from demo data. Backend update is not available.");
      return;
    }

    if (confirmAction.type === "STATUS" && !actionReason.trim()) {
      return;
    }

    setActionBusy(true);
    try {
      const endpoint =
        confirmAction.type === "STATUS"
          ? `${API_BASE}/api/admin/residents/${confirmAction.residentId}/status`
          : `${API_BASE}/api/admin/residents/${confirmAction.residentId}/maintenance`;

      const payload =
        confirmAction.type === "STATUS"
          ? {
              isActive: confirmAction.currentValue !== "Active",
              reason: actionReason.trim(),
            }
          : {
              maintenanceStatus:
                confirmAction.currentValue === "Paid"
                  ? "Pending"
                  : confirmAction.currentValue === "Pending"
                  ? "Overdue"
                  : "Paid",
              note: actionReason.trim(),
            };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update resident");
        return;
      }

      await fetchResidents();
      if (viewProfile?.dbId === confirmAction.residentId) {
        const updated = data?.resident ? mapResident(data.resident) : null;
        if (updated) setViewProfile(updated);
      }

      setConfirmAction(null);
      setActionReason("");
    } catch (err) {
      alert("Unable to update resident right now");
    } finally {
      setActionBusy(false);
    }
  };

  const handleAddDocument = async () => {
    if (!viewProfile?.dbId || !docType.trim() || !docNumber.trim()) {
      alert("Document type and number are required");
      return;
    }

    if (!/^\d{12}$/.test(docNumber.trim())) {
      alert("Document number must be exactly 12 digits");
      return;
    }

    setDocBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/residents/${viewProfile.dbId}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          type: docType.trim(),
          number: docNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to add document");
        return;
      }

      if (data?.resident) {
        setViewProfile(mapResident(data.resident));
      }
      await fetchResidents();
      setDocType("");
      setDocNumber("");
    } catch (err) {
      alert("Unable to add document right now");
    } finally {
      setDocBusy(false);
    }
  };

  const handleVerifyDocument = async (documentId) => {
    if (!viewProfile?.dbId || !documentId) return;
    setVerifyBusyId(documentId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/residents/${viewProfile.dbId}/documents/${documentId}/verify`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to verify document");
        return;
      }

      if (data?.resident) {
        setViewProfile(mapResident(data.resident));
      }
      await fetchResidents();
    } catch (err) {
      alert("Unable to verify document right now");
    } finally {
      setVerifyBusyId("");
    }
  };

  const filteredResidents = residents
    .filter(
      r =>
        String(r.name || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.email || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.flat || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.id || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.displayCode || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aBlock = String(a.block || "").trim();
      const bBlock = String(b.block || "").trim();
      const blockSort = aBlock.localeCompare(bBlock, undefined, { numeric: true, sensitivity: "base" });
      if (blockSort !== 0) return blockSort;

      const aFlat = String(a.flat || "").trim();
      const bFlat = String(b.flat || "").trim();
      return aFlat.localeCompare(bFlat, undefined, { numeric: true, sensitivity: "base" });
    });

  /* ======================
     UI
  ====================== */
  return (
    <div className="page-container">
      <h1 className="page-title">Residents</h1>

      {/* KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">Total<strong>{total}</strong></div>
        <div className="kpi-card success">Active<strong>{active}</strong></div>
        <div className="kpi-card warning">Inactive<strong>{inactive}</strong></div>
        <div className="kpi-card danger">
          Defaulters
          <strong>{maintenanceStats.Pending + maintenanceStats.Overdue}</strong>
        </div>
      </div>

      {/* ANALYTICS */}
      <div className="analytics-grid">
        <div className="card">
          <h3>Maintenance Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: "Paid", value: maintenanceStats.Paid },
                  { name: "Pending", value: maintenanceStats.Pending },
                  { name: "Overdue", value: maintenanceStats.Overdue },
                ]}
                dataKey="value"
                innerRadius={50}
              >
                {COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <small className="muted-text">
            Maintenance Payment Status Distribution
          </small>
        </div>

        <div className="card">
          <h3>Resident Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: "Owners", value: ownerCount },
                  { name: "Tenants", value: tenantCount },
                ]}
                dataKey="value"
                innerRadius={50}
              >
                {ROLE_COLORS.map((c, i) => (
                  <Cell key={i} fill={c} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <small className="muted-text">
            Owners and Tenants Distribution
          </small>
        </div>
      </div>

      {/* SEARCH + ADD */}
      <div className="page-header">
        <input
          className="search-input"
          placeholder="Search by name, flat or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="primary-btn" onClick={() => setShowAdd(true)}>
          + Add Resident
        </button>
      </div>

      {loading && <p className="muted-text">Loading residents...</p>}
      {!!fetchError && <p className="muted-text">{fetchError}</p>}

      {/* TABLE */}
      <div className="card table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Resident</th>
              <th>Flat</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Maintenance</th>
              <th>QR</th>
              <th>Profile</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredResidents.map(r => (
              <tr key={r.id || r.email}>
                <td>
                  <strong>{r.name}</strong>
                  <div className="muted-text">{r.displayCode || "-"}</div>
                </td>

                <td>{r.block}-{r.flat}</td>

                <td>
                  <span className={`status-badge ${r.role === "OWNER" ? "paid" : r.role === "TENANT" ? "pending" : "active"}`}>
                    {r.role}
                  </span>
                </td>

                <td>{r.phone}</td>

                {/* STATUS */}
                <td>
                  <span
                    className={`status-badge ${r.status === "Active" ? "active" : "inactive"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setConfirmAction({
                        type: "STATUS",
                        residentId: r.dbId,
                        currentValue: r.status,
                      })
                    }
                  >
                    {r.status}
                  </span>
                </td>

                {/* MAINTENANCE */}
                <td>
                  <span
                    className={`status-badge ${r.maintenanceStatus.toLowerCase()}`}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      setConfirmAction({
                        type: "MAINTENANCE",
                        residentId: r.dbId,
                        currentValue: r.maintenanceStatus,
                      })
                    }
                  >
                    {r.maintenanceStatus}
                  </span>
                </td>

                <td>
                  <button className="link-btn" onClick={() => setQrResident(r)}>
                    View
                  </button>
                </td>

                <td>
                  <button className="link-btn" onClick={() => setViewProfile(r)}>
                    View Profile
                  </button>
                </td>

                <td>
                  <button className="link-btn" onClick={() => setResetResident(r)}>
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}
            {!filteredResidents.length && !loading && (
              <tr>
                <td colSpan={9} className="empty">
                  No residents match the current search. Clear search to view all records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD RESIDENT MODAL */}
      {showAdd && (
        <AddResidentModal
          onClose={() => setShowAdd(false)}
          onAdd={addResident}
          existingCount={residents.length}
        />
      )}

      {/* PROFILE MODAL */}
      {viewProfile && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal">
            <h2>Resident Profile</h2>

            <p><strong>Name:</strong> {viewProfile.name}</p>
            <p><strong>Flat:</strong> {viewProfile.block}-{viewProfile.flat}</p>
            <p><strong>Role:</strong> {viewProfile.role}</p>
            <p><strong>Phone:</strong> {viewProfile.phone}</p>
            <p><strong>Email:</strong> {viewProfile.email || "-"}</p>

            <hr />

            <h4>Emergency Contact</h4>
            <p><strong>Name:</strong> {viewProfile.emergencyContact?.name || "-"}</p>
            <p><strong>Relation:</strong> {viewProfile.emergencyContact?.relation || "-"}</p>
            <p><strong>Phone:</strong> {viewProfile.emergencyContact?.phone || "-"}</p>

            <hr />

            <h4>Documents</h4>
            {viewProfile.documents?.length ? (
              <div>
                {viewProfile.documents.map((doc, idx) => (
                  <div key={doc._id || `${doc.type || "doc"}-${idx}`} className="document-row">
                    <div>
                      <strong>{doc.type || "Document"}:</strong> {doc.number || "-"}
                      {doc.verification && (
                        <p className="muted-text small">Verified on {new Date(doc.verification).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`status-badge ${doc.verified ? "active" : "inactive"}`}>
                        {doc.verified ? "Verified" : "Pending"}
                      </span>
                      {!doc.verified && doc._id && (
                        <button
                          className="link-btn"
                          onClick={() => handleVerifyDocument(doc._id)}
                          disabled={verifyBusyId === doc._id}
                        >
                          {verifyBusyId === doc._id ? "Verifying..." : "Verify"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>-</p>
            )}

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Add Document</label>
              <input
                type="text"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Document type (e.g. Rental Agreement)"
              />
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Document number (12 digits)"
                maxLength={12}
                inputMode="numeric"
              />
              <button className="primary-btn" onClick={handleAddDocument} disabled={docBusy}>
                {docBusy ? "Adding..." : "Add Document"}
              </button>
            </div>

            <div className="modal-actions">
              <button className="primary-btn" onClick={() => setViewProfile(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrResident && (
        <div className="modal-backdrop">
          <div className="modal-card qr-card">
            <h2>Resident QR</h2>
            <QRCodeCanvas value={qrResident.qrValue} size={220} />
            <p>{qrResident.id}</p>
            <button className="primary-btn" onClick={() => setQrResident(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM ACTION MODAL */}
      {confirmAction && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal">
            <h2>
              {confirmAction.type === "STATUS"
                ? confirmAction.currentValue === "Active"
                  ? "Deactivate Resident"
                  : "Activate Resident"
                : "Update Maintenance Status"}
            </h2>

            <p className="modal-subtitle">
              Please confirm this action.
            </p>

            <textarea
              placeholder={
                confirmAction.type === "STATUS"
                  ? "Reason (required)"
                  : "Note (optional)"
              }
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={3}
            />

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setConfirmAction(null);
                  setActionReason("");
                }}
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={handleConfirmAction}
                disabled={actionBusy}
              >
                {actionBusy ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetResident && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal">
            <h2>Reset Resident Password</h2>
            <p><strong>Resident:</strong> {resetResident.name}</p>
            <p><strong>Email:</strong> {resetResident.email || "-"}</p>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setResetResident(null);
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
              >
                Cancel
              </button>
              <button className="primary-btn" onClick={handleAdminResetPassword} disabled={resetBusy}>
                {resetBusy ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residents;
