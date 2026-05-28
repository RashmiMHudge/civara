import React, { useState } from "react";
import "../../styles/admin.css";

import { getAttendanceStatus } from "../../utils/attendanceUtils";
import API_BASE from "../../config/api";
import { useEffect } from "react";
const SecurityAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [gateFilter, setGateFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/attendance/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch attendance");
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to fetch attendance");
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  /* ========================
     FILTER LOGIC (UI ONLY)
  ======================== */
  const filtered = records.filter((r) => {
    const matchesSearch =
      String(r.guardName || "").toLowerCase().includes(search.toLowerCase()) ||
      String(r.guardId || "").toLowerCase().includes(search.toLowerCase());

    const matchesShift =
      shiftFilter === "All" || r.shift === shiftFilter;

    const matchesGate =
      gateFilter === "All" || r.gate === gateFilter;

    const matchesDate =
      !dateFilter || r.date === dateFilter;

    return matchesSearch && matchesShift && matchesGate && matchesDate;
  });

  /* ========================
     STATS (GLOBAL – CORRECT)
  ======================== 
  const present = records.filter((r) => r.status === "Present").length;
  const late = records.filter((r) => r.status === "Late").length;
  const absent = records.filter((r) => r.status === "Absent").length;*/
  
 /* ========================
     DERIVED STATS (NO HARDCODE)
  ======================== */
  const stats = records.reduce(
    (acc, r) => {
      const status = getAttendanceStatus({
        shift: { startTime: r.startTime },
        punchedInAt: r.punchedIn,
        punchedOutAt: r.punchedOut,
      });

      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header between">
        <div>
          <h1 className="page-title">Security Attendance</h1>
          <p className="page-subtitle">
            Automatically recorded from guard check-ins
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="attendance-filters">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        <input
          placeholder="Search guard or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
        >
          <option value="All">All Shifts</option>
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Night</option>
        </select>

        <select
          value={gateFilter}
          onChange={(e) => setGateFilter(e.target.value)}
        >
          <option value="All">All Gates</option>
          <option>Main Gate</option>
          <option>Block A</option>
          <option>Block B</option>
          <option>Block C</option>
        </select>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card success">
          <h4>Present</h4>
          <p>{stats.PRESENT || 0}</p>
        </div>
        <div className="stat-card warning">
          <h4>Late</h4>
          <p>{stats.LATE || 0}</p>
        </div>
        <div className="stat-card danger">
          <h4>Absent</h4>
          <p>{stats.ABSENT ||0}</p>
        </div>
      </div>

      {loading && <p className="muted-text">Loading attendance...</p>}
      {!loading && error && <p className="error-text">{error}</p>}

      {/* TABLE */}
      <div className="card table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Guard</th>
              <th>Gate</th>
              <th>Shift</th>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const status = getAttendanceStatus({
                shift: { startTime: r.startTime },
                punchedInAt: r.punchedIn,
                punchedOutAt: r.punchedOut,
              });
              
              return (
              <tr key={r._id}>
                <td>
                  <strong>{r.guardName}</strong>
                  <div className="muted-text">{r.guardId}</div>
                </td>
                <td>{r.gate}</td>
                <td>{r.shift}</td>
                <td>{r.date}</td>
                <td>{r.punchedIn ? new Date(r.punchedIn).toLocaleTimeString() : "-"}</td>
                <td>{r.punchedOut ? new Date(r.punchedOut).toLocaleTimeString() : "-"}</td>
                <td>
                  <span className={`status-pill ${status.toLowerCase()}`}>
                    {status}
                  </span>
                </td>
              </tr>
            );
           })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="empty">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="page-hint">
        Attendance is view-only for admin and recorded automatically.
      </p>
    </div>
  );
};

export default SecurityAttendance;
