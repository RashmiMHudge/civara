
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../../config/api";

const GuardPunch = () => {
  const navigate = useNavigate();
  const [gate, setGate] = useState("Main Gate");
  const [loading, setLoading] = useState(false);

  const punchIn = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real guardId, shift, date, etc. from context or login
      const guardId = localStorage.getItem("guardId") || "SEC-1001";
      const shift = "Morning"; // Should be dynamic
      const date = new Date().toISOString().split("T")[0];
      const startTime = new Date().toLocaleTimeString();
      const endTime = null;
      const res = await fetch(`${API_BASE}/api/attendance/punch-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          guardId,
          gate,
          shift,
          date,
          startTime,
          endTime
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Punch-in failed");
      // Optionally set active guard context here
      navigate("/security/dashboard");
    } catch (err) {
      alert(err.message || "Punch-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Guard Punch In</h1>
      <p className="muted-text">Start your duty</p>

      <br />

      <select
        className="input"
        value={gate}
        onChange={(e) => setGate(e.target.value)}
      >
        <option>Main Gate</option>
        <option>Side Gate</option>
        <option>Service Gate</option>
      </select>

      <br /><br />

      <button className="primary-btn" onClick={punchIn} disabled={loading}>
        {loading ? "Punching In..." : "Punch In"}
      </button>
    </div>
  );
};

export default GuardPunch;
