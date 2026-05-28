import React, { useState } from "react";
import emergencyData from "./data/emergencyData";
import "../styles/admin.css";

const EmergencyBanner = () => {
  const [resolved, setResolved] = useState(false);
  const [notified, setNotified] = useState(emergencyData.notified);

  // ✅ If no active emergency → show nothing
  if (!emergencyData.active || resolved) return null;

  const minutesAgo = Math.floor(
    (new Date() - new Date(emergencyData.reportedAt)) / 60000
  );

  return (
    <div className="emergency-banner">
      <div>
        <h3>🚨 ACTIVE EMERGENCY</h3>
        <p>
          <strong>{emergencyData.type}</strong> – {emergencyData.location}
        </p>
        <span className="emergency-time">
          Reported {minutesAgo} minutes ago
        </span>
      </div>

      <div className="emergency-actions">
        <button
          className="btn notify"
          onClick={() => setNotified(true)}
          disabled={notified}
        >
          {notified ? "Residents Notified" : "Notify Residents"}
        </button>

        <button
          className="btn resolve"
          onClick={() => setResolved(true)}
        >
          Mark Resolved
        </button>
      </div>
    </div>
  );
};

export default EmergencyBanner;
