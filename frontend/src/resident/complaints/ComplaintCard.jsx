import React from "react";
import { useNavigate } from "react-router-dom";
import { getSLAStatus } from "./slaUtils";

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
      {/* HEADER */}
      <div className="complaint-card-header">
        <div className="complaint-details">
          <h3 className="complaint-title">
            #{complaint.complaintCode}
          </h3>
          <p className="complaint-desc">
            {complaint.description?.slice(0, 35) || "No description"}...
          </p>

          <p className="muted-text small">
            <strong>Category:</strong> {complaint.category || "General"} ·{" "}
            <strong>Assigned:</strong>{" "}
            {complaint.assignment?.assigned
              ? complaint.assignment.role || "Staff"
              : "—"}
          </p>
          
          <p className="muted-text small">
            <strong>Raised:</strong>{" "}
            {complaint.createdAt
              ? new Date(complaint.createdAt).toLocaleDateString()
              : "Unknown"}
          </p>
         
          {complaint.automation && (
            <p className="muted-text small">
              <strong>Verification:</strong> {complaint.automation?.callStatus || "Unknown"}
            </p>
          )}
        </div>
        <div className="status-sla-wrapper">
          <span className={`status-pill ${statusClass}`}>
            {complaint.status}
          </span>

          {sla.show && (
            <span className={`sla-pill ${sla.className}`}>
              {sla.label}
            </span>
          )}
        </div>
      </div>


      {/* FOOTER */}
      <div className="complaint-card-footer">
        <button
          className="view-btn"
          onClick={() =>
            navigate(`/resident/complaints/${complaint._id}`)
          }
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ComplaintCard;
