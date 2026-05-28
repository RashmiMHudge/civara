import React from "react";

const EmergencyBanner = ({ announcement }) => {
  if (announcement.priority !== "EMERGENCY") return null;

  return (
    <div className="emergency-banner">
      <div>
        <h3>Emergency Alert</h3>
        <p>{announcement.title}</p>
      </div>
    </div>
  );
};

export default EmergencyBanner;
