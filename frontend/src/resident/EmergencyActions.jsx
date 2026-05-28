import React from "react";

const EmergencyActions = ({ onTrigger }) => {
  const actions = [
    { type: "SOS", label: "SOS", className: "danger" },
    { type: "MEDICAL", label: "Medical", className: "warning" },
    { type: "SUSPICIOUS", label: "Suspicious", className: "info" },
    { type: "FIRE", label: "Fire", className: "danger" },
  ];
  
   

  return (
    <div className="card emergency-card">
      <h3>Emergency Actions</h3>

      <div className="emergency-grid">
        {actions.map((a) => (
          <button
            key={a.type}
            className={`emergency-btn ${a.className}`}
            onClick={() => onTrigger(a.type)}
          >
            <span className="icon">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      <p className="muted-text small">
        Use only in case of real emergencies. Security will be notified immediately.
      </p>
        

    </div>
  );
};

export default EmergencyActions;
