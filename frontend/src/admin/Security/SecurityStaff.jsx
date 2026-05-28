import React, { useCallback, useEffect, useState } from "react";
import "../../styles/admin.css";
import API_BASE from "../../config/api";

const SecurityStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState("");
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [statusGuard, setStatusGuard] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [resetGuard, setResetGuard] = useState(null);
  const [resetForm, setResetForm] = useState({ newPassword: "", confirmPassword: "" });
  const [verifyBusyId, setVerifyBusyId] = useState("");
  const [securityDocType, setSecurityDocType] = useState("AADHAAR");
  const [securityDocNumber, setSecurityDocNumber] = useState("");
  const [securityDocBusy, setSecurityDocBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    documentType: "ID_CARD",
    documentNumber: "",
  });

  const [errors, setErrors] = useState({});

  const parseGuardIdNumber = (guardId) => {
    const match = String(guardId || "").match(/(\d+)/);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  const validateSecurityDocumentInput = ({ type, number }) => {
    const normalizedType = String(type || "").trim().toUpperCase();
    const normalizedNumber = String(number || "").trim();

    if (!normalizedType || !normalizedNumber) {
      return "Document type and number are required";
    }

    if (normalizedType === "AADHAAR") {
      if (!/^\d{12}$/.test(normalizedNumber)) {
        return "Aadhaar number must be exactly 12 digits";
      }
      return "";
    }

    if (!/^[A-Z0-9-]{4,32}$/i.test(normalizedNumber)) {
      return "Document number must be 4-32 characters (letters, numbers, hyphen)";
    }

    return "";
  };

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/admin/security-staff`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch staff");
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch security staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  /* ========================
     VALIDATION
  ======================== */
  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z\s]{3,}$/.test(form.name)) {
      newErrors.name = "Name must contain only letters (min 3)";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter valid email";
    }

    // Phone (India)
    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = "Enter valid 10-digit Indian mobile number";
    } else {
      const exists = staff.some(
        (s) => String(s.phone || "").replace("+91 ", "") === form.phone
      );
      if (exists) {
        newErrors.phone = "Phone number already exists";
      }
    }

    if (!form.documentType.trim()) {
      newErrors.documentType = "Document type is required";
    }

    const documentError = validateSecurityDocumentInput({
      type: form.documentType,
      number: form.documentNumber,
    });
    if (documentError) {
      newErrors.documentNumber = documentError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ========================
     HELPERS
  ======================== */
  const generateCredentials = () => {
    const password = Math.random().toString(36).slice(-8);
    return { password };
  };

  const submitStatusChange = async () => {
    if (!statusGuard) return;
    if (!statusReason.trim()) {
      alert("Please provide reason for status change");
      return;
    }

    try {
      setTogglingId(statusGuard._id);
      const res = await fetch(`${API_BASE}/api/admin/security-staff/${statusGuard._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          isActive: !statusGuard.isActive,
          reason: statusReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      setStaff((prev) =>
        prev.map((s) => (s._id === statusGuard._id
          ? {
            ...s,
            isActive: !s.isActive,
            securityStatusMeta: data?.guard?.securityStatusMeta || s.securityStatusMeta,
          }
          : s))
      );
      setStatusGuard(null);
      setStatusReason("");
    } catch (err) {
      alert(err.message || "Failed to update guard status");
    } finally {
      setTogglingId("");
    }
  };

  const submitResetPassword = async () => {
    if (!resetGuard) return;
    if (!resetForm.newPassword || !resetForm.confirmPassword) {
      alert("Please fill password fields");
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/security-staff/${resetGuard._id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          newPassword: resetForm.newPassword,
          confirmPassword: resetForm.confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      alert("Security guard password reset successfully");
      setResetGuard(null);
      setResetForm({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      alert(err.message || "Failed to reset password");
    }
  };

  const handleVerifyDocument = async (guard, documentId) => {
    if (!guard?._id || !documentId) return;

    setVerifyBusyId(documentId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/security-staff/${guard._id}/documents/${documentId}/verify`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify document");

      if (data?.guard) {
        setSelectedGuard(data.guard);
      }

      await fetchStaff();
    } catch (err) {
      alert(err.message || "Failed to verify document");
    } finally {
      setVerifyBusyId("");
    }
  };

  const handleAddSecurityDocument = async () => {
    if (!selectedGuard?._id) return;

    const validationMessage = validateSecurityDocumentInput({
      type: securityDocType,
      number: securityDocNumber,
    });
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    setSecurityDocBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/security-staff/${selectedGuard._id}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          type: securityDocType,
          number: securityDocNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add document");

      if (data?.guard) {
        setSelectedGuard(data.guard);
      }

      setSecurityDocType("AADHAAR");
      setSecurityDocNumber("");
      await fetchStaff();
    } catch (err) {
      alert(err.message || "Failed to add document");
    } finally {
      setSecurityDocBusy(false);
    }
  };

  const addStaff = async () => {
  if (!validateForm()) return;

  const creds = generateCredentials();

  try {
    setSubmitting(true);
    const res = await fetch(`${API_BASE}/api/admin/create-security`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: `+91${form.phone}`,
        password: creds.password,
        documents: [
          {
            type: String(form.documentType || "").trim().toUpperCase(),
            number: String(form.documentNumber || "").trim(),
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to create guard");
      return;
    }

    alert(
      `Security Guard Created\n\nEmail: ${form.email}\nPassword: ${creds.password}`
    );

    await fetchStaff();
    setShowModal(false);
    setForm({ name: "", email: "", phone: "", documentType: "ID_CARD", documentNumber: "" });
  } catch (err) {
    alert("Backend not reachable");
  } finally {
    setSubmitting(false);
  }
};

  /* ========================
     FILTERS & STATS
  ======================== */
  const filteredStaff = staff
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        String(s.guardId || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const idDiff = parseGuardIdNumber(a.guardId) - parseGuardIdNumber(b.guardId);
      if (idDiff !== 0) return idDiff;

      return String(a.guardId || "").localeCompare(String(b.guardId || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  const total = staff.length;
  const active = staff.filter((s) => s.isActive !== false).length;
  const inactive = total - active;

  /* ========================
     UI
  ======================== */
  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header between">
        <div>
          <h1 className="page-title">Security Staff</h1>
          <p className="page-subtitle">
            Manage guards and access control
          </p>
        </div>

        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Add Guard
        </button>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Guards</h4>
          <p>{total}</p>
        </div>
        <div className="stat-card success">
          <h4>Active</h4>
          <p>{active}</p>
        </div>
        <div className="stat-card danger">
          <h4>Inactive</h4>
          <p>{inactive}</p>
        </div>
      </div>

      {/* SEARCH */}
      <input
        className="search-input"
        placeholder="Search by guard name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p className="muted-text">Loading guards...</p>}
      {!loading && error && <p className="error-text">{error}</p>}

      {/* TABLE */}
      <div className="card table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Guard ID</th>
              <th>Guard Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>View Profile</th>
              <th>Reset Password</th>
            </tr>
          </thead>

          <tbody>
            {!loading && filteredStaff.map((s) => (
              <tr key={s._id}>
                <td>
                  <strong>{s.guardId || "SEC-PENDING"}</strong>
                 {/* <div className="muted">{s.id}</div>*/}
                </td>
                <td>{s.name}</td>
                <td>{s.email || "-"}</td>
                <td>{s.phone || "-"}</td>
                <td>
                  <button
                    type="button"
                    className={`status-badge ${
                      s.isActive !== false ? "active" : "inactive"
                    }`}
                    onClick={() => {
                      setStatusGuard(s);
                      setStatusReason("");
                    }}
                    disabled={togglingId === s._id}
                  >
                    {s.isActive !== false ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button className="link-btn" onClick={() => setSelectedGuard(s)}>
                    View Profile
                  </button>
                </td>
                <td>
                  <button className="link-btn" onClick={() => setResetGuard(s)}>
                    Reset Password
                  </button>
                </td>
              </tr>
            ))}

            {!loading && filteredStaff.length === 0 && (
              <tr>
                <td colSpan="7" className="empty">
                  No guards found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal">
            <h2>Add Security Guard</h2>

            <label>Name *</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            {errors.name && <p className="error-text">{errors.name}</p>}

            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}

            <label>Phone *</label>
            <input
              maxLength="10"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, ""),
                })
              }
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}

            <label>Document Type *</label>
            <select
              value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value })}
            >
              <option value="AADHAAR">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="DRIVING_LICENSE">Driving License</option>
              <option value="ID_CARD">ID Card</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.documentType && <p className="error-text">{errors.documentType}</p>}

            <label>Document Number *</label>
            <input
              maxLength="12"
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value.replace(/\D/g, "") })}
            />
            {errors.documentNumber && <p className="error-text">{errors.documentNumber}</p>}

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
              >
                Cancel
              </button>
              <button className="primary-btn" onClick={addStaff} disabled={submitting}>
                {submitting ? "Creating..." : "Create Guard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedGuard && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal profile-modal">
            <h2>Guard Profile</h2>

            <div className="profile-keyvalue-grid">
              <p><strong>ID:</strong> {selectedGuard.guardId || "SEC-PENDING"}</p>
              <p><strong>Name:</strong> {selectedGuard.name}</p>
              <p><strong>Email:</strong> {selectedGuard.email || "-"}</p>
              <p><strong>Phone:</strong> {selectedGuard.phone || "-"}</p>
              <p><strong>Status:</strong> {selectedGuard.isActive !== false ? "Active" : "Inactive"}</p>
              <p><strong>Status Reason:</strong> {selectedGuard.securityStatusMeta?.reason || "-"}</p>
            </div>

            <hr />

            <h4>Documents</h4>
            {selectedGuard.documents?.length ? (
              <div className="security-doc-list">
                {selectedGuard.documents.map((doc, idx) => (
                  <div key={doc._id || `${doc.type || "doc"}-${idx}`} className="security-doc-row">
                    <div className="security-doc-main">
                      <strong>{doc.type || "Document"}:</strong> {doc.number || "-"}
                      {(doc.verification || doc.verifiedOn) && (
                        <p className="muted-text small">
                          Verified on {new Date(doc.verification || doc.verifiedOn).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="security-doc-actions">
                      <span className={`status-badge ${doc.verified ? "active" : "inactive"}`}>
                        {doc.verified ? "Verified" : "Pending"}
                      </span>
                      {!doc.verified && doc._id && (
                        <button
                          className="link-btn"
                          onClick={() => handleVerifyDocument(selectedGuard, doc._id)}
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
              <p className="muted-text">No documents found</p>
            )}

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Add Document</label>
              <select
                value={securityDocType}
                onChange={(e) => setSecurityDocType(e.target.value)}
              >
                <option value="AADHAAR">Aadhaar</option>
                <option value="PAN">PAN</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="ID_CARD">ID Card</option>
                <option value="OTHER">Other</option>
              </select>
              <input
                type="text"
                value={securityDocNumber}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (securityDocType === "AADHAAR") {
                    setSecurityDocNumber(raw.replace(/\D/g, "").slice(0, 12));
                    return;
                  }
                  setSecurityDocNumber(raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32));
                }}
                placeholder={securityDocType === "AADHAAR" ? "Aadhaar number (12 digits)" : "Document number"}
                maxLength={securityDocType === "AADHAAR" ? 12 : 32}
                inputMode={securityDocType === "AADHAAR" ? "numeric" : "text"}
              />
              <button
                className="primary-btn"
                onClick={handleAddSecurityDocument}
                disabled={securityDocBusy}
              >
                {securityDocBusy ? "Adding..." : "Add Document"}
              </button>
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setSelectedGuard(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {resetGuard && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal">
            <h2>Reset Password</h2>
            <p className="muted-text">{resetGuard.name} ({resetGuard.guardId || "SEC-PENDING"})</p>

            <label>New Password *</label>
            <input
              type="password"
              value={resetForm.newPassword}
              onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
            />

            <label>Confirm Password *</label>
            <input
              type="password"
              value={resetForm.confirmPassword}
              onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
            />

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setResetGuard(null)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={submitResetPassword}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {statusGuard && (
        <div className="modal-backdrop">
          <div className="modal-card modern-modal">
            <h2>{statusGuard.isActive !== false ? "Set Inactive" : "Set Active"}</h2>
            <p className="muted-text">{statusGuard.name} ({statusGuard.guardId || "SEC-PENDING"})</p>

            <label>Reason *</label>
            <textarea
              rows="3"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Reason for status change"
            />

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setStatusGuard(null)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={submitStatusChange} disabled={togglingId === statusGuard._id}>
                {togglingId === statusGuard._id ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityStaff;
