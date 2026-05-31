import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from "react-hot-toast";


/* Public Pages */
import Home from "./pages/Home";
import Login from "./pages/login";
import PlatformOnboarding from "./pages/PlatformOnboarding";
import Navbar from "./components/Navbar";

import ProtectedRoute from "./auth/ProtectedRoute";

/* Admin Portal */
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import Residents from "./admin/Residents";
import Security from "./admin/Security/Security";
import Complaints from "./admin/Complaints";
import ComplaintDetail from "./admin/ComplaintDetail";
import Announcements from "./admin/Announcements";
import Settings from "./admin/Settings";

/* Resident Portal */
import ResidentLayout from "./resident/ResidentLayout";
import ResidentDashboard from "./resident/ResidentDashboard";
import ResidentComplaints from "./resident/complaints/ResidentComplaints";
import RaiseComplaint from "./resident/complaints/RaiseComplaint";
import ResidentAnnouncements from "./resident/ResidentAnnouncements";
import ResidentProfile from "./resident/ResidentProfile";
import DetailComplaints from "./resident/complaints/DetailComplaints";
import VisitorsPage from "./resident/VisitorsPage";

import { ComplaintsProvider } from "./resident/complaints/ComplaintsContext";

/* Security Portal */
import SecurityLayout from "./securityPortal/SecurityLayout";
import SecurityDashboard from "./securityPortal/SecurityDashboard";
import Visitors from "./securityPortal/visitors/Visitors";
import Emergencies from "./securityPortal/emergencies/Emergencies";
import SecurityProfile from "./securityPortal/profile/SecurityProfile";
function App() {
  return (
    <Router>
      <AuthProvider>
        <ComplaintsProvider>
          <Toaster position="top-right" />
            <Routes>
              {/* ===================== */}
                {/* PUBLIC PAGES */}
                {/* ===================== */}

                {/* Home WITH Navbar */}
                <Route
                  path="/"
                  element={
                    <>
                      <Navbar />
                      <Home />
                    </>
                  }
                />

                  {/* Login WITHOUT Navbar */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/platform/onboarding" element={<PlatformOnboarding />} />

                  {/* ===================== */}
                  {/* ADMIN PORTAL */}
                  {/* ===================== */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<ProtectedRoute role ="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="residents" element={<Residents />} />
                    <Route path="security" element={<Security />} />
                    <Route path="complaints" element={<Complaints />} />
                    <Route path="complaints/:id" element={<ComplaintDetail />} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* ===================== */}
                  {/* RESIDENT PORTAL */}
                  {/* ===================== */}
                  <Route path="/resident" element={<ResidentLayout />}>
                    <Route path="dashboard" element={<ProtectedRoute role ="resident"><ResidentDashboard /></ProtectedRoute>} />
                    <Route path="announcements" element={<ResidentAnnouncements />} />
                    <Route path="complaints" element={<ResidentComplaints />} />
                    <Route path="complaints/raise" element={<RaiseComplaint />} />
                    <Route path="complaints/:id" element={<DetailComplaints />} />
                    <Route path="visitors" element={<VisitorsPage />} />
                    <Route path="profile" element={<ResidentProfile />} />
                  </Route>
                  {/* ===================== */}
                  {/* SECURITY PORTAL */}
                  {/* ===================== */}
                  <Route path="/security" element={<SecurityLayout />}>
                    <Route path="dashboard" element={<ProtectedRoute role ="security"><SecurityDashboard /></ProtectedRoute>} />
                    <Route path="visitors" element={<Visitors/>} />
                    <Route path="emergencies" element={<Emergencies />} />
                    <Route path="profile" element={<SecurityProfile />}/>
                  </Route>
            </Routes>
        </ComplaintsProvider>
     </AuthProvider>
  </Router>
  );
}

export default App;
