import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { maintenanceTrendData}  from "./data/dashboardChartsData";


const MaintenanceTrendChart = () => {
  return (
    <div className="chart-card">
      <h3>Monthly Maintenance Analytics </h3>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={maintenanceTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `₹${value}`} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MaintenanceTrendChart;
