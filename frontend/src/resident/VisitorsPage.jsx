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

            return (
              <div
                key={visitor._id}
                className="visitor-row"
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  marginBottom: 12,
                  padding: 12
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>{visitor.visitorName}</h4>
                    {visitor.source === "SECURITY_REQUEST" && (
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
                        Security request . {formatStatus(visitor.visitType)}
                      </p>
                    )}
                  </div>

                  <span
                    style={{
                      background: statusColors[visitor.status] || "#aaa",
                      color: "#fff",
                      borderRadius: 12,
                      padding: "2px 12px",
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    {formatStatus(visitor.status)}
                  </span>
                </div>

                <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>
                  <strong>Date:</strong> {new Date(visitor.visitDate).toLocaleDateString()}{" "}
                  {visitor.fromTime && visitor.toTime && (
                    <span>
                      <strong>Time:</strong> {visitor.fromTime} - {visitor.toTime}
                    </span>
                  )}
                </p>

                {visitor.purpose && (
                  <p style={{ margin: "2px 0", fontSize: 13, color: "#666" }}>
                    <strong>Purpose:</strong> {visitor.purpose}
                  </p>
                )}

                <p style={{ margin: "2px 0", fontSize: 13 }}>
                  <strong>Phone:</strong>{" "}
                  {visitor.phone || <span style={{ color: "#aaa" }}>Not set</span>}
                </p>

                {visitor.securityRequest?.notes && (
                  <p style={{ margin: "2px 0", fontSize: 13 }}>
                    <strong>Gate Note:</strong> {visitor.securityRequest.notes}
                  </p>
                )}

                {isPendingApproval ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                      marginTop: 10
                    }}
                  >
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
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      flexWrap: "wrap",
                      margin: "8px 0"
                    }}
                  >
                    <span style={{ fontSize: 13, minWidth: 120 }}>
                      <strong>Invite Code:</strong> {visitor.inviteCode}
                    </span>
                    {isResidentInvite && (
                      <>
                        <button
                          style={{
                            fontSize: 12,
                            padding: "4px 14px",
                            borderRadius: 6,
                            border: "none",
                            background: "#eee",
                            cursor: "pointer",
                            marginRight: 4
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(visitor.inviteCode);
                          }}
                        >
                          Copy
                        </button>
                        {["EXPECTED", "APPROVED"].includes(visitor.status) && (
                          <button
                            style={{
                              fontSize: 12,
                              padding: "4px 14px",
                              borderRadius: 6,
                              border: "none",
                              background: "#f44336",
                              color: "#fff",
                              cursor: "pointer",
                              marginRight: 4
                            }}
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
                        <span style={{ marginLeft: 8, display: "flex", alignItems: "center" }}>
                          <QRCodeSVG
                            value={`${visitor._id}|${visitor.inviteCode}`}
                            size={48}
                            level="M"
                            includeMargin={false}
                          />
                        </span>
                      </>
                    )}
                  </div>
                )}

                {visitor.checkInTime && (
                  <p style={{ margin: "2px 0", fontSize: 13 }}>
                    <span style={{ color: "#0288d1" }}>
                      Entered at {new Date(visitor.checkInTime).toLocaleTimeString()}
                    </span>
                  </p>
                )}
                {visitor.checkOutTime && (
                  <p style={{ margin: "2px 0", fontSize: 13 }}>
                    <span style={{ color: "#616161" }}>
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
