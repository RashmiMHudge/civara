import React from "react";
import VisitorRow from "./VisitorRow";

const VisitorsList = ({ visitors, onUpdate,onScan
  
 }) => {
  return (
    <div className="visitor-list">
      {visitors.map((visitor) => (
        <VisitorRow
          key={visitor._id}
          visitor={visitor}
          onUpdate={onUpdate}
          onScan={onScan}
        />
      ))}
    </div>
  );
};

export default VisitorsList;
