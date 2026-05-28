import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { useAuth } from "../auth/AuthContext";
import API_BASE from "../config/api";

const Login = () => {
  const navigate = useNavigate();
  const {setAuth}=useAuth();
  const [role, setRole] = useState("resident");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();

  const loginData = {
    role,
    societyCode: e.target.society.value,
    email: e.target.email.value,
    password: e.target.password.value,
  };

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await res.json();
     if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // ✅ store auth data
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("isAuth", "true");
    
    setAuth({
      isAuth:true,
      role:data.role,
      token:data.token,
    });
   

    // ✅ backend decides where to go
    navigate(data.redirect);
  } catch (err) {
    alert("Backend server not reachable");
  }
};


  return (
    <div className="login-page">
      <div className="login-card glass">
        <h2>Welcome Back</h2>
        <p className="login-subtitle">
          Login to your <strong>CIVARA</strong> account
        </p>

        {/* ROLE TABS */}
        <div className="login-tabs">
          <button
            type="button"
            className={role === "resident" ? "active" : ""}
            onClick={() => setRole("resident")}
          >
            Resident
          </button>

          <button
            type="button"
            className={role === "admin" ? "active" : ""}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>

          <button
            type="button"
            className={role === "security" ? "active" : ""}
            onClick={() => setRole("security")}
          >
            Security
          </button>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              {role === "admin"
                ? "Society Code"
                : role === "security"
                ? "Security Code"
                : "Apartment Code"}
            </label>
            <input
              type="text"
              name="society"
              placeholder="e.g. APT-102"
              required
            />
          </div>

          <div className="form-group">
            <label>Email / Username</label>
            <input
              type="text"
              name="email"
              placeholder="Enter email or username"
              required
            />
          </div>

          <div className="form-group password-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter password"
              required
            />

            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                /* Eye Off */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8a11.77 11.77 0 0 1 5.06-6.88" />
                  <path d="M1 1l22 22" />
                  <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.77 11.77 0 0 1-2.06 3.5" />
                </svg>
              ) : (
                /* Eye */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </span>
          </div>

          <button type="submit" className="login-btn">
            Login as {role}
          </button>

          <p className="login-note">
            Credentials are provided by your society admin.
          </p>
        </form>

        <a href="/" className="back-home">
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default Login;
