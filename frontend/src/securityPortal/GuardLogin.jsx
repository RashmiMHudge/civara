import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGuardAuth } from "../auth/GuardAuthContext";
import { securityStaffData } from "../../admin/data/securityStaffData";

const GuardLogin = () => {
  const navigate = useNavigate();
  const { loginGuard } = useGuardAuth();

  const [guardId, setGuardId] = useState("SEC-1001");
  const [gate, setGate] = useState("Main Gate");

  const handleLogin = () => {
    const guard = securityStaffData.find((g) => g.id === guardId);

    if (!guard) {
      alert("Invalid Guard");
      return;
    }

    loginGuard({
      id: guard.id,
      name: guard.name,
      gate,
    });

    navigate("/security/dashboard");
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Security Login</h1>
      <p className="muted-text">Login starts your duty session</p>

      <div className="card" style={{ maxWidth: "400px" }}>
        <label>Guard</label>
        <select
          value={guardId}
          onChange={(e) => setGuardId(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
        >
          {securityStaffData.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <label>Gate</label>
        <select
          value={gate}
          onChange={(e) => setGate(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "16px" }}
        >
          <option>Main Gate</option>
          <option>Block A</option>
          <option>Block B</option>
          <option>Parking</option>
        </select>

        <button className="primary-btn" onClick={handleLogin}>
          Login & Start Duty
        </button>
      </div>
    </div>
  );
};

export default GuardLogin;
