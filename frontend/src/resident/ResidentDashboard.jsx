import { useCallback, useEffect, useRef, useState } from "react";
import EmergencyActions from "./EmergencyActions";
import API_BASE from "../config/api";
//import emergencyLogsData from "../admin/data/emergencyLogsData";
import toast from "react-hot-toast";
import VisitorInviteModal from "./VisitorInviteModal";
import { useNavigate } from "react-router-dom";
import EmergencyModal from "./EmergencyModal";
import societyConfig from "../securityPortal/components/societyConfig";
//import { addEmergency } from "../admin/data/emergencyStore";
import { useComplaints } from "./complaints/ComplaintsContext.jsx";
import "../styles/admin.css";

const ResidentDashboard = () => {

 const navigate = useNavigate();
 const[resident, setResident] = useState(null);
 const [showInvite, setShowInvite] = useState(false);
 const [myVisitors, setMyVisitors] = useState([]);
 const [loadingProfile, setLoadingProfile] = useState(true);
 const [dashboardError, setDashboardError] = useState("");

 const { complaints, fetchComplaints } = useComplaints();  
  const today = new Date().toDateString();

  const todaysVisitors = myVisitors.filter(
    v => 
      v.status === "CHECKED_IN" &&
      new Date(v.checkInTime).toDateString() === today
  );


  const fetchMyVisitors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/visitors/my-visitors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setDashboardError(data.message || "Failed to load visitors");
        return;
      }

      setMyVisitors(data);

    } catch (error) {
      console.error("Failed to fetch visitors", error);
    }
  }, []);

  const fetchResident = useCallback(async () => {
    try {
      setLoadingProfile(true);
      setDashboardError("");
      const res = await fetch(`${API_BASE}/api/resident/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setDashboardError(data.message || "Failed to load resident profile");
        return;
      }

      setResident(data);

    } catch (error) {
      console.error("Failed to fetch resident profile", error);
      setDashboardError("Failed to load resident profile");
    }
  }, []);

 const [isSubmitting, setIsSubmitting] = useState(false);
 const emergencySubmitLockRef = useRef(false);
 const[latestAnnouncement, setLatestAnnouncement] = useState(null);
 const fetchLatestAnnouncement = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

       if (Array.isArray(data) && data.length > 0) {
      setLatestAnnouncement(data[0]);
      } else {
        setLatestAnnouncement(null);
      }

    } catch (error) {
      console.error("Failed to fetch announcements", error);
      setLatestAnnouncement(null);
    }
 }, []);
 const [activeEmergency, setActiveEmergency] = useState(null);
 const residentSocietyCode = String(resident?.societyCode || "").toUpperCase();
 const normalizedSocietyCode = residentSocietyCode.replace(/^CIV-/, "CIVR-");
 const society = societyConfig[residentSocietyCode] || societyConfig[normalizedSocietyCode] || null;
 const societyContacts = society
? {
   security: society.securityNumber,
   police: society.emergencyNumbers.police,
   ambulance: society.emergencyNumbers.ambulance,
   fire: society.emergencyNumbers.fire,
 }
 :null;

 const refreshDashboard = useCallback(async () => {
  try {
    setLoadingProfile(true);
    setDashboardError("");
    await Promise.all([
      fetchResident(),
      fetchMyVisitors(),
      fetchLatestAnnouncement(),
      fetchComplaints(),
    ]);
  } catch (error) {
    console.error("Failed to refresh resident dashboard", error);
    setDashboardError("Failed to refresh dashboard");
  } finally {
    setLoadingProfile(false);
  }
 }, [fetchComplaints, fetchLatestAnnouncement, fetchMyVisitors, fetchResident]);

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      fetchMyVisitors();
      fetchComplaints();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchComplaints, fetchMyVisitors, refreshDashboard]);

 const handleEmergency = (type) => {
  console.log("Emergency triggered:", type);
  console.log("Society contacts:", societyContacts);
  setActiveEmergency(type); // open modal
};

const submitEmergency = async (description = "") => {
  if (isSubmitting || emergencySubmitLockRef.current) {
    toast.error("An emergency alert is already being sent.");
    return;
  }
  emergencySubmitLockRef.current = true;
  setIsSubmitting(true);
  try {
    const residentName = resident?.name || "Unknown";
    const residentFlat = resident?.flat || "Unknown";
    const emergencyType = activeEmergency;

    const requestPosition = (options) =>
      new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
              errorCode: null,
            });
          },
          (error) => {
            resolve({ location: null, errorCode: error?.code || null });
          },
          options
        );
      });

    let location = null;
    let geoErrorCode = null;

    if (navigator.geolocation) {
      const highAccuracyResult = await requestPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      location = highAccuracyResult.location;
      geoErrorCode = highAccuracyResult.errorCode;

      if (!location) {
        const fallbackResult = await requestPosition({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 300000,
        });
        location = fallbackResult.location;
        geoErrorCode = fallbackResult.errorCode || geoErrorCode;
      }
    }

    if (!location) {
      if (geoErrorCode === 1) {
        toast("Location permission denied for this alert");
      } else if (geoErrorCode === 3) {
        toast("Location timed out for this alert");
      } else {
        toast("Location unavailable for this alert");
      }
    }

    const res = await fetch(`${API_BASE}/api/emergencies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        type: emergencyType,
        description:
          description?.trim() ||
          `${emergencyType} alert from ${residentName} (${residentFlat})`,
        location,
        residentName,
        residentFlat,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || "Failed to send emergency");
      return;
    }

    toast.success(`${emergencyType} alert sent to security${location ? " with location" : ""}`);
    setActiveEmergency(null);
  } catch (error) {
    console.error(error);
    toast.error("Failed to send emergency request");
  } finally {
    emergencySubmitLockRef.current = false;
    setIsSubmitting(false);
  }
};

const CLOSED_LIKE_STATUSES = new Set(["RESOLVED", "CLOSED", "REJECTED"]);

const openComplaints =
  complaints?.filter((c) => !CLOSED_LIKE_STATUSES.has(String(c.status || "").toUpperCase())).length || 0;

const resolvedComplaints =
  complaints?.filter((c) => String(c.status || "").toUpperCase() === "RESOLVED").length || 0;
 
if(loadingProfile) {
  return   <div   className="page-container"> Loading resident profile... </div>
}

if(!resident) {
  return <div className="page-container">{dashboardError || "Unable to load resident profile."}</div>;
}

 return (
   <div className="page-container resident-dashboard">
    {resident && (
      <>
     <h1 className="page-title">Welcome, {resident.name}</h1>
     <p className="muted-text">
       Flat: {resident.flat} · Role: {resident.role}
     </p>
     {dashboardError && <p className="muted-text">{dashboardError}</p>}
     </>  
    )}

     <br /> 

   {/* 🔴 EMERGENCY FIRST */}
    <EmergencyActions onTrigger={handleEmergency} />
     {activeEmergency &&  (
        <EmergencyModal 
         type={activeEmergency}
         societyContacts={societyContacts}
         onClose={() => setActiveEmergency(null)}
         onSubmit={submitEmergency}
         isSubmitting={isSubmitting}
       />
     )}
     
     
     <br />


     <div className="quick-actions">
       <button
         className="qa-btn danger"
         onClick={() => window.location.href = `tel:${societyContacts?.security}`}
         disabled={!societyContacts?.security}
       >
         Call Security
       </button>
       <button className="qa-btn neutral" onClick={() => setShowInvite(true)}>Invite Visitor</button>
       <button className="qa-btn secondary" onClick={() => navigate("/resident/complaints/raise")}>Raise Complaint</button>
       <button className="qa-btn neutral" onClick={() => navigate("/resident/visitors")}>View Visitors</button>
     </div>
     
     
     <br />
     

     {/* KPIs */}
     <div className="kpi-grid">
       <div className="kpi-card">
         <div className="kpi-label">My Complaints</div>
        <strong>
          {openComplaints} Open / {resolvedComplaints} Resolved
        </strong>
       </div>

       <div className="kpi-card warning">
         <div className="kpi-label">Latest Announcement</div>
         <strong>{latestAnnouncement?.title || "None"}</strong>
         {latestAnnouncement?.createdAt && (
          <span className="muted-text">
            {new Date(latestAnnouncement.createdAt).toLocaleDateString()}
          </span>
         )}
       </div>

       <div className={`kpi-card ${resident?.maintenanceStatus === "Pending" ? "danger" : "success"}`}>
         <div className="kpi-label">Maintenance Status</div>
         <strong>{resident?.maintenanceStatus}</strong>
       </div>

         {/* NEW VISITOR STATS */}

        <div className="kpi-card">
          <div className="kpi-label">Visitors Today</div>
          <strong>{todaysVisitors.length}</strong>
        </div>

     </div>
     <br />
    <h2>My Visitors</h2>
    
    <br />

    {myVisitors.length === 0 ? (
      <p className="muted-text">No visitors yet.</p>
    ) : (
      <div className="visitor-list">
        {myVisitors.slice(0,2).map((visitor) => (
          <div key={visitor._id} className="visitor-row">
            <h4>{visitor.visitorName}</h4>
            <p>
              Visit Date: {new Date(visitor.visitDate).toLocaleDateString()}
            </p>

            <p className = {`visitorStatus ${visitor.status.toLowerCase()}`}>
              {visitor.status}</p>

            <p>Invite Code: {visitor.inviteCode}</p>

            {visitor.checkInTime && (
              <p>
                Entered at {new Date(visitor.checkInTime).toLocaleTimeString()}
              </p>
            )}

            {visitor.checkOutTime && (
              <p>
                Exited at {new Date(visitor.checkOutTime).toLocaleTimeString()}
              </p>
            )}
          </div>
        ))} 
      </div>
    )}

  {showInvite && (<VisitorInviteModal  onClose={() => setShowInvite(false)} onCreated={fetchMyVisitors} />)}   </div>

 );
};

export default ResidentDashboard;
