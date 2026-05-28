import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/admin.css"; // reuse same styles
import "./securityPortal.css";
import { useAuth } from "../auth/AuthContext";

const SecurityLayout = () => {
  const navigate = useNavigate();
  const {logout}=useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("securityTheme") || "light");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem("securityTheme") || "light");
    };
    window.addEventListener("security-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("security-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return (
    <div className={`admin-layout security-layout ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="security-toolbar">
          <h2 className="admin-logo">CIVARA</h2>
          <button
            className="security-menu-toggle"
            type="button"
            onClick={() => setNavOpen((prev) => !prev)}
          >
            Menu
          </button>
        </div>

        <nav className={`admin-nav ${navOpen ? "open" : ""}`}>
          <NavLink
            to="/security/dashboard"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
            onClick={() => setNavOpen(false)}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/security/visitors"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
            onClick={() => setNavOpen(false)}
          >
            Visitors
          </NavLink>

          <NavLink
            to="/security/emergencies"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
            onClick={() => setNavOpen(false)}
          >
            Emergencies
          </NavLink>

          <NavLink
            to="/security/profile"
            className={({ isActive }) =>
              isActive ? "admin-link active-link" : "admin-link"
            }
            onClick={() => setNavOpen(false)}
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

export default SecurityLayout;
