import React, { useState } from "react";
//import societyConfig from "../securityPortal/components/societyConfig";


const EmergencyModal = ({ type, societyContacts, onClose, onSubmit, isSubmitting = false }) => {
    
  const [description, setDescription] = useState("");

  if(!societyContacts) return null; //safety check in case config is missing

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }
    onSubmit(description);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>🚨 {type} Emergency</h2>
        <br />

        <textarea
          placeholder="Describe the emergency situation..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="emergency-contacts">
          <h4>Emergency Numbers</h4>
           <p>Society Security: {societyContacts?.security || "Not Available"}</p>
              {(type === "SOS" || type === "SUSPICIOUS") && (
                <p>Police: {societyContacts?.police || "Not Available"}</p>
              )}
              {(type === "MEDICAL") && (
                <p>Ambulance: {societyContacts?.ambulance || "Not Available"}</p>
              )}
              {(type === "FIRE") && (
                <p>Fire: {societyContacts?.fire || "Not Available"}</p>
              )}
        </div>

        <div className="modal-actions">
          <button className="danger" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit & Alert Security"}
          </button>
          <button onClick={onClose} disabled={isSubmitting}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
