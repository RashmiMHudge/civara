import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useComplaints } from "./ComplaintsContext";
import { getSLAStatus } from "./slaUtils";
import toast from "react-hot-toast";
import API_BASE from "../../config/api";

const formatLabel = (value, fallback = "") => {
  const normalized = String(value || fallback).trim();
  if (!normalized) return "";

  return normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatAssignment = (assignment) => {
  if (!assignment?.assigned) return "Not Assigned";
  if (assignment.name) {
    return `${assignment.name}${assignment.role ? ` (${formatLabel(assignment.role)})` : ""}`;
  }
  return formatLabel(assignment.role, "Staff Assigned");
};

const DetailComplaints = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, submitFeedback, rescheduleComplaint } = useComplaints();
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [preferredSlot, setPreferredSlot] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

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

  if (!Array.isArray(complaints)) {
    return <p className="empty">Loading complaints...</p>;
  }

  const complaint = complaints.find((c) => c._id === id);
  if (!complaint) return <p className="empty">Complaint not found</p>;

  const assignment = complaint.assignment || {};
  const automation = complaint.automation || {};
  const timeline = Array.isArray(complaint.timeline) ? complaint.timeline : [];
  const attachments = Array.isArray(complaint.attachments) ? complaint.attachments : [];

  const sla = getSLAStatus(
    complaint.sla?.startedAt || complaint.createdAt,
    complaint.sla?.hours || complaint.slaHours || 48,
    complaint.status,
    complaint.resolvedAt,
    complaint.sla?.paused
  );

  const sortedTimeline = [...timeline].sort((a, b) => new Date(a.time) - new Date(b.time));

  const handleFeedbackSubmit = async () => {
    if (rating === null) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await submitFeedback(id, rating, comment);
      toast.success("Feedback submitted successfully!");
      navigate("/resident/complaints");
    } catch (error) {
      toast.error("Error submitting feedback");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!String(preferredSlot || "").trim()) {
      toast.error("Please enter your preferred visit time");
      return;
    }

    try {
      setRescheduleLoading(true);
      await rescheduleComplaint(id, preferredSlot, rescheduleNotes);
      toast.success("Visit time updated successfully");
      setPreferredSlot("");
      setRescheduleNotes("");
    } catch (error) {
      toast.error(error.message || "Failed to reschedule complaint");
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <div className="page-container">
      <button
        className="complaint-back-btn"
        onClick={() => navigate("/resident/complaints")}
      >
        Back to My Complaints
      </button>

      <div className="card complaint-header-card">
        <div className="complaint-header-top">
          <div>
            <h1>Complaint #{complaint.complaintCode}</h1>
            <p className="complaint-title">{complaint.description}</p>
          </div>

          <span className={`status-pill status-${complaint.status?.toLowerCase() || "open"}`}>
            {formatLabel(complaint.status)}
          </span>
        </div>

        <div className="complaint-header-meta">
          <p>
            <strong>Category:</strong> {complaint.category}
          </p>

          <p>
            <strong>Assigned to:</strong> {formatAssignment(assignment)}
          </p>

          <span className={`sla-pill ${sla.className}`}>{sla.label}</span>
        </div>
      </div>

      {automation.callAllowed && (
        <div className="card">
          <h3>Automated Verification Call</h3>
          <p>
            <strong>Status:</strong> {formatLabel(automation.callStatus, "Pending")}
          </p>
          <p>
            <strong>Attempts:</strong> {automation.callAttempts ?? 0} / 3
          </p>
          <p>
            <strong>Preferred Time:</strong> {formatLabel(automation.preferredCallTime, "Anytime")}
          </p>
          {complaint.status === "ON_HOLD" && (
            <p>
              <strong>Current Hold Reason:</strong>{" "}
              {formatLabel(automation.availability, "Resident unavailable")}
            </p>
          )}
        </div>
      )}

      {complaint.status === "ON_HOLD" && (
        <div className="card feedback-card">
          <h3 className="feedback-title">Share a New Visit Time</h3>
          <p className="feedback-subtitle">
            Your complaint is on hold while you are unavailable. Send a new preferred slot to resume it.
          </p>

          <div className="feedback-form">
            <div className="feedback-field">
              <label>Preferred Visit Slot</label>
              <input
                type="text"
                placeholder="Tomorrow at 11 AM"
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
              />
            </div>

            <div className="feedback-field">
              <label>Notes (optional)</label>
              <textarea
                rows="3"
                placeholder="Any extra scheduling notes..."
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
              />
            </div>

            <div className="feedback-actions">
              <button
                className="primary-btn"
                onClick={handleRescheduleSubmit}
                disabled={rescheduleLoading}
              >
                {rescheduleLoading ? "Saving..." : "Resume Complaint"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="complaint-split">
        <div className="card timeline-card">
          <h3>Status Timeline</h3>

          {timeline.length === 0 ? (
            <p className="muted-text">No timeline updates yet</p>
          ) : (
            <ul className="timeline">
              {sortedTimeline.map((t, i) => (
                <li key={i} className="timeline-item">
                  <div className="timeline-dot"></div>
                  {i !== sortedTimeline.length - 1 && <div className="timeline-line"></div>}
                  <div className="timeline-content">
                    <strong>{t.event || t.action}</strong> {t.actor && <>- {t.actor}</>}
                    <span className="timeline-time">
                      {t.time ? new Date(t.time).toLocaleString() : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card attachment-card">
          <h3>Attachments</h3>

          {attachments.length === 0 ? (
            <p className="muted-text">No attachments</p>
          ) : (
            attachments.map((a, i) => {
              const url = resolveAttachmentUrl(a);

              const isImage =
                a.type?.startsWith("image") || url.match(/\.(jpeg|jpg|gif|png|bmp|webp)$/i);

              return (
                <div key={i} className="attachment-item">
                  <a href={url} target="_blank" rel="noreferrer">
                    {isImage ? (
                      <img
                        src={url}
                        alt={a.name || "attachment"}
                        className="attachment-preview"
                      />
                    ) : (
                      <div className="file-icon">File</div>
                    )}
                    <div className="attachment-name">{a.name || "Attachment"}</div>
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>

      {complaint.feedback?.eligible && (
        <div className="card feedback-card">
          <h3 className="feedback-title">Rate Your Experience</h3>
          <p className="feedback-subtitle">
            Your feedback helps us improve maintenance services.
          </p>

          <div className="feedback-form">
            <div className="feedback-field">
              <label>Rating</label>
              <select
                value={rating ?? ""}
                onChange={(e) => setRating(Number(e.target.value))}
                disabled={complaint.feedback?.submitted}
              >
                <option value="" disabled>
                  Select rating
                </option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very Bad</option>
              </select>
            </div>

            <div className="feedback-field">
              <label>Comments (optional)</label>
              <textarea
                rows="4"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={complaint.feedback?.submitted}
              />
            </div>

            <div className="feedback-actions">
              <button
                className="primary-btn"
                onClick={handleFeedbackSubmit}
                disabled={complaint.feedback?.submitted}
              >
                {complaint.feedback?.submitted ? "Already Submitted" : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailComplaints;
