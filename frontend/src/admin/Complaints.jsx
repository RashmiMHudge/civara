import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "../styles/Complaints.css";
import API_BASE from "../config/api";

const STATUS_COLORS = {
  OPEN: "#3b82f6",
  ACKNOWLEDGED: "#06b6d4",
  ON_HOLD: "#f97316",
  ASSIGNED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#10b981",
  AWAITING_FEEDBACK: "#ec4899",
  CLOSED: "#6b7280"
};

const SLA_COLORS = {
  safe: "#10b981",
  breached: "#ef4444"
};

const PRIORITY_COLORS = {
  NORMAL: "#3b82f6",
  HIGH: "#f59e0b",
  EMERGENCY: "#ef4444"
};

const formatCallStatus = (value) => {
  const normalized = String(value || "PENDING").trim();
  return normalized
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function Complaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ========== FETCH ALL COMPLAINTS ==========
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/complaints`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load complaints");
        setComplaints(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // ========== CALCULATIONS & FILTERING ==========
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        c.complaintCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.resident?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" ||
        String(c.priority || "NORMAL").toUpperCase() === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  const isResolvedState = (status) => ["RESOLVED", "CLOSED"].includes(status);

  const isBreached = (complaint) => {
    if (complaint?.sla?.breached === true) return true;
    const deadline = complaint?.sla?.deadline;
    if (!deadline || isResolvedState(complaint?.status)) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  const sortedFiltered = useMemo(() => {
    const rows = [...filtered];

    const valueByKey = (c) => {
      switch (sortBy) {
        case "complaintCode":
          return c.complaintCode || "";
        case "resident":
          return c.resident?.name || "";
        case "category":
          return c.category || "";
        case "status":
          return c.status || "";
        case "priority":
          return c.priority || "NORMAL";
        case "deadline":
          return c.sla?.deadline ? new Date(c.sla.deadline).getTime() : 0;
        case "createdAt":
        default:
          return c.createdAt ? new Date(c.createdAt).getTime() : 0;
      }
    };

    rows.sort((a, b) => {
      const av = valueByKey(a);
      const bv = valueByKey(b);

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));

  const paginatedComplaints = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedFiltered.slice(start, start + PAGE_SIZE);
  }, [sortedFiltered, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, priorityFilter, sortBy, sortDir]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(key);
    setSortDir("desc");
  };

  const analyticsSource = filtered;

  const trendChart = useMemo(() => {
    const now = new Date();
    const dayMap = new Map();

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, {
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        date: key,
        complaints: 0
      });
    }

    analyticsSource.forEach((c) => {
      if (!c?.createdAt) return;
      const key = new Date(c.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.get(key).complaints += 1;
      }
    });

    return Array.from(dayMap.values());
  }, [analyticsSource]);

  // ========== KPI CALCULATIONS ==========
  const kpis = useMemo(() => {
    const total = analyticsSource.length;
    const breached = analyticsSource.filter((c) => isBreached(c)).length;
    const resolved = analyticsSource.filter((c) => c.status === "RESOLVED").length;
    const closed = analyticsSource.filter((c) => c.status === "CLOSED").length;
    const feedbackSubmitted = analyticsSource.filter((c) => c.feedback?.submitted).length;

    return { total, breached, resolved, closed, feedbackSubmitted };
  }, [analyticsSource]);

  // ========== CHART 1: SLA HEALTH PIE ==========
  const slaChart = useMemo(() => {
    const breached = analyticsSource.filter((c) => isBreached(c)).length;
    const onTrack = analyticsSource.filter(
      (c) => !isBreached(c)
    ).length;

    return [
      { name: "On Track", value: onTrack, fill: SLA_COLORS.safe },
      { name: "Breached", value: breached, fill: SLA_COLORS.breached }
    ];
  }, [analyticsSource]);

  // ========== CHART 2: RESOLUTION PERFORMANCE ==========
  const resolutionChart = useMemo(() => {
    const resolvedWithin = analyticsSource.filter(
      (c) => isResolvedState(c.status) && !isBreached(c)
    ).length;

    const resolvedLate = analyticsSource.filter(
      (c) => isResolvedState(c.status) && isBreached(c)
    ).length;

    const unresolved = analyticsSource.filter((c) => !isResolvedState(c.status)).length;

    return [
      { name: "Resolved Within SLA", value: resolvedWithin, fill: "#10b981" },
      { name: "Resolved After SLA", value: resolvedLate, fill: "#f59e0b" },
      { name: "Still Open", value: unresolved, fill: "#ef4444" }
    ];
  }, [analyticsSource]);

  const repeatedByCategoryChart = useMemo(() => {
    const counter = {};

    analyticsSource.forEach((c) => {
      if (!c?.automation?.repeatedIssue) return;
      const category = c.category || "Uncategorized";
      counter[category] = (counter[category] || 0) + 1;
    });

    return Object.entries(counter)
      .map(([name, count]) => ({
        name: name.length > 16 ? `${name.slice(0, 16)}...` : name,
        count,
        fill: "#8b5cf6"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [analyticsSource]);

  const priorityDistributionChart = useMemo(() => {
    const counts = { NORMAL: 0, HIGH: 0, EMERGENCY: 0 };

    analyticsSource.forEach((c) => {
      const priority = String(c.priority || "NORMAL").toUpperCase();
      if (counts[priority] !== undefined) {
        counts[priority] += 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      fill: PRIORITY_COLORS[name]
    }));
  }, [analyticsSource]);

  const feedbackRatingsChart = useMemo(() => {
    const counts = {
      "1 Star": 0,
      "2 Star": 0,
      "3 Star": 0,
      "4 Star": 0,
      "5 Star": 0
    };

    analyticsSource.forEach((c) => {
      if (!c?.feedback?.submitted) return;
      const rating = Number(c.feedback.rating);
      if (rating >= 1 && rating <= 5) {
        counts[`${rating} Star`] += 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: "#06b6d4"
    }));
  }, [analyticsSource]);

  // ========== RENDER ==========
  if (loading)
    return (
      <div className="complaints-page">
        <div className="page-section">Loading complaints...</div>
      </div>
    );
  if (error)
    return (
      <div className="complaints-page">
        <div className="page-section">Error: {error}</div>
      </div>
    );

  return (
    <div className="complaints-page">
      {/* ========== HEADER ========== */}
      <div className="page-header">
        <h1>Complaints Management</h1>
        <p>Monitor, track, and manage community complaints efficiently</p>
      </div>

      {/* ========== KPI STRIP ========== */}
      <div className="kpi-strip">
        <KpiCard label="Total Complaints" value={kpis.total} />
        <KpiCard label="SLA Breached" value={kpis.breached} trend="danger" />
        <KpiCard label="Resolved" value={kpis.resolved} trend="success" />
        <KpiCard label="Closed" value={kpis.closed} trend="info" />
        <KpiCard label="Feedback Submitted" value={kpis.feedbackSubmitted} trend="info" />
      </div>

      {/* ========== ANALYTICS CHARTS ========== */}
      <div className="charts-grid">
        {/* CHART 0: Last 7 Days Trend */}
        <div className="chart-card">
          <h3>Complaint Volume (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ap-border)" />
              <XAxis dataKey="day" stroke="var(--ap-text)" />
              <YAxis stroke="var(--ap-text)" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--ap-surface)",
                  border: `1px solid var(--ap-border)`,
                  borderRadius: "8px",
                  color: "var(--ap-text)"
                }}
              />
              <Line type="monotone" dataKey="complaints" stroke="#2563eb" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 2: SLA Health Pie */}
        <div className="chart-card">
          <h3>SLA Health</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={slaChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {slaChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--ap-surface)",
                  border: `1px solid var(--ap-border)`,
                  borderRadius: "8px",
                  color: "var(--ap-text)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 3: Resolution Performance */}
        <div className="chart-card">
          <h3>Resolution Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resolutionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ap-border)" />
              <XAxis dataKey="name" stroke="var(--ap-text)" />
              <YAxis stroke="var(--ap-text)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--ap-surface)",
                  border: `1px solid var(--ap-border)`,
                  borderRadius: "8px",
                  color: "var(--ap-text)"
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                {resolutionChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* CHART 4: Top Repeated Categories */}
        <div className="chart-card">
          <h3>Top Repeated Categories</h3>
          {repeatedByCategoryChart.length === 0 ? (
            <p className="chart-empty-msg">No repeated issue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repeatedByCategoryChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ap-border)" />
                <XAxis dataKey="name" stroke="var(--ap-text)" />
                <YAxis stroke="var(--ap-text)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--ap-surface)",
                    border: `1px solid var(--ap-border)`,
                    borderRadius: "8px",
                    color: "var(--ap-text)"
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityDistributionChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                dataKey="value"
              >
                {priorityDistributionChart.map((entry, index) => (
                  <Cell key={`priority-cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--ap-surface)",
                  border: `1px solid var(--ap-border)`,
                  borderRadius: "8px",
                  color: "var(--ap-text)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Resident Feedback Ratings</h3>
          {feedbackRatingsChart.every((item) => item.value === 0) ? (
            <p className="chart-empty-msg">No resident feedback submitted yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feedbackRatingsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ap-border)" />
                <XAxis dataKey="name" stroke="var(--ap-text)" />
                <YAxis stroke="var(--ap-text)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--ap-surface)",
                    border: `1px solid var(--ap-border)`,
                    borderRadius: "8px",
                    color: "var(--ap-text)"
                  }}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ========== FILTERS & SEARCH ========== */}
      <div className="section-card">
        <div className="filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by complaint ID, resident name, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            {Object.keys(STATUS_COLORS).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">NORMAL</option>
            <option value="HIGH">HIGH</option>
            <option value="EMERGENCY">EMERGENCY</option>
          </select>

          <select
            className="filter-select"
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(":");
              setSortBy(key);
              setSortDir(dir);
            }}
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="deadline:asc">Nearest SLA Deadline</option>
            <option value="deadline:desc">Farthest SLA Deadline</option>
            <option value="priority:desc">Priority (High to Low)</option>
          </select>

          {(searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
            <button
              className="filter-clear-btn"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setSortBy("createdAt");
                setSortDir("desc");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="results-info">
          Showing <strong>{paginatedComplaints.length}</strong> on this page, <strong>{sortedFiltered.length}</strong> filtered, out of <strong>{complaints.length}</strong> total complaints
        </div>
      </div>

      {/* ========== COMPLAINTS TABLE ========== */}
      {sortedFiltered.length === 0 ? (
        <div className="section-card empty-state">
          <p>No complaints found</p>
        </div>
      ) : (
        <div className="section-card table-container">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("complaintCode")}>ID</button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("resident")}>Resident</button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("category")}>Category</button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("status")}>Status</button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("priority")}>Priority</button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => handleSort("deadline")}>SLA Status</button>
                </th>
                <th>Raised On</th>
                <th>Automation</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedComplaints.map((c) => (
                <tr key={c._id} className={`status-${String(c.status).toLowerCase()}`}>
                  <td className="id-col">{c.complaintCode || c._id.slice(-8)}</td>
                  <td>{c.resident?.name || "-"}</td>
                  <td>
                    <span className="category-badge">{c.category || "-"}</span>
                  </td>
                  <td>
                    <span className={`badge status ${String(c.status || "open").toLowerCase()}`}>
                      {c.status || "OPEN"}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${String(c.priority).toLowerCase()}`}>
                      {c.priority || "MEDIUM"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge sla ${isBreached(c) ? "breached" : "safe"}`}
                    >
                      {isBreached(c) ? "Breached" : "On Track"}
                    </span>
                  </td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</td>
                  <td>
                    <span className={`automation-badge ${String(c.automation?.callStatus).toLowerCase()}`}>
                      {formatCallStatus(c.automation?.callStatus)}
                    </span>
                    {c.automation?.whatsappReply ? (
                      <div className="table-subtext">WhatsApp reply received</div>
                    ) : null}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/admin/complaints/${c._id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-pagination">
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== HELPER COMPONENTS ==========
function KpiCard({ label, value, trend }) {
  return (
    <div className={`kpi-card ${trend ? `trend-${trend}` : ""}`}>
      <div className="kpi-content">
        <p className="kpi-label">{label}</p>
        <h3 className="kpi-value">{value}</h3>
      </div>
    </div>
  );
}
