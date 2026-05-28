 import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API_BASE from "../config/api";

const ResidentProfile = () => {
  const [resident, setResident] = useState(null);
  const [neighbours, setNeighbours] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("residentTheme") || "light");

  const token = localStorage.getItem("token");

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          setResident(null);
          return;
        }
        const res = await fetch(`${API_BASE}/api/resident/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok || !data || typeof data !== "object" || Array.isArray(data)) {
          setResident(null);
          return;
        }
        const avatarUrl = data.avatar ? (data.avatar.startsWith("http") ? data.avatar : `${API_BASE}${data.avatar}`) : null;
        setResident({ ...data, avatar: avatarUrl });
        setProfilePic(avatarUrl);
      } catch {
        setResident(null);
      }
    };

    const fetchNeighbours = async () => {
      try {
        if (!token) {
          setNeighbours([]);
          return;
        }
        const res = await fetch(`${API_BASE}/api/resident/neighbours`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setNeighbours(Array.isArray(data) ? data : []);
      } catch {
        setNeighbours([]);
      }
    };

    fetchProfile();
    fetchNeighbours();
  }, [token]);

  useEffect(() => {
    const syncTheme = () => {
      setTheme(localStorage.getItem("residentTheme") || "light");
    };
    window.addEventListener("resident-theme-change", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("resident-theme-change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  if (!resident) return <p className="page-container">Loading...</p>;

  const fullFlat = [resident.block, resident.flat].filter(Boolean).join("-");
  const documents = resident.documents || [];
  const emergency = resident.emergencyContact;
  const societyName = resident.societyName || "";
  const societyAddress = resident.societyAddress || "";
  const societyContact = resident.societyContact || "";

  /* ================= PROFILE PIC ================= */
  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch(`${API_BASE}/api/resident/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setProfilePic(data.avatar);
      setResident((prev) => ({ ...prev, avatar: data.avatar }));
      toast.success("Profile photo updated");
    } catch (error) {
      console.error("Avatar upload failed", error);
      toast.error(error.message || "Avatar upload failed");
    }
  };

  const removePic = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/resident/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to remove avatar");
      }

      setProfilePic(null);
      setResident((prev) => ({ ...prev, avatar: null }));
      toast.success("Profile photo removed");
    } catch (error) {
      console.error("Remove avatar failed", error);
      toast.error(error.message || "Failed to remove avatar");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("residentTheme", next);
    setTheme(next);
    window.dispatchEvent(new Event("resident-theme-change"));
    toast.success(next === "dark" ? "Dark mode enabled" : "Light mode enabled");
  };

  return (
    <div className="page-container">
      <h1 className="page-title">My Profile</h1>

      <p className="muted-text" style={{ marginBottom: 16 }}>Resident identity and profile information</p>

      <div className="profile-split">
        {/* PROFILE CARD */}
        <div className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar-lg">
              {profilePic || resident?.avatar ? (
                <>
                  <img src={profilePic || resident?.avatar} alt="profile" />
                  <div className="avatar-actions">
                    <label className="avatar-btn">
                      Change
                      <input type="file" hidden onChange={handlePicUpload} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="upload-pic">
                  {resident?.name ? resident.name.charAt(0) : "U"}
                  <input type="file" hidden onChange={handlePicUpload} />
                </label>
              )}
            </div>

            <div>
              <h2>{resident.name}</h2>
              <p className="muted-text" style={{ marginBottom: 4 }}>{resident.role}</p>
              <p className="muted-text" style={{ fontSize: 14, wordBreak: "break-all", marginBottom: 0 }}>
                <strong>Email:</strong> {resident.email || "Not set"}
              </p>
            </div>
          </div>

          <div className="info-row">
            <span>Flat</span>
            <strong>{fullFlat || "Not set"}</strong>
          </div>

          <div className="info-row">
            <span>Phone</span>
            <strong>{resident.phone || "Not set"}</strong>
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

          <div className="info-row">
            <span>Status</span>
            <span className="status-pill status-open">Active</span>
          </div>

          <button className="primary-btn" style={{ background: "#f44336", marginTop: 8 }} onClick={removePic}>
            Remove Photo
          </button>
        </div>

        {/* NEIGHBOURS */}
        <div className="profile-card">
          <h3>Neighbours</h3>

          <div className="neighbour-list">
            {neighbours.length === 0 ? (
              <p className="muted-text">No neighbours found</p>
            ) : (
              neighbours.map((n) => (
                <div key={n._id} className="neighbour-row">
                  <div className="avatar-sm">
                    {n?.name ? n.name.charAt(0) : "U"}
                  </div>

                  <div className="neighbour-info">
                    <strong>{n.name}</strong>
                    <p className="muted-text">
                      Flat {n.flat} · {n.role}
                    </p>
                  </div>

                  <span className="status-badge active">Active</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="profile-split">
        {/* DOCUMENTS */}
        <div className="profile-card">
          <h3>Documents</h3>

          {documents.length === 0 ? (
            <p className="muted-text">No documents uploaded</p>
          ) : (
            documents.map((doc, index) => (
              <div key={index} className="document-row">
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
          )}
        </div>

        {/* EMERGENCY CONTACT */}
        <div className="profile-card">
          <h3>Emergency Contact</h3>

          {emergency ? (
            <>
              <div className="info-row">
                <span>Name</span>
                <strong>{emergency.name || "Not set"}</strong>
              </div>
              <div className="info-row">
                <span>Relation</span>
                <strong>{emergency.relation || "Not set"}</strong>
              </div>
              <div className="info-row">
                <span>Phone</span>
                <strong>{emergency.phone || "Not set"}</strong>
              </div>
            </>
          ) : (
            <p className="muted-text">No emergency contact added</p>
          )}
        </div>
      </div>

      {/* SETTINGS CARD */}
      <div className="profile-card full-width settings-card">
        <h3>Resident Settings</h3>
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
        <ResidentChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

    </div>
  );
};

export default ResidentProfile;

const ResidentChangePasswordModal = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (String(newPassword).length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/resident/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
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
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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