import React, { useState } from "react";
import "../../styles/admin.css";

import SecurityStaff from "./SecurityStaff";
import SecurityShifts from "./SecurityShifts";
import SecurityAttendance from "./SecurityAttendance";

const Security = () => {
  const [activeTab, setActiveTab] = useState("staff");

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Security</h1>

        {/* TABS */}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <button
            className={activeTab === "staff" ? "primary-btn" : "secondary-btn"}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </button>

          <button
            className={activeTab === "shifts" ? "primary-btn" : "secondary-btn"}
            onClick={() => setActiveTab("shifts")}
          >
            Shifts
          </button>

          <button
            className={activeTab === "attendance" ? "primary-btn" : "secondary-btn"}
            onClick={() => setActiveTab("attendance")}
          >
            Attendance
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === "staff" && <SecurityStaff />}
      {activeTab === "shifts" && <SecurityShifts />}
      {activeTab === "attendance" && <SecurityAttendance />}
    </div>
  );
};

export default Security;
