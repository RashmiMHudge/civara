import React from "react";
import { useNavigate } from "react-router-dom";
import { getSLAStatus } from "./slaUtils";

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
  if (!assignment?.assigned) return "-";
  if (assignment.name) {
    return `${assignment.name}${assignment.role ? ` (${formatLabel(assignment.role)})` : ""}`;
  }
  return formatLabel(assignment.role, "Staff");
};

const ComplaintCard = ({ complaint }) => {
  const navigate = useNavigate();

  const statusClass =
    complaint.status === "OPEN"
      ? "status-open"
      : complaint.status === "ON_HOLD"
      ? "status-progress"
      : complaint.status === "RESOLVED"
      ? "status-resolved"
      : "status-progress";

  const sla = getSLAStatus(
    complaint.sla?.startedAt,
    complaint.sla?.hours,
    complaint.status,
    complaint.resolvedAt,
    complaint.sla?.paused
  );

  return (
    <div className="complaint-card">
      <div className="complaint-card-header">
        <div className="complaint-details">
          <h3 className="complaint-title">#{complaint.complaintCode}</h3>
          <p className="complaint-desc">
            {complaint.description?.slice(0, 35) || "No description"}...
          </p>

          <p className="muted-text small">
            <strong>Category:</strong> {complaint.category || "General"} ·{" "}
            <strong>Assigned:</strong> {formatAssignment(complaint.assignment)}
          </p>

          <p className="muted-text small">
            <strong>Raised:</strong>{" "}
            {complaint.createdAt
              ? new Date(complaint.createdAt).toLocaleDateString()
              : "Unknown"}
          </p>

          {complaint.automation && (
            <p className="muted-text small">
              <strong>Verification:</strong>{" "}
              {formatLabel(complaint.automation?.callStatus, "Unknown")}
            </p>
          )}
        </div>
        <div className="status-sla-wrapper">
          <span className={`status-pill ${statusClass}`}>
            {formatLabel(complaint.status)}
          </span>

          {sla.show && (
            <span className={`sla-pill ${sla.className}`}>
              {sla.label}
            </span>
          )}
        </div>
      </div>

      <div className="complaint-card-footer">
        <button
          className="view-btn"
          onClick={() => navigate(`/resident/complaints/${complaint._id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ComplaintCard;
