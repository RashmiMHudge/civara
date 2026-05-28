import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import API_BASE from "../config/api";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#6366f1", "#f43f5e"];

const ComplaintsCategoryPie = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/complaints/category-breakdown`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
      <h2>Complaints by Category</h2>
      {loading ? (
        <p>Loading chart...</p>
      ) : error ? (
        <p style={{ color: "#dc2626" }}>Error: {error}</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={110}
              dataKey="value"
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ComplaintsCategoryPie;
