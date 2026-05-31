import React, { useEffect, useState } from "react";
import VisitorsList from "./VisitorsList";
import API_BASE from "../../config/api";
import "./visitors.css";
import QRScannerModal from "./QRScannerModal";
import VerifyVisitorModal from "./VerifyVisitorModal";

const defaultWalkInForm = {
  visitorName: "",
  phone: "",
  purpose: "",
  visitType: "DELIVERY",
  residentBlock: "",
  residentFlat: "",
  notes: ""
};

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);
  const [verifyVisitor, setVerifyVisitor] = useState(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState(defaultWalkInForm);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/visitors`, {
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
    } finally {
      setLoading(false);
    }
  };

  const updateVisitorStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/visitors/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update visitor");
        return;
      }

      fetchVisitors();
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const getInviteWindow = (visitor) => {
    if (
      visitor.source !== "RESIDENT_INVITE" ||
      !visitor.visitDate ||
      !visitor.fromTime ||
      !visitor.toTime
    ) {
      return null;
    }

    const visitDate = new Date(visitor.visitDate);
    const [fromHour, fromMinute] = String(visitor.fromTime).split(":").map(Number);
    const [toHour, toMinute] = String(visitor.toTime).split(":").map(Number);

    if (
      Number.isNaN(visitDate.getTime()) ||
      [fromHour, fromMinute, toHour, toMinute].some((value) => Number.isNaN(value))
    ) {
      return null;
    }

    const start = new Date(visitDate);
    start.setHours(fromHour, fromMinute, 0, 0);

    const end = new Date(visitDate);
    end.setHours(toHour, toMinute, 0, 0);

    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  };

  const getVisitDayStart = (visitor) => {
    if (!visitor?.visitDate) {
      return null;
    }

    const visitDate = new Date(visitor.visitDate);
    if (Number.isNaN(visitDate.getTime())) {
      return null;
    }

    visitDate.setHours(0, 0, 0, 0);
    return visitDate;
  };

  const handleQRScan = (text) => {
    setScanOpen(false);

    const cleanText = text.trim();
    const [visitorId, inviteCode] = cleanText.split("|").map((v) => v.trim());

    const visitor = visitors.find(
      (v) =>
        v._id === visitorId &&
        v.inviteCode === inviteCode &&
        ["EXPECTED", "APPROVED"].includes(v.status)
    );

    if (!visitor) {
      alert("Invalid or expired QR code");
      return;
    }

    const inviteWindow = getInviteWindow(visitor);
    const now = new Date();

    if (inviteWindow) {
      const visitDayStart = getVisitDayStart(visitor);

      if (visitDayStart && now < visitDayStart) {
        alert("Visitor QR can be scanned only on the scheduled visit date");
        return;
      }
    }

    if (inviteWindow && now > inviteWindow.end) {
      alert(`Visitor QR expired after ${visitor.toTime}`);
      fetchVisitors();
      return;
    }

    setVerifyVisitor(visitor);
  };

  const handleWalkInChange = (event) => {
    const { name, value } = event.target;
    setWalkInForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWalkInSubmit = async (event) => {
    event.preventDefault();
    if (walkInSubmitting) return;

    setWalkInSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/visitors/walk-in-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(walkInForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create walk-in request");
      }

      setShowWalkInModal(false);
      setWalkInForm(defaultWalkInForm);
      fetchVisitors();
      alert("Resident approval request sent successfully");
    } catch (error) {
      alert(error.message || "Failed to create walk-in request");
    } finally {
      setWalkInSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Visitors</h1>

      <p className="muted-text">
        Verify pre-approved visitors or send a fresh approval request for walk-ins and deliveries.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        <button className="primary-btn" onClick={() => setShowWalkInModal(true)}>
          New Walk-in Request
        </button>
        <button className="secondary-btn" onClick={() => setScanOpen(true)}>
          Scan QR
        </button>
      </div>

      {loading && <p className="muted-text">Loading visitors...</p>}
      {!loading && visitors.length === 0 && (
        <p className="muted-text">No visitor requests at the moment.</p>
      )}

      <VisitorsList
        visitors={visitors}
        onUpdate={updateVisitorStatus}
        onScan={() => {
          setScanOpen(true);
        }}
      />

      {scanOpen && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setScanOpen(false)}
        />
      )}

      {verifyVisitor && (
        <VerifyVisitorModal
          visitor={verifyVisitor}
          onClose={() => setVerifyVisitor(null)}
          onDecision={(status) => {
            updateVisitorStatus(verifyVisitor._id, status);
            setVerifyVisitor(null);
          }}
        />
      )}

      {showWalkInModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>New Walk-in Approval Request</h3>
            <form onSubmit={handleWalkInSubmit}>
              <input
                name="visitorName"
                placeholder="Visitor name"
                value={walkInForm.visitorName}
                onChange={handleWalkInChange}
                required
              />
              <input
                name="phone"
                placeholder="Phone number"
                value={walkInForm.phone}
                onChange={handleWalkInChange}
              />
              <input
                name="purpose"
                placeholder="Purpose"
                value={walkInForm.purpose}
                onChange={handleWalkInChange}
                required
              />
              <select
                name="visitType"
                value={walkInForm.visitType}
                onChange={handleWalkInChange}
              >
                <option value="DELIVERY">Delivery</option>
                <option value="GUEST">Guest</option>
                <option value="SERVICE">Service</option>
                <option value="OTHER">Other</option>
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  name="residentBlock"
                  placeholder="Block"
                  value={walkInForm.residentBlock}
                  onChange={handleWalkInChange}
                />
                <input
                  name="residentFlat"
                  placeholder="Flat"
                  value={walkInForm.residentFlat}
                  onChange={handleWalkInChange}
                  required
                />
              </div>
              <textarea
                name="notes"
                placeholder="Notes for resident (optional)"
                rows="3"
                value={walkInForm.notes}
                onChange={handleWalkInChange}
              />

              <div className="modal-actions">
                <button className="success-btn" type="submit" disabled={walkInSubmitting}>
                  {walkInSubmitting ? "Sending..." : "Send Approval Request"}
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setShowWalkInModal(false);
                    setWalkInForm(defaultWalkInForm);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;
