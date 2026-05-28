
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../config/api";

const SecurityLogin = () => {
  const navigate = useNavigate();
  const [guardId, setGuardId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/security-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardId, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("guardId", data.guard.guardId);
      localStorage.setItem("guardName", data.guard.name);
      // Optionally store more guard info as needed
      navigate("/security/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Security Login</h1>
      <form onSubmit={handleLogin} className="form-card">
        <input
          className="input"
          type="text"
          placeholder="Guard ID"
          value={guardId}
          onChange={e => setGuardId(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login as Security"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
};

export default SecurityLogin;
