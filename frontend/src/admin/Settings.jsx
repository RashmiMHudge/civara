import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API_BASE from "../config/api";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSociety, setSavingSociety] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [theme, setTheme] = useState(() => localStorage.getItem("adminTheme") || "light");
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", avatar: null });
  const [society, setSociety] = useState({ code: "", name: "", address: "", contact: "" });
  const [profilePic, setProfilePic] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch settings");

      const avatarUrl = data?.profile?.avatar 
        ? (data.profile.avatar.startsWith("http") 
          ? data.profile.avatar 
          : `${API_BASE}${data.profile.avatar}`)
        : null;

      setProfile({
        name: data?.profile?.name || "",
        email: data?.profile?.email || "",
        phone: data?.profile?.phone || "",
        avatar: avatarUrl,
      });
      setProfilePic(avatarUrl);

      setSociety({
        code: data?.society?.code || "",
        name: data?.society?.name || "",
        address: data?.society?.address || "",
        contact: data?.society?.contact || "",
      });

      const initialTheme = data?.appearance?.theme || localStorage.getItem("adminTheme") || "light";
      setTheme(initialTheme);
      localStorage.setItem("adminTheme", initialTheme);
      window.dispatchEvent(new Event("admin-theme-change"));
    } catch (err) {
      toast.error(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSociety = async () => {
    setSavingSociety(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/society`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: society.name,
          address: society.address,
          contact: society.contact,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update society settings");
      toast.success("Society settings updated");
    } catch (err) {
      toast.error(err.message || "Failed to update society settings");
    } finally {
      setSavingSociety(false);
    }
  };

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("adminTheme", next);
    window.dispatchEvent(new Event("admin-theme-change"));

    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ theme: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update theme");
      toast.success(next === "dark" ? "Dark mode enabled" : "Light mode enabled");
    } catch (err) {
      toast.error(err.message || "Failed to update theme");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload photo");
      
      const avatarUrl = data.avatar 
        ? (data.avatar.startsWith("http") ? data.avatar : `${API_BASE}${data.avatar}`)
        : null;
      
      setProfile((prev) => ({ ...prev, avatar: avatarUrl }));
      setProfilePic(avatarUrl);
      toast.success("Photo uploaded successfully");
    } catch (err) {
      toast.error(err.message || "Photo upload failed");
    } finally {
      setAvatarBusy(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    setAvatarBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: new FormData(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove photo");
      setProfile((prev) => ({ ...prev, avatar: null }));
      setProfilePic(null);
      toast.success("Photo removed successfully");
    } catch (err) {
      toast.error(err.message || "Photo remove failed");
    } finally {
      setAvatarBusy(false);
    }
  };

  const savePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password must match");
      return;
    }

    if (String(passwordForm.newPassword).length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");

      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <p className="page-container">Loading settings...</p>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>

      <div className="profile-grid">
        {/* PROFILE CARD */}
        <div className="card profile-card">
          <div className="profile-top">
            <div className="profile-avatar-lg">
              {profilePic || profile?.avatar ? (
                <>
                  <img src={profilePic || profile?.avatar} alt="profile" />
                  <div className="avatar-actions">
                    <label className="avatar-btn">
                      Change
                      <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="upload-pic">
                  {profile?.name ? profile.name.charAt(0) : "A"}
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </label>
              )}
            </div>

            <div>
              <h2>{profile.name}</h2>
              <p className="muted-text" style={{ marginBottom: 4 }}>Admin</p>
              <p className="muted-text" style={{ fontSize: 14, wordBreak: 'break-all', marginBottom: 0 }}>
                <strong>Email:</strong> {profile.email || <span style={{ color: '#aaa' }}>Not set</span>}
              </p>
            </div>
          </div>

          <div className="profile-details">
            <p><strong>Phone:</strong> {profile.phone || <span style={{ color: '#aaa' }}>Not set</span>}</p>
            <p>
              <strong>Status:</strong>
              <span className="status-pill status-open" style={{ marginLeft: 6 }}>Active</span>
            </p>
          </div>
          <br />

          <button className="primary-btn" style={{ background: '#f44336', marginBottom: 8 }} onClick={handleRemoveImage} disabled={!profile.avatar || avatarBusy}>
            {avatarBusy ? "Removing..." : "Remove Photo"}
          </button>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 0 }}>
            <span>Profile info is private and only visible to you.</span>
          </div>
        </div>

        {/* SOCIETY DETAILS CARD */}
        <div className="card">
          <h3 className="card-title">Society Details</h3>

          <div className="form-group">
            <label>Society Code</label>
            <input type="text" value={society.code} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="form-group">
            <label>Society Name</label>
            <input
              type="text"
              value={society.name}
              onChange={(e) => setSociety((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Society Address</label>
            <input
              type="text"
              value={society.address}
              onChange={(e) => setSociety((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              value={society.contact}
              onChange={(e) => setSociety((prev) => ({ ...prev, contact: e.target.value }))}
            />
          </div>

          <button className="primary-btn full-width" onClick={saveSociety} disabled={savingSociety}>
            {savingSociety ? "Saving..." : "Save Society Details"}
          </button>
        </div>
      </div>
       
      <br />
      {/* ADMIN PROFILE SETTINGS */}
      <div className="card">
        <h3 className="card-title">Admin Profile</h3>

        <div className="form-group">
          <label>Admin Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <input
            type="text"
            value={profile.phone}
            onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        <button className="primary-btn full-width" onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </div>
      
      <br />
      
      {/* APPEARANCE */}
      <div className="card">
        <h3 className="card-title">Settings</h3>

        <p className="muted-text" style={{ marginBottom: 20 }}>
          Manage your access and display preferences
        </p>

        <div className="settings-section">
          <div className="settings-row">
            <div>
              <p className="settings-label">Theme Mode</p>
              <p className="settings-help">
                {theme === "dark"
                  ? "Dark mode active (Low light theme)"
                  : "Light mode active (Bright interface)"}
              </p>
            </div>
            <button className="primary-btn settings-action-btn" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </button>
          </div>

          <div className="settings-row">
            <div>
              <p className="settings-label">Password</p>
              <p className="settings-help">Keep your account secure with a strong password</p>
            </div>
            <button className="secondary-btn settings-action-btn" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => !savingPassword && setShowPasswordModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Change Password</h3>

            <input
              type="password"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              disabled={savingPassword}
            />

            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              disabled={savingPassword}
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              disabled={savingPassword}
            />

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowPasswordModal(false)} disabled={savingPassword}>
                Cancel
              </button>
              <button className="primary-btn" onClick={savePassword} disabled={savingPassword}>
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
