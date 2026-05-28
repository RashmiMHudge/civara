import React, { useState } from "react";
import VerifyVisitorModal from "./VerifyVisitorModal";
import { getStatusBadgeClass } from "./visitorsUtils";
//import { getActiveGuardContext } from "./guardContext";

const VisitorRow = ({ visitor, onUpdate,onScan }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="visitor-row">
        {/* LEFT */}
        <div className="visitor-info">
          <h4>{visitor.visitorName}</h4>
          <p>Flat {visitor.resident.flat} · {visitor.purpose}</p>
          <p>
            Valid till:
            {new Date(visitor.visitDate).toLocaleDateString()}
          </p>
          {visitor.checkInTime && (
              <p className="muted-text">
                Entered at {new Date(visitor.checkInTime).toLocaleTimeString()}</p>
            )}

            {visitor.checkOutTime && (
              <p className="muted-text">
                Exited at {new Date(visitor.checkOutTime).toLocaleTimeString()}
              </p>
            )}

        </div>

        {/* STATUS */}
        <span
          className={`status-pill ${getStatusBadgeClass(visitor.status)}`}
        >
          {visitor.status}
        </span>

        {/* ACTIONS */}
       
          {visitor.status === "EXPECTED" && (
            <div className="visitor-actions">
              <button
                className="primary-btn"
                onClick={() => setOpen(true)}
              >
                Verify
              </button>
              
              <button
               className="secondary-btn"
               onClick={()=> onScan(visitor)}
               >
                Scan QR
               </button>
            </div>
          )}
          {visitor.status === "CHECKED_IN" && (
            <div className="visitor-actions">
              <button
                className="secondary-btn"
                onClick={() => {
                  //const ctx = getActiveGuardContext();
                  onUpdate(visitor._id, "CHECKED_OUT");
                  // Log exit details
                  //onUpdate(visitor._id, "CHECKED_OUT");
                }}
              >
                Exit
              </button>
            </div>
          )}
      </div>
                    
     

      {open && (
        <VerifyVisitorModal
          visitor={visitor}
          onClose={() => setOpen(false)}
          onDecision={(status) => {
            onUpdate(visitor._id, status);   
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

export default VisitorRow;
