import React from "react";
import emergencyData from "./data/emergencyData";
import "../styles/admin.css";

const EmergencyHistory = () => {
  return (
    <div className="dashboard-section">
      <h2>Emergency History</h2>

      {emergencyData.history.length === 0 ? (
        <p className="no-data">No past emergencies</p>
      ) : (
        <ul className="emergency-history">
          {emergencyData.history.map((e) => (
            <li key={e.id}>
              <strong>{e.type}</strong> – {e.location}
              <span>Resolved on {e.resolvedAt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmergencyHistory;
