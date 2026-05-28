import React ,{useCallback, useEffect, useState} from "react";
import API_BASE from "../config/api";
//import visitorsData from "../admin/data/visitorsData";
//import { shiftsData } from "../admin/data/shiftsData";
import { getActiveGuardContext } from "./visitors/guardContext";
//import { useNavigate } from "react-router-dom";
import SecurityAnalytics from "./analytics/SecurityAnalytics";



const SecurityDashboard = () => {
  //const navigate = useNavigate();
  const guard = getActiveGuardContext();

  const [visitors, setVisitors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officer, setOfficer] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  const fetchOfficerProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/security/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch officer profile");
      }
      setOfficer({
        name: data.name || null,
        guardId: data.guardId || data.displayGuardId || null
      });
    } catch (error) {
      throw error;
    }
  }, []);

  /*=========================
      FETCH VISITORS 
  =========================*/
  const fetchVisitors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/visitors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch visitors");
      }
      setVisitors(data);
    } catch (error) {
      throw error;
    }
  }, []);

  /*=========================
      FETCH EMERGENCIES 
  =========================*/
  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/emergencies/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch emergencies");
      }
      setEmergencies(data);
    } catch (error) {
      throw error;
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([fetchOfficerProfile(), fetchVisitors(), fetchEmergencies()]);
    } catch (error) {
      console.error("Failed to refresh security dashboard", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [fetchEmergencies, fetchOfficerProfile, fetchVisitors]);

  /*=========================
     LOAD DATA 
  =========================*/
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  /*=========================
      CALCULATE KPIs
  =========================*/
  const expectedVisitors = visitors.filter(
    v => 
      new Date(v.visitDate).toISOString().split("T")[0] === today &&
      v.status === "EXPECTED"
  );
  //const onDutyGuards = shiftsData.filter(s => s.date === today && s.status ==="Active");
  
  const activeAlerts = emergencies.filter(e => e.status === "ACTIVE");
  const officerName = officer?.name || guard?.name || "Security Officer";
  const officerId = officer?.guardId || guard?.guardId || "ID not assigned";
 

  return (
    <div className="page-container">
      <h1 className="page-title">Security Dashboard</h1>
      <p className="muted-text">
        Today’s shift & active alerts overview
      </p>
    
      <br />

      {loading && <p className="muted-text">Loading dashboard data...</p>}
      {!loading && error && <p className="muted-text">{error}</p>}
      
      <p className="muted-text">
        On Duty Officer: <strong>{officerName}</strong> · <strong>{officerId}</strong>
      </p>

      <br />
      <div className="kpi-grid">
        <div className="kpi-card success">
          <h4>Total Visitors</h4>
          <strong>{visitors.length}</strong>
        </div>

        <div className="kpi-card warning">
          <h4>Visitors Expected</h4>
          <strong>{expectedVisitors.length}</strong>
        </div>

        <div className="kpi-card danger">
          <h4>Active Alerts</h4>
          <strong>{activeAlerts.length}</strong>
        </div>
      </div>

      {!loading && visitors.length === 0 && activeAlerts.length === 0 && (
        <p className="muted-text">No live activity for today yet.</p>
      )}

      <br />
      <SecurityAnalytics visitors={visitors} emergencies={emergencies} />
    </div>
  );
};

export default SecurityDashboard;
