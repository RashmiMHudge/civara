import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

//import { weeklyVisitors, entryStats } from "./analyticsData";

const COLORS = ["#2563eb", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

const SecurityAnalytics = ({ visitors , emergencies }) => {
  // Prepare data for charts 7 days visitors 
  const last7Days=[...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toISOString().split("T")[0];

    const count = visitors.filter(
      v => new Date(v.createdAt).toISOString().split("T")[0] === dateStr).length;
    
    return { day, visitors: count };
  }).reverse();

  const emergencyLast7Days = [...Array(7)].map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);

  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = date.toISOString().split("T")[0];

  const count = emergencies.filter(
    e => new Date(e.createdAt).toISOString().split("T")[0] === dateStr
  ).length;

  return { day, emergencies: count };
}).reverse();

  const approved = visitors.filter(v => v.status === "CHECKED_IN").length;
  const denied = visitors.filter(v => v.status === "DENIED").length;
  const entryStats = [
    { name: "Entered", value: approved },
    { name: "Denied", value: denied }
  ];
  return (
    <div className="page-container">
      <h1 className="page-title">Security Analytics</h1>
      <p className="muted-text">
        Visitor movement insights 
      </p>
      
      <br />

      {/* KPI ROW */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h4>Total Visitors (7 days)</h4>
          <strong>
            {last7Days.reduce((a, b) => a + b.visitors, 0)}
          </strong>
        </div>

        <div className="kpi-card success">
          <h4>Approved Entries</h4>
          <strong>{approved}</strong>
        </div>

        <div className="kpi-card danger">
          <h4>Denied Entries</h4>
          <strong>{denied}</strong>
        </div>

        <div className="kpi-card warning">
          <h4>Emergencies Alerts (7 days)</h4>
          <strong>
            {emergencyLast7Days.reduce((a, b) => a + b.emergencies, 0)}
          </strong>
        </div>
      </div>

      {/* CHARTS */}
      <div className="analytics-grid">

        {/* BAR CHART */}
        <div className="analytics-card">
          <h4>Visitors Trend (Last 7 Days)</h4>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last7Days}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="visitors"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART */}
        <div className="analytics-card">
          <h4>Entry Status</h4>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={entryStats}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
              >
                {entryStats.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h4>Emergency Trend (Last 7 Days)</h4>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={emergencyLast7Days}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="emergencies"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default SecurityAnalytics;
