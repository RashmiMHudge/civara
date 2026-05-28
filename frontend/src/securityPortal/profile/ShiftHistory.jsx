import React, { useEffect, useState } from "react";
import API_BASE from "../../config/api";
import "./profilr.css";

const ShiftHistory = ({ guardId, refreshKey = 0 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!guardId) {
        setHistory([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/attendance/guard/${encodeURIComponent(guardId)}?days=7`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch attendance history");
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to fetch attendance history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [guardId, refreshKey]);

  const formatTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="profile-card shift-history-card">
      <h3>Shift History (Last 7 Days)</h3>

      {loading ? (
        <p className="muted-text">Loading attendance records...</p>
      ) : error ? (
        <p className="muted-text" style={{ color: "#dc2626" }}>{error}</p>
      ) : history.length === 0 ? (
        <p className="muted-text">No attendance records</p>
      ) : (
        <div className="history-table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Gate</th>
                <th>Shift</th>
                <th>Timing</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {history.map((row, i) => (
                <tr key={i}>
                  <td>{row.date}</td>
                  <td>{row.gate}</td>
                  <td>{row.shift || row.shiftType || "-"}</td>
                  <td>
                    {row.startTime} – {row.endTime}
                  </td>
                  <td>{formatTime(row.punchedIn)}</td>
                  <td>{formatTime(row.punchedOut)}</td>
                  <td>
                    <span
                      className={`status-pill ${(row.status || "present").toLowerCase()}`}
                    >
                      {row.status || "Present"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShiftHistory;
