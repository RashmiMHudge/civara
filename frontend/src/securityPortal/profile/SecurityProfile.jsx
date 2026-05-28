import React, { useState, useEffect } from "react";
import API_BASE from "../../config/api";
import toast from "react-hot-toast";

import ShiftHistory from "./ShiftHistory";
//import { getAttendanceStatus } from "../../utils/attendanceUtils";
import "./profilr.css";
//import { getActiveGuardContext } from "../visitors/guardContext";

const TODAY = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
const SHIFT_DEFAULT_TIMES = {
  Morning: { startTime: "06:00", endTime: "14:00" },
  Afternoon: { startTime: "14:00", endTime: "22:00" },
  Night: { startTime: "22:00", endTime: "06:00" },
};

const toAbsoluteAvatarUrl = (avatar) => {
  if (!avatar) return DEFAULT_AVATAR;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

const toDisplayUserId = (guard) => {
  if (!guard) return "N/A";
  if (guard.guardId) return `CIV-${guard.guardId}`;
  if (guard.displayGuardId) return `CIV-${guard.displayGuardId}`;
  return "CIV-SEC-PENDING";
};

const resolveShiftWindow = (shift) => {
  if (!shift) return { startTime: "--", endTime: "--" };
  const defaults = SHIFT_DEFAULT_TIMES[shift.shiftType] || { startTime: "--", endTime: "--" };
  return {
    startTime: shift.startTime || defaults.startTime,
    endTime: shift.endTime || defaults.endTime,
  };
};

const SecurityProfile = () => {
 //const context = getActiveGuardContext();
 const [guard, setGuard] = useState(null);
 const [todayShift, setTodayShift] = useState(null);
 const [todayAttendance, setTodayAttendance] = useState(null);
 const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
 const [showPasswordModal, setShowPasswordModal] = useState(false);
 const [theme, setTheme] = useState(() => localStorage.getItem("securityTheme") || "light");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 const formatTime = (value) => {
   if (!value) return "--";
   const d = new Date(value);
   if (Number.isNaN(d.getTime())) return value;
   return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
 };

 const fetchProfileAndShift = async () => {
   setLoading(true);
   setError("");
   try {
     const token = localStorage.getItem("token");
     // Fetch profile
     const res = await fetch(`${API_BASE}/api/security/profile`, {
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${token}`
       }
     });
     if (res.status === 403) throw new Error("Session expired or access denied");
     const data = await res.json();
     setGuard({
       id: data._id,
       guardId: data.guardId || null,
      displayGuardId: data.displayGuardId || "SEC-PENDING",
       name: data.name,
       phone: data.phone || "Not set",
       email: data.email,
       societyName: data.societyName || "",
       societyAddress: data.societyAddress || "",
       societyContact: data.societyContact || "",
       documents: Array.isArray(data.documents) ? data.documents : [],
       avatar: data.avatar || null,
       punchedInAt: data.punchedInAt || null,
       punchedOutAt: data.punchedOutAt || null
     });
     // Fetch today's shift using business guardId (e.g. SEC-1001), not Mongo _id
     if (data.guardId) {
       const today = new Date().toISOString().split("T")[0];
       const shiftRes = await fetch(`${API_BASE}/api/shifts/guard/${encodeURIComponent(data.guardId)}?date=${today}`, {
         headers: {
           "Authorization": `Bearer ${token}`
         }
       });
       const shiftData = await shiftRes.json();
       setTodayShift(Array.isArray(shiftData) ? shiftData[0] || null : shiftData || null);

       const attendanceRes = await fetch(`${API_BASE}/api/attendance/guard/${encodeURIComponent(data.guardId)}?date=${today}&days=1`, {
         headers: {
           "Authorization": `Bearer ${token}`
         }
       });
       const attendanceData = await attendanceRes.json();
       if (!attendanceRes.ok) {
         throw new Error(attendanceData.message || "Failed to fetch attendance");
       }
       setTodayAttendance(Array.isArray(attendanceData) ? attendanceData[0] || null : null);
     } else {
       setTodayShift(null);
       setTodayAttendance(null);
     }
   } catch (error) {
     setError(error.message || "Error fetching profile or shift");
   } finally {
     setLoading(false);
   }
 };

 useEffect(() => {
   fetchProfileAndShift();
 }, []);

 useEffect(() => {
   const syncTheme = () => {
     setTheme(localStorage.getItem("securityTheme") || "light");
   };
   window.addEventListener("security-theme-change", syncTheme);
   window.addEventListener("storage", syncTheme);
   return () => {
     window.removeEventListener("security-theme-change", syncTheme);
     window.removeEventListener("storage", syncTheme);
   };
 }, []);

 const toggleTheme = () => {
   const next = theme === "dark" ? "light" : "dark";
   localStorage.setItem("securityTheme", next);
   setTheme(next);
   window.dispatchEvent(new Event("security-theme-change"));
   toast.success(next === "dark" ? "Dark mode enabled" : "Light mode enabled");
 };

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!guard) return null;




  /* =========================
     2️⃣ THEN DERIVE STATUS
  ========================= */
  let status = "NO SHIFT";
  if (todayShift && todayAttendance?.punchedIn && todayAttendance?.punchedOut) {
    status = "COMPLETED";
  } else if (todayShift && todayAttendance?.punchedIn) {
    status = "ON DUTY";
  } else if (todayShift) {
    status = "ABSENT";
  }

  const shiftWindow = resolveShiftWindow(todayShift);
  const societyName = guard?.societyName || "";
  const societyAddress = guard?.societyAddress || "";
  const societyContact = guard?.societyContact || "";

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/security/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      toast.success("Photo uploaded successfully!");
      await fetchProfileAndShift();
    } catch (err) {
      toast.error(err.message || "Photo upload failed");
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveImage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      const res = await fetch(`${API_BASE}/api/security/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Remove failed");
      toast.success("Photo removed successfully!");
      await fetchProfileAndShift();
    } catch (err) {
      toast.error(err.message || "Photo remove failed");
    } finally {
      setLoading(false);
    }
  };
  const handlePunchIn = async () => {
    if (!guard?.guardId || !todayShift) {
      toast.error("No assigned shift found for today");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/attendance/punch-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          guardId: guard.guardId,
          gate: todayShift.gate,
          shift: todayShift.shiftType,
          date: todayShift.date || TODAY,
          startTime: shiftWindow.startTime,
          endTime: shiftWindow.endTime
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Punch in failed");
      toast.success("Punched in successfully");
      await fetchProfileAndShift();
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (err) {
      toast.error(err.message || "Punch in failed");
    } finally {
      setLoading(false);
    }
  };

const handlePunchOut = async () => {
  if (!guard?.guardId || !todayShift) {
    toast.error("No active shift found");
    return;
  }
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/api/attendance/punch-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        guardId: guard.guardId,
        date: todayShift.date || TODAY,
        shift: todayShift.shiftType
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Punch out failed");
    toast.success("Punched out successfully");
    await fetchProfileAndShift();
    setHistoryRefreshKey((prev) => prev + 1);
  } catch (err) {
    toast.error(err.message || "Punch out failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>
      <p className="muted-text">Security identity & digital shift card</p>
      <br />
      
      {/* ===== TOP SPLIT ROW ===== */}
      <div className="profile-split">
        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="profile-pic-wrapper">
            <img
              src={toAbsoluteAvatarUrl(guard.avatar)}
              alt="profile"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
            <div className="profile-pic-actions">
              <label
                className="avatar-action-btn upload-btn"
              >
                Upload
                <input type="file" hidden onChange={handleImageUpload} />
              </label>
              <button
                className="avatar-action-btn remove-btn"
                onClick={handleRemoveImage}
                disabled={!guard.avatar || loading}
                title={!guard.avatar ? "No photo to remove" : ""}
              >
                Remove
              </button>
            </div>
            {/* Toast messages are now used for feedback */}
          </div>
          <h3 className="guard-name">{guard.name}</h3>
          <p className="id-text">{guard.displayGuardId}</p>
          <p className="role-text">Security Officer</p>

          <div className="info-row">
            <span>User ID</span>
            <strong>{toDisplayUserId(guard)}</strong>
          </div>

          <div className="info-row">
            <span>Phone</span>
            <strong>{guard.phone}</strong>
          </div>

          <div className="info-row">
            <span>Email</span>
            <strong>{guard.email}</strong>
          </div>

          <div className="info-row">
            <span>Society</span>
            <strong>{societyName || "Not set"}</strong>
          </div>

          <div className="info-row">
            <span>Society Address</span>
            <strong>{societyAddress || "Not set"}</strong>
          </div>

          <div className="info-row">
            <span>Society Contact</span>
            <strong>{societyContact || "Not set"}</strong>
          </div>
        </div>

        {/* TODAY SHIFT */}
        <div className="profile-card punch-card">
          <h3>Today’s Shift</h3>

          {todayShift ? (
            <>
              <div className="info-row">
                <span>Gate</span>
                <strong>{todayShift.gate}</strong>
              </div>
              <div className="info-row">
                <span>Shift</span>
                <strong>{todayShift.shiftType}</strong>
              </div>

              <div className="info-row">
                <span>Timing</span>
                <strong>
                  {shiftWindow.startTime} – {shiftWindow.endTime}
                </strong>
              </div>
            </>
          ) : (
            <p className="muted-text">No shift assigned</p>
          )}

          <span className={`status-pill ${status.toLowerCase()}`}>
            {status}
          </span>

          <div className="punch-row">
            <span>Punched In</span>
            <strong>{formatTime(todayAttendance?.punchedIn)}</strong>
          </div>

          <div className="punch-row">
            <span>Punched Out</span>
            <strong>{formatTime(todayAttendance?.punchedOut)}</strong>
          </div>
          {/* ACTION BUTTONS */}
            <button
              className="primary-btn full-width"
              onClick={handlePunchIn}
              disabled={!todayShift || !!todayAttendance?.punchedIn || loading}
              title={!todayShift ? "No shift assigned for today" : ""}
            >
                Punch In
            </button>

            <button
              className="primary-btn full-width"
              onClick={handlePunchOut}
              disabled={!todayShift || !todayAttendance?.punchedIn || !!todayAttendance?.punchedOut || loading}
              title={!todayShift ? "No shift assigned for today" : ""}
            >
                Punch Out
            </button>

        </div>
      </div>

      {/* ===== HISTORY & DOCUMENTS SIDE BY SIDE ===== */}
      <div className="profile-split">
        {/* LEFT: SHIFT HISTORY */}
        <div>
          <ShiftHistory guardId={guard.guardId} refreshKey={historyRefreshKey} />
        </div>

        {/* RIGHT: DOCUMENTS */}
        <div className="profile-card">
          <h3>Documents</h3>

          {guard.documents?.length ? (
            guard.documents.map((doc, idx) => (
              <div key={doc._id || `${doc.type || "doc"}-${idx}`} className="document-row">
                <div>
                  <strong>{doc.type || "Document"}</strong>
                  <p className="muted-text">{doc.number || "-"}</p>
                  {(doc.verification || doc.verifiedOn) && (
                    <p className="muted-text small">
                      Verified on {new Date(doc.verification || doc.verifiedOn).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <span className={`status-badge ${doc.verified ? "active" : "inactive"}`}>
                  {doc.verified ? "Verified" : "Pending"}
                </span>
              </div>
            ))
          ) : (
            <p className="muted-text">No documents uploaded</p>
          )}
        </div>
      </div> 
   
      {/* ===== SETTINGS ===== */}
      <div className="profile-card full-width settings-card">
        <h3>Security Settings</h3>
        <p className="muted-text">Manage your access and display preferences</p>

        <div className="settings-row">
          <div>
            <p className="settings-label">Theme Mode</p>
          </div>
          <button className="secondary-btn settings-action-btn" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </button>
        </div>

        <div className="settings-row">
          <div>
            <p className="settings-label">Password</p>
            <p className="settings-help">Keep your account secure with a strong password</p>
          </div>
        <button
          className="primary-btn settings-action-btn"
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

export default SecurityProfile;

/* ================= PASSWORD MODAL ================= */

const ChangePasswordModal = ({ onClose }) => {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) {
      toast.error("Fill all fields");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/security/profile/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password update failed");
      toast.success("Password updated successfully");
      onClose();
    } catch (err) {
      toast.error(err.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Change Password</h3>

        <input
          type="password"
          placeholder="Current Password"
          onChange={(e) => setOldPwd(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password"
          onChange={(e) => setNewPwd(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPwd(e.target.value)}
        />

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="primary-btn" onClick={submit} disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};
