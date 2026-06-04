import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MaintenanceFinanceChart = ({ data = [] }) => {
  const hasData = data.some((item) => Number(item.amount || 0) > 0);

  return (
    <div className="dashboard-section">
      <h2>Maintenance Collection Overview (Rs)</h2>

      {!hasData ? (
        <p className="chart-empty">
          No maintenance collection data available yet for this society.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `Rs ${value}`} />
            <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MaintenanceFinanceChart;
