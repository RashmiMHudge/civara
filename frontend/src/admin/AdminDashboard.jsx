import React from "react";
import "../styles/AdminDashboard.css";
import ComplaintCategoryPie from "../components/ComplaintsCategoryPie";
import MaintenanceFinanceChart from "../components/MaintenanceFinanceChart";
import MaintenanceTrendChart from "./MaintenanceTrendChart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import API_BASE from "../config/api";

const AdminDashboard = () => {
  const [stats, setStats] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { headers }),
        fetch(`${API_BASE}/api/admin/users`, { headers }),
      ]);

      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
      ]);

      if (!statsRes.ok) {
        throw new Error(statsData.message || "Failed to load dashboard stats");
      }
      if (!usersRes.ok) {
        throw new Error(usersData.message || "Failed to load users");
      }

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const residents = users.filter((u) => u.role === "resident");
  const activeResidents = residents.filter((r) => r.isActive !== false);
  const pendingResidents = residents.filter((r) => r.maintenanceStatus === "Pending");
  const overdueResidents = residents.filter((r) => r.maintenanceStatus === "Overdue");
  const paidResidents = residents.filter((r) => r.maintenanceStatus === "Paid");
  const adminUser = users.find((u) => u.role === "admin");

  const totalComplaints = stats?.complaints?.total || 0;
  const resolvedComplaints = stats?.complaints?.resolved || 0;
  const resolutionRate = totalComplaints > 0
    ? Math.round((resolvedComplaints / totalComplaints) * 100)
    : 0;

  const maintenancePayments = {
    paid: paidResidents.length,
    pending: pendingResidents.length,
    overdue: overdueResidents.length,
    pendingList: pendingResidents.slice(0, 6).map((resident) => ({
      flat: resident.flat || "N/A",
      amount: 2500,
      month: "Current",
    })),
  };

  const maintenanceCollectionData = [
    { name: "Paid", amount: maintenancePayments.paid * 2500 },
    { name: "Pending", amount: maintenancePayments.pending * 2500 },
    { name: "Overdue", amount: maintenancePayments.overdue * 2500 },
  ];

  // Historical maintenance collection snapshots are not stored yet.
  const maintenanceTrendData = [];

  const operationsSummary = [
    `Complaint resolution rate: ${resolutionRate}% (${resolvedComplaints}/${totalComplaints}).`,
    `Resident activity: ${activeResidents.length} of ${residents.length} residents are active.`,
    `Maintenance follow-up required for ${maintenancePayments.pending + maintenancePayments.overdue} residents.`,
    `Security staffing: ${stats?.users?.security || 0} guard accounts are currently configured.`,
    `Total emergency incidents logged: ${stats?.emergencies?.total || 0}.`,
  ];

  if (loading) {
    return <div className="dashboard-page">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-error">{error}</p>
        <button className="dashboard-retry" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>CIVARA Dashboard</h1>
          <p>Live society operations overview</p>
        </div>
        <div className="admin-info">
          <p><strong>Admin:</strong> {adminUser?.name || "Society Admin"}</p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dash-card">
          <h4>Total Residents</h4>
          <p>{stats?.users?.residents || 0}</p>
        </div>

        <div className="dash-card">
          <h4>Active Complaints</h4>
          <p>{stats?.complaints?.pending || 0}</p>
        </div>

        <div className="dash-card alert">
          <h4>Overdue Complaints</h4>
          <p>{stats?.complaints?.slaBreached || 0}</p>
        </div>

        <div className="dash-card warning">
          <h4>Pending Payments</h4>
          <p>{maintenancePayments.pending + maintenancePayments.overdue}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Maintenance Payment Status</h2>

        <div className="payment-stats">
          <span>Paid: {maintenancePayments.paid}</span>
          <span>Pending: {maintenancePayments.pending}</span>
          <span>Overdue: {maintenancePayments.overdue}</span>
        </div>

        <table className="mini-table">
          <thead>
            <tr>
              <th>Flat</th>
              <th>Amount</th>
              <th>Month</th>
            </tr>
          </thead>
          <tbody>
            {maintenancePayments.pendingList.length === 0 ? (
              <tr>
                <td colSpan="3">No pending maintenance dues.</td>
              </tr>
            ) : (
              maintenancePayments.pendingList.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.flat}</td>
                  <td>Rs {payment.amount}</td>
                  <td>{payment.month}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ComplaintTrendChart />
      <SLAStatsChart />

      <div className="dashboard-section">
        <ComplaintCategoryPie />
      </div>
      <div className="dashboard-section">
        <MaintenanceFinanceChart data={maintenanceCollectionData} />
      </div>
      <div className="dashboard-section">
        <MaintenanceTrendChart data={maintenanceTrendData} />
      </div>

      <div className="dashboard-section">
        <h2>Operations Summary</h2>
        <ul className="insights-list">
          {operationsSummary.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

function ComplaintTrendChart() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/complaints/trend`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to load");
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-section">
      <h2>Complaints Trend (Last 7 Days)</h2>
      {loading ? (
        <p>Loading chart...</p>
      ) : error ? (
        <p className="chart-error">Error: {error}</p>
      ) : data.length === 0 ? (
        <p className="chart-empty">No complaint trend data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="complaints"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function SLAStatsChart() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const COLORS = ["#22c55e", "#ef4444"];

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/complaints/sla-stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to load");
        setData([
          { name: "On Track", value: result.onTrack },
          { name: "Breached", value: result.breached },
        ]);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-section">
      <h2>SLA Compliance</h2>
      {loading ? (
        <p>Loading chart...</p>
      ) : error ? (
        <p className="chart-error">Error: {error}</p>
      ) : data.length === 0 ? (
        <p className="chart-empty">No SLA data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default AdminDashboard;
