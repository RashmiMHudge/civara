import React from "react";
import { getActiveGuardContext } from "./guardContext";

const VerifyVisitorModal = ({ visitor, onClose, onDecision }) => {
  const guardContext = getActiveGuardContext();

  const handleAllow=()=>{
    onDecision("CHECKED_IN",{
      entry:{
        time: new Date().toISOString(),
        guardId:guardContext.id,
        gate:guardContext.gate,
      },
    });
  };

  const handleDeny=()=>{
    onDecision("DENIED",{
      deniedAt:new Date().toISOString(),
      deniedBy:guardContext.id,
    });
  };
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Verify Visitor</h3>

        <p><strong>Name:</strong> {visitor.visitorName}</p>
        <p><strong>Flat:</strong> {visitor.resident?.flat} . {visitor.resident?.name}</p>
        <p><strong>Purpose:</strong> {visitor.purpose}</p>
        <p><strong>Invite Code:</strong> {visitor.inviteCode}</p>

        <div className="modal-actions">
          <button
            className="success-btn"
            onClick={handleAllow}
          >
            Allow Entry
          </button>

          <button
            className="danger-btn"
            onClick={handleDeny}
          >
            Deny
          </button>

          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyVisitorModal;
