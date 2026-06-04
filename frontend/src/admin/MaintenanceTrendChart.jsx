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

const MaintenanceTrendChart = ({ data = [] }) => {
  const hasData = data.some((item) => Number(item.amount || 0) > 0);

  return (
    <div className="chart-card">
      <h3>Monthly Maintenance Analytics</h3>

      {!hasData ? (
        <p className="chart-empty">
          No monthly maintenance trend is available yet for this society.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `Rs ${value}`} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MaintenanceTrendChart;
