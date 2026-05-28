import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/admin.css";
import "./residentPortal.css";
//import { ComplaintsProvider } from "./complaints/ComplaintsContext";
import { useAuth } from "../auth/AuthContext";

const ResidentLayout = () => {
  const navigate = useNavigate();
  const { logout } =useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("residentTheme") || "light");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem("residentTheme") || "light");
    };
    window.addEventListener("resident-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("resident-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);



  return (
    <div className={`admin-layout resident-layout ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">CIVARA</h2>

        <nav className="admin-nav">
          <NavLink
            to="/resident/dashboard"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/resident/announcements"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Announcements
          </NavLink>

          <NavLink
            to="/resident/complaints"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Complaints
          </NavLink>

          <NavLink
            to="/resident/visitors"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Visitors
          </NavLink>

          <NavLink
            to="/resident/profile"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            My Profile
          </NavLink>
        </nav>

        <div className="admin-footer">
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="admin-content">
         <Outlet />
      </main>
    </div>
  );
};

export default ResidentLayout;
