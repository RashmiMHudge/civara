import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import shiftRoutes from "./routes/shift.routes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("CIVARA Backend Running");
});

// 🔑 AUTH ROUTES
app.use("/api/auth", authRoutes);

// Attendance and Shift Routes
app.use("/api/attendance", attendanceRoutes);
app.use("/api/shifts", shiftRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global error handler", err);

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.message === 'Only JPEG, PNG and WEBP images are allowed') {
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

export default app;
