import React, { useEffect, useState } from "react";
import API_BASE from "../config/api";
import "../styles/Announcements.css";

const ResidentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/api/announcements`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch announcements");
        }

        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (error) {
        setAnnouncements([]);
        setError(error.message || "Unable to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const priorityOrder = {
    Emergency: 1,
    Important: 2,
    Normal: 3,
  };

  const sortedAnnouncements = [...announcements].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const getImageUrl = (image) => {
    if (!image) return "";
    return image.startsWith("http") ? image : `${API_BASE}${image}`;
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Announcements</h1>

      {loading && (
        <div className="card muted-text">Loading announcements...</div>
      )}

      {!loading && !!error && (
        <div className="card muted-text">{error}</div>
      )}

      {!loading && sortedAnnouncements.length === 0 ? (
        <div className="card muted-text">
          No announcements available
        </div>
      ) : (
        sortedAnnouncements.map((a) => (
          <div key={a._id || a.id} className="card announcement-card">
            <h3>{a.title}</h3>
            <p>{a.message}</p>

            {!!a.image && (
              <img
                src={getImageUrl(a.image)}
                alt="announcement"
                className="announcement-image"
              />
            )}

            <div className="announcement-footer">
              <span className="muted-text">
                {a.createdAt
                  ? new Date(a.createdAt).toLocaleDateString()
                  : a.date}
              </span>

              {a.priority && (
                <span
                  className={`priority-pill priority-${a.priority.toLowerCase()}`}
                >
                  {a.priority}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ResidentAnnouncements;