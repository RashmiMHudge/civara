import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const data = [
  { name: "Paid", amount: 42000 },
  { name: "Pending", amount: 8500 },
  { name: "Overdue", amount: 6200 }
];

const MaintenanceFinanceChart = () => {
  return (
    <div className="dashboard-section">
      <h2>Maintenance Collection Overview (₹)</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />

          <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MaintenanceFinanceChart;
