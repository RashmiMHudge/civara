import dotenv from "dotenv";
dotenv.config();

import express from "express";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/auth.routes.js";
import protectedRoutes from "./src/routes/protected.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import residentRoutes from "./src/routes/resident.routes.js";
import complaintRoutes from "./src/routes/complaint.routes.js";
import { startSLAMonitor } from "./src/services/sla.service.js";
import announcementRoutes from "./src/routes/announcement.routes.js";
import emergencyRoutes from "./src/routes/emergency.routes.js";  
import visitorRoutes from "./src/routes/visitor.routes.js"; 
import securityRoutes from "./src/routes/security.routes.js";

connectDB();
startSLAMonitor();

app.use("/api/auth",authRoutes);
app.use("/api/protected",protectedRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/resident",residentRoutes);
app.use("/api/complaints",complaintRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/announcements",announcementRoutes);
app.use("/api/emergencies",emergencyRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/security", securityRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});
