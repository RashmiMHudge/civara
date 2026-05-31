import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import API_BASE from "../config/api";
import VisitorInviteModal from "./VisitorInviteModal";

const statusColors = {
  EXPECTED: "#1976d2",
  PENDING_APPROVAL: "#f59e0b",
  APPROVED: "#388e3c",
  DENIED: "#d32f2f",
  CHECKED_IN: "#0288d1",
  CHECKED_OUT: "#616161",
  EXPIRED: "#bdbdbd"
};

const formatStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const VisitorsPage = () => {
  const [visitors, setVisitors] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/visitors/my-visitors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message);
        return;
      }

      setVisitors(data);
    } catch (error) {
      console.error("Failed to fetch visitors", error);
    }
  };

  const filteredVisitors = useMemo(
    () =>
      visitors.filter((visitor) =>
        [
          visitor.visitorName,
          visitor.purpose,
          visitor.status,
          visitor.visitType,
          visitor.resident?.flat
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search.toLowerCase()))
      ),
    [search, visitors]
  );

  const formatVisitorDate = (visitDate) =>
    new Date(visitDate).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  const respondToVisitor = async (visitorId, decision) => {
    try {
      const res = await fetch(`${API_BASE}/api/visitors/${visitorId}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ decision })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update visitor");
      }

      fetchVisitors();
    } catch (error) {
      alert(error.message || "Failed to update visitor");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Visitors</h1>
        <input
          type="text"
          placeholder="Search visitors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <button className="primary-btn" onClick={() => setShowInvite(true)}>
          Invite Visitor
        </button>
      </div>

      {visitors.length === 0 ? (
        <p className="muted-text">No visitors found.</p>
      ) : (
        <div className="visitor-list">
          {filteredVisitors.map((visitor) => {
            const isPendingApproval = visitor.status === "PENDING_APPROVAL";
            const isResidentInvite = visitor.source !== "SECURITY_REQUEST";
            const residentUnit = `${visitor.resident?.block ? `${visitor.resident.block}-` : ""}${visitor.resident?.flat || ""}`;

            return (
              <div key={visitor._id} className={`visitor-row visitor-card ${isPendingApproval ? "visitor-card-pending" : ""}`}>
                <div className="visitor-card-header">
                  <div className="visitor-card-title">
                    <h4>{visitor.visitorName}</h4>
                    {visitor.source === "SECURITY_REQUEST" ? (
                      <div className="visitor-source-line">
                        <span className="visitor-source-badge">Security Request</span>
                        <span>{formatStatus(visitor.visitType)}</span>
                        <span>For Flat {residentUnit}</span>
                      </div>
                    ) : (
                      <div className="visitor-source-line">
                        <span className="visitor-source-badge visitor-source-badge-planned">Planned Visit</span>
                        <span>For Flat {residentUnit}</span>
                      </div>
                    )}
                  </div>

                  <span
                    className="visitor-status-badge"
                    style={{ background: statusColors[visitor.status] || "#aaa" }}
                  >
                    {formatStatus(visitor.status)}
                  </span>
                </div>

                <div className="visitor-meta-grid">
                  <p>
                    <strong>Date:</strong> {formatVisitorDate(visitor.visitDate)}{" "}
                  {visitor.fromTime && visitor.toTime && (
                    <span>
                      <strong>Time:</strong> {visitor.fromTime} - {visitor.toTime}
                    </span>
                  )}
                  </p>

                  {visitor.purpose && (
                    <p>
                      <strong>Purpose:</strong> {visitor.purpose}
                    </p>
                  )}

                  <p>
                    <strong>Phone:</strong>{" "}
                    {visitor.phone || <span className="visitor-muted">Not set</span>}
                  </p>

                  {visitor.securityRequest?.notes && (
                    <p className="visitor-gate-note">
                      <strong>Gate Note:</strong> {visitor.securityRequest.notes}
                    </p>
                  )}
                </div>

                {isPendingApproval ? (
                  <div className="visitor-pending-panel">
                    <div className="visitor-pending-copy">
                      <strong>Approval needed</strong>
                      <span>Security is waiting for your decision before allowing entry.</span>
                    </div>
                    <div className="visitor-action-row">
                    <button
                      className="primary-btn"
                      onClick={() => respondToVisitor(visitor._id, "APPROVED")}
                    >
                      Allow Entry
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => respondToVisitor(visitor._id, "DENIED")}
                    >
                      Deny Entry
                    </button>
                    </div>
                  </div>
                ) : (
                  <div className="visitor-footer-row">
                    <span className="visitor-invite-code">
                      <strong>Invite Code:</strong> {visitor.inviteCode}
                    </span>
                    {isResidentInvite && (
                      <>
                        <button
                          className="visitor-inline-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(visitor.inviteCode);
                          }}
                        >
                          Copy
                        </button>
                        {["EXPECTED", "APPROVED"].includes(visitor.status) && (
                          <button
                            className="visitor-inline-btn visitor-inline-btn-danger"
                            onClick={async () => {
                              if (!window.confirm("Cancel this invite?")) return;
                              try {
                                const res = await fetch(
                                  `${API_BASE}/api/visitors/${visitor._id}/cancel`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`
                                    }
                                  }
                                );
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message);
                                alert("Invite cancelled");
                                fetchVisitors();
                              } catch (err) {
                                alert(err.message || "Failed to cancel");
                              }
                            }}
                          >
                            Cancel
                          </button>
                        )}
                        <span className="visitor-qr-wrap">
                          <QRCodeSVG
                            value={`${visitor._id}|${visitor.inviteCode}`}
                            size={56}
                            level="M"
                            includeMargin={false}
                          />
                        </span>
                      </>
                    )}
                  </div>
                )}

                {visitor.checkInTime && (
                  <p className="visitor-timestamp visitor-timestamp-entry">
                    <span>
                      Entered at {new Date(visitor.checkInTime).toLocaleTimeString()}
                    </span>
                  </p>
                )}
                {visitor.checkOutTime && (
                  <p className="visitor-timestamp visitor-timestamp-exit">
                    <span>
                      Exited at {new Date(visitor.checkOutTime).toLocaleTimeString()}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showInvite && (
        <VisitorInviteModal onClose={() => setShowInvite(false)} onCreated={fetchVisitors} />
      )}
    </div>
  );
};

export default VisitorsPage;
