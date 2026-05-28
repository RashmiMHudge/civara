import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Complaints.css";
import API_BASE from "../config/api";

const formatEnumLabel = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatAutomationAvailability = (value) => {
  const normalized = String(value || "").trim().toUpperCase();

  if (!normalized) return "Not provided";

  const availabilityMap = {
    AVAILABLE_AT_SLOT: "Available at preferred slot",
    AVAILABLE: "Available",
    UNAVAILABLE: "Unavailable",
    OUT_OF_TOWN: "Out of town",
    NOT_AVAILABLE: "Not available",
    IN_TOWN: "In town"
  };

  return availabilityMap[normalized] || formatEnumLabel(normalized);
};

const formatAdminAlertReason = (value) => {
  const normalized = String(value || "").trim().toUpperCase();

  const reasonMap = {
    WHATSAPP_REPLY_RECEIVED: "WhatsApp reply received",
    NO_RESPONSE_AFTER_3_ATTEMPTS: "No response after 3 attempts",
    CALL_SUMMARY_READY: "Call summary ready",
    ADMIN_MANUAL_ESCALATION: "Manual escalation"
  };

  return reasonMap[normalized] || formatEnumLabel(normalized) || "Automation update";
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [assignForm, setAssignForm] = useState({ technicianId: "", notes: "" });
  const [statusForm, setStatusForm] = useState({ newStatus: "", notes: "" });
  const [escalateForm, setEscalateForm] = useState({ priority: "HIGH", reason: "" });
  const [rescheduleForm, setRescheduleForm] = useState({ preferredSlot: "", notes: "" });

  const resolveAttachmentUrl = (attachment) => {
    const raw =
      typeof attachment === "string"
        ? attachment
        : attachment?.url || attachment?.filename || attachment?.name || "";

    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
    if (raw.startsWith("uploads/")) return `${API_BASE}/${raw}`;
    return `${API_BASE}/uploads/${raw.replace(/^\/+/, "")}`;
  };

  const isImageAttachment = (attachment, url) => {
    const mime = attachment?.type || "";
    if (mime.startsWith("image")) return true;
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  };

  const formatResidentLocation = (complaint) => {
    const explicitLocation = String(complaint?.location || "").trim();
    if (explicitLocation) return explicitLocation;

    const block = String(complaint?.resident?.block || "").trim();
    const flat = String(complaint?.resident?.flat || "").trim();

    if (block && flat) return `${block}-${flat}`;
    return flat || block || "-";
  };

  // Fetch complaint
  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/complaints/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Complaint not found");
        setComplaint(data);
        setStatusForm({ newStatus: data.status, notes: "" });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/security-staff`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        const data = await res.json();
        if (!res.ok) return;

        const techUsers = (Array.isArray(data) ? data : []).filter(
          (u) => u?.isActive !== false
        );
        setTechnicians(techUsers);
      } catch (err) {
        setTechnicians([]);
      }
    };

    fetchTechnicians();
  }, []);

  // ========== ACTION HANDLERS ==========
  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!assignForm.technicianId) {
      alert("Please select a technician");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/complaints/${id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          staffId: assignForm.technicianId,
          role: "SECURITY",
          notes: assignForm.notes
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to assign technician");
      }

      const updatedComplaint = await res.json();
      setComplaint(updatedComplaint);
      setShowAssignModal(false);
      setAssignForm({ technicianId: "", notes: "" });
      alert("Technician assigned successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (e) => {
    e.preventDefault();
    if (!statusForm.newStatus) {
      alert("Please select a status");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          status: statusForm.newStatus
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update status");
      }

      const updatedComplaint = await res.json();
      setComplaint(updatedComplaint);
      setShowStatusModal(false);
      alert("Status updated successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/complaints/${id}/automation`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          priority: escalateForm.priority,
          callSummary: `Escalated: ${escalateForm.reason}`,
          whatsappEscalated: true,
          adminAlertSent: true,
          adminAlertReason: "ADMIN_MANUAL_ESCALATION"
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to escalate");
      }

      const updatedComplaint = await res.json();
      setComplaint(updatedComplaint);
      setShowEscalateModal(false);
      setEscalateForm({ priority: "HIGH", reason: "" });
      alert("Complaint escalated and WhatsApp notification sent");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();

    if (!String(rescheduleForm.preferredSlot || "").trim()) {
      alert("Please enter a preferred visit slot");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/api/complaints/${id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(rescheduleForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reschedule visit");
      }

      setComplaint(data);
      setShowRescheduleModal(false);
      setRescheduleForm({ preferredSlot: "", notes: "" });
      alert("Visit rescheduled successfully");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ========== RENDER ==========
  if (loading)
    return (
      <div className="complaint-detail-page">
        <div className="page-section">Loading complaint...</div>
      </div>
    );
  if (error)
    return (
      <div className="complaint-detail-page">
        <div className="page-section">Error: {error}</div>
      </div>
    );
  if (!complaint)
    return (
      <div className="complaint-detail-page">
        <div className="page-section">Complaint not found</div>
      </div>
    );

  const { resident, automation, sla, feedback, attachments, timeline } = complaint;
  const isComplaintOnHold = complaint.status === "ON_HOLD";
  const sortedTimeline = Array.isArray(timeline)
    ? [...timeline].sort((a, b) => new Date(a.time || a.timestamp || 0) - new Date(b.time || b.timestamp || 0))
    : [];

  return (
    <div className="complaint-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-header">
        <div>
          <h1>Complaint #{complaint.complaintCode || complaint._id.slice(-8)}</h1>
          <p className="muted">
            Raised on {new Date(complaint.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`badge status ${String(complaint.status).toLowerCase()}`}>
          {complaint.status}
        </span>
      </div>

      {/* KPI STRIP */}
      <div className="kpi-strip">
        <Kpi label="Priority" value={complaint.priority} />
        <Kpi label="Complaint Status" value={complaint.status} />
        <Kpi label="SLA Status" value={sla?.paused ? "Paused" : sla?.breached ? "Breached" : "Active"} />
        <Kpi label="Assigned To" value={complaint.assignment?.assigned ? "Assigned" : "Unassigned"} />
      </div>

      {/* AUTOMATION SUMMARY */}
      <Section title="Automation Summary">
        <div className="automation-grid">
          <div className="automation-item">
            <label>Call Status</label>
            <strong>{formatEnumLabel(automation?.callStatus || "PENDING")}</strong>
          </div>
          <div className="automation-item">
            <label>Call Attempts</label>
            <strong>{automation?.callAttempts || 0}</strong>
          </div>
          <div className="automation-item">
            <label>Resident Availability Time</label>
            <strong>{formatAutomationAvailability(automation?.availability)}</strong>
          </div>
          <div className="automation-item">
            <label>Preferred Visit Slot</label>
            <strong>{automation?.residentPreferredSlot || "Not provided"}</strong>
          </div>
          <div className="automation-item">
            <label>Next Call Scheduled</label>
            <strong>{automation?.nextCallAt ? new Date(automation.nextCallAt).toLocaleString() : "N/A"}</strong>
          </div>
        </div>
        {isComplaintOnHold && (
          <div className="warning-box" style={{ marginTop: 12 }}>
            Resident is currently unavailable. This complaint is on hold until a new visit slot is shared.
          </div>
        )}
        {(automation?.assignmentSuggestion || automation?.prioritySuggestion) && (
          <div className="automation-grid">
            <div className="automation-item">
              <label>Suggested Assignee</label>
              <strong>{automation?.assignmentSuggestion || "Not provided"}</strong>
            </div>
            <div className="automation-item">
              <label>Suggested Priority</label>
              <strong>{automation?.prioritySuggestion || "Not provided"}</strong>
            </div>
          </div>
        )}
        {automation?.conversationSummary && (
          <div className="automation-summary-text">
            <strong>AI Summary:</strong> {automation.conversationSummary}
          </div>
        )}
        {automation?.callSummary && (
          <div className="automation-summary-text">
            <strong>Summary:</strong> {automation.callSummary}
          </div>
        )}
        {automation?.voiceTranscript && (
          <div className="automation-summary-text">
            <strong>Transcript:</strong> {automation.voiceTranscript}
          </div>
        )}
        {automation?.voiceRecordingUrl && (
          <div className="automation-summary-text">
            <strong>Recording:</strong>{" "}
            <a href={automation.voiceRecordingUrl} target="_blank" rel="noopener noreferrer">
              Open recording
            </a>
          </div>
        )}
        {automation?.whatsappReply && (
          <div className="automation-summary-text">
            <strong>WhatsApp Reply:</strong> {automation.whatsappReply}
          </div>
        )}
        <div className="escalation-flags">
          {automation?.whatsappEscalated && <span className="flag escalated">WhatsApp Escalated</span>}
          {automation?.noResponseEscalated && <span className="flag escalated">No Response Escalated</span>}
          {automation?.adminAlertSent && <span className="flag escalated">Admin Alert: {formatAdminAlertReason(automation.adminAlertReason)}</span>}
        </div>
      </Section>

      {/* COMPLAINT DETAILS */}
      <Section title="Complaint Details">
        <div className="details-grid">
          <div className="detail-item">
            <label>Resident</label>
            <p>{resident?.name || "-"}</p>
          </div>
          <div className="detail-item">
            <label>Phone</label>
            <p>{resident?.phone || "-"}</p>
          </div>
          <div className="detail-item">
            <label>Category</label>
            <p>{complaint.category || "-"}</p>
          </div>
          <div className="detail-item">
            <label>Location</label>
            <p>{formatResidentLocation(complaint)}</p>
          </div>
        </div>
        <div className="full-width">
          <label>Description</label>
          <p className="description-text">{complaint.description || "-"}</p>
        </div>
      </Section>

      {/* SLA DETAILS */}
      <Section title="SLA Status">
        <div className="sla-info">
          <div className={`sla-indicator ${sla?.breached ? "breached" : "safe"}`}>
            <strong>{sla?.breached ? "BREACHED" : "ON TRACK"}</strong>
          </div>
          <div>
            {sla?.paused && (
              <p><strong>Paused Reason:</strong> {sla.pauseReason || "Resident unavailable"}</p>
            )}
            <p><strong>Deadline:</strong> {sla?.deadline ? new Date(sla.deadline).toLocaleString() : "N/A"}</p>
            {sla?.remainingHours && (
              <p><strong>Remaining:</strong> {sla.remainingHours} hours</p>
            )}
          </div>
        </div>
      </Section>

      {/* ATTACHMENTS */}
      <Section title="Attachments">
        {!attachments || attachments.length === 0 ? (
          <p className="muted">No attachments</p>
        ) : (
          <div className="attachment-grid">
            {attachments.map((a, i) => {
              const url = resolveAttachmentUrl(a);
              if (!url) return null;
              const isImage = isImageAttachment(a, url);
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-link"
                >
                  {isImage ? (
                    <img
                      src={url}
                      alt={a?.name || "Attachment"}
                      className="attachment-thumb"
                    />
                  ) : null}
                  <span>{a?.name || url.split("/").pop() || "Attachment"}</span>
                </a>
              );
            })}
          </div>
        )}
      </Section>

      {/* FEEDBACK */}
      <Section title="Feedback">
        {complaint.status === "AWAITING_FEEDBACK" && (
          <div className="warning-box">
            Waiting for resident feedback before closing complaint
          </div>
        )}

        {feedback?.submitted ? (
          <div className="feedback-display">
            <p><strong>Rating:</strong> {feedback.rating}/5</p>
            <p><strong>Comment:</strong> {feedback.comment}</p>
            <p className="muted">Submitted on {new Date(feedback.submittedAt).toLocaleString()}</p>
          </div>
        ) : (
          <p className="muted">No feedback submitted yet</p>
        )}
      </Section>

      {/* ADMIN ACTIONS */}
      <Section title="Admin Actions">
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => setShowAssignModal(true)}
          >
            Assign Staff
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setShowStatusModal(true)}
          >
            Change Status
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setShowRescheduleModal(true)}
          >
            Reschedule Visit
          </button>
          <button
            className="action-btn danger"
            onClick={() => setShowEscalateModal(true)}
          >
            Escalate
          </button>
        </div>
      </Section>

      {/* TIMELINE */}
      <Section title="Activity Timeline">
        {!sortedTimeline.length ? (
          <p className="muted">No activity recorded</p>
        ) : (
          <ul className="timeline">
            {sortedTimeline.map((t, i) => (
              <li key={i} className="timeline-item">
                <span className="timeline-dot"></span>
                <div className="timeline-content">
                  <p>
                    <strong>{t.actor || "System"}</strong> — {t.event || t.message}
                  </p>
                  <span className="timeline-time">
                    {new Date(t.timestamp || t.time).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ========== MODALS ========== */}
      {showAssignModal && (
        <Modal title="Assign Staff" onClose={() => setShowAssignModal(false)}>
          <form onSubmit={handleAssignTechnician}>
            <label>
              Staff Member
              <select
                value={assignForm.technicianId}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, technicianId: e.target.value })
                }
                required
              >
                <option value="">Select a staff member</option>
                {technicians.map((tech) => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name}{tech.guardId ? ` (${tech.guardId})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes
              <textarea
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, notes: e.target.value })
                }
                placeholder="Add notes for the technician..."
              />
            </label>
            <div className="modal-actions">
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? "Assigning..." : "Assign Staff"}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showStatusModal && (
        <Modal title="Change Complaint Status" onClose={() => setShowStatusModal(false)}>
          <form onSubmit={handleChangeStatus}>
            <label>
              New Status
              <select
                value={statusForm.newStatus}
                onChange={(e) =>
                  setStatusForm({ newStatus: e.target.value })
                }
                required
              >
                <option value="">Select status</option>
                <option value="OPEN">OPEN</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="AWAITING_FEEDBACK">AWAITING_FEEDBACK</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
            <div className="modal-actions">
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? "Updating..." : "Update Status"}
              </button>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showRescheduleModal && (
        <Modal title="Reschedule Visit" onClose={() => setShowRescheduleModal(false)}>
          <form onSubmit={handleReschedule}>
            <label>
              Preferred Visit Slot
              <input
                type="text"
                value={rescheduleForm.preferredSlot}
                onChange={(e) =>
                  setRescheduleForm({ ...rescheduleForm, preferredSlot: e.target.value })
                }
                placeholder="Tomorrow at 11 AM"
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={rescheduleForm.notes}
                onChange={(e) =>
                  setRescheduleForm({ ...rescheduleForm, notes: e.target.value })
                }
                placeholder="Optional scheduling notes..."
              />
            </label>
            <div className="modal-actions">
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Save Reschedule"}
              </button>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEscalateModal && (
        <Modal title="Escalate Complaint" onClose={() => setShowEscalateModal(false)}>
          <form onSubmit={handleEscalate}>
            <label>
              Priority
              <select
                value={escalateForm.priority}
                onChange={(e) =>
                  setEscalateForm({ ...escalateForm, priority: e.target.value })
                }
              >
                <option value="HIGH">HIGH</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </label>
            <label>
              Reason for Escalation
              <textarea
                value={escalateForm.reason}
                onChange={(e) =>
                  setEscalateForm({ ...escalateForm, reason: e.target.value })
                }
                placeholder="Explain why this complaint is being escalated..."
                required
              />
            </label>
            <div className="modal-actions">
              <button type="submit" disabled={actionLoading}>
                {actionLoading ? "Escalating..." : "Escalate & Send WhatsApp"}
              </button>
              <button
                type="button"
                onClick={() => setShowEscalateModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ========== HELPER COMPONENTS ==========
function Kpi({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-content">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{value}</strong>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
