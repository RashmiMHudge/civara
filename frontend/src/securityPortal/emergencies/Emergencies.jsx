import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import API_BASE from "../../config/api";

const Emergencies = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const activeEmergencies = emergencies.filter((e) => e.status === "ACTIVE");

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/emergencies/all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setEmergencies(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load emergencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const resolveEmergency = async (id) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/emergencies/${id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Emergency resolved");
      fetchEmergencies();
    } catch (err) {
      console.error(err);
      toast.error("Failed to resolve");
    }
  };

  return (
    <div className="page-container emergencies-page">
      <div className="emergencies-header">
        <div>
          <h1 className="page-title">Emergencies</h1>
          <p className="muted-text">Live emergency alerts</p>
        </div>
        <span className="emergency-count-pill">Active: {activeEmergencies.length}</span>
      </div>

      <br />

      {loading && <p className="muted-text">Loading emergencies...</p>}

      {activeEmergencies.length === 0 && (
        <div className="profile-card emergency-empty">
          <h3>All Clear</h3>
          <p className="muted-text">No active emergencies at the moment.</p>
        </div>
      )}

      {activeEmergencies.map((e) => (
          <div key={e._id} className="card danger-card emergency-card">
            <div className="emergency-card-head">
              <h3>{e.type}</h3>
              <span className="emergency-status">{e.status}</span>
            </div>

            <p className="emergency-location">
              Flat <strong>{e.resident?.flat || "N/A"}</strong> · {e.resident?.name || "Resident"}
            </p>

            {typeof e.location?.lat === "number" && typeof e.location?.lng === "number" && (
              <p className="muted-text small">
                Location: {e.location.lat.toFixed(6)}, {e.location.lng.toFixed(6)} · {" "}
                <a
                  href={`https://maps.google.com/?q=${e.location.lat},${e.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Map
                </a>
              </p>
            )}

            {(typeof e.location?.lat !== "number" || typeof e.location?.lng !== "number") && (
              <p className="muted-text small">Location unavailable (permission denied, timeout, or older alert)</p>
            )}

            <p className="muted-text">{e.description}</p>
            <p className="muted-text small">
              {new Date(e.createdAt).toLocaleString()}
            </p>

            <div className="emergency-actions">
              <button
                className="success-btn"
                onClick={() => resolveEmergency(e._id)}
              >
                Mark As Resolved
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};

export default Emergencies;