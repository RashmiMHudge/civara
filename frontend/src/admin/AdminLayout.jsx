import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/admin.css";
import "../styles/adminPortalTheme.css";
import { useAuth } from "../auth/AuthContext";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("adminTheme") || "light");
   
  const {logout} = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem("adminTheme") || "light");
    };
    window.addEventListener("admin-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("admin-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return (
    <div className={`admin-layout admin-portal ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">CIVARA</h2>

        <nav className="admin-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/announcements"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Announcements
          </NavLink>

          <NavLink
            to="/admin/residents"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Residents
          </NavLink>

          <NavLink
            to="/admin/security"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Security
          </NavLink>

          <NavLink
            to="/admin/complaints"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Complaints
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
          >
            Settings
          </NavLink>
        </nav>

        <div className="admin-footer">
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet context={{ theme, setTheme }} />
      </main>
    </div>
  );
};

export default AdminLayout;
