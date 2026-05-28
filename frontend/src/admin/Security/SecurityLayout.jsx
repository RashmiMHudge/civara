import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/admin.css";

const SecurityLayout = () => {
  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Security</h1>

        {/* SUB NAV */}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
          <NavLink to="staff" className="secondary-btn">
            Staff
          </NavLink>
          <NavLink to="shifts" className="secondary-btn">
            Shifts
          </NavLink>
          <NavLink to="attendance" className="secondary-btn">
            Attendance
          </NavLink>
        </div>
      </div>

      {/* CHILD PAGE */}
      <Outlet />
    </div>
  );
};

export default SecurityLayout;
