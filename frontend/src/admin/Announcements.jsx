import React, { useEffect, useState } from "react";
import "../styles/Announcements.css";
import API_BASE from "../config/api";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editPriority, setEditPriority] = useState("Normal");
  const [editImageFile, setEditImageFile] = useState(null);
  const [removeEditImage, setRemoveEditImage] = useState(false);

  const getImageUrl = (image) => {
    if (!image) return "";
    return image.startsWith("http") ? image : `${API_BASE}${image}`;
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to load announcements");
        return;
      }
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      alert("Unable to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const addAnnouncement = async () => {
    if (!title.trim() || !message.trim()) return;

    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("message", message);
      formData.append("priority", priority);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${API_BASE}/api/announcements`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to create announcement");
        return;
      }

      setAnnouncements((prev) => [data, ...prev]);
      setTitle("");
      setMessage("");
      setPriority("Normal");
      setImageFile(null);
    } catch {
      alert("Unable to create announcement");
    } finally {
      setBusy(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to delete announcement");
        return;
      }
      setAnnouncements((prev) => prev.filter((a) => (a._id || a.id) !== id));
    } catch {
      alert("Unable to delete announcement");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (a) => {
    setEditingId(a._id || a.id);
    setEditTitle(a.title || "");
    setEditMessage(a.message || "");
    setEditPriority(a.priority || "Normal");
    setEditImageFile(null);
    setRemoveEditImage(false);
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditTitle("");
    setEditMessage("");
    setEditPriority("Normal");
    setEditImageFile(null);
    setRemoveEditImage(false);
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim() || !editMessage.trim()) {
      alert("Title and message are required");
      return;
    }

    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", editTitle);
      formData.append("message", editMessage);
      formData.append("priority", editPriority);
      if (editImageFile) {
        formData.append("image", editImageFile);
      }
      if (removeEditImage) {
        formData.append("removeImage", "true");
      }

      const res = await fetch(`${API_BASE}/api/announcements/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update announcement");
        return;
      }

      setAnnouncements((prev) =>
        prev.map((item) => ((item._id || item.id) === id ? data : item))
      );
      cancelEdit();
    } catch {
      alert("Unable to update announcement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="announcements-page">
      <h1>Announcements</h1>

      {/* CREATE ANNOUNCEMENT */}
      <div className="announcement-form">
        <input
          type="text"
          placeholder="Announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Announcement message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>Normal</option>
          <option>Important</option>
          <option>Emergency</option>
        </select>

        <button onClick={addAnnouncement} disabled={busy}>Post Announcement</button>
      </div>

      {/* ANNOUNCEMENT LIST */}
      <div className="announcement-list">
        {loading && <p className="no-data">Loading announcements...</p>}

        {announcements.length === 0 && (
          <p className="no-data">No announcements yet</p>
        )}

        {announcements.map((a) => (
          <div
            key={a._id || a.id}
            className={`announcement-card ${a.priority.toLowerCase()}`}
          >
            <div className="announcement-header">
              {editingId === (a._id || a.id) ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              ) : (
                <h3>{a.title}</h3>
              )}
              <span className={`badge ${a.priority.toLowerCase()}`}>
                {a.priority}
              </span>
            </div>

            {editingId === (a._id || a.id) ? (
              <>
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                />
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option>Normal</option>
                  <option>Important</option>
                  <option>Emergency</option>
                </select>
              </>
            ) : (
              <p className="announcement-message">{a.message}</p>
            )}

            {!!a.image && (
              <img
                src={getImageUrl(a.image)}
                alt="announcement"
                className="announcement-image"
              />
            )}

            {editingId === (a._id || a.id) && (
              <div className="announcement-edit-image-row">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                />
                {!!a.image && (
                  <label>
                    <input
                      type="checkbox"
                      checked={removeEditImage}
                      onChange={(e) => setRemoveEditImage(e.target.checked)}
                    />
                    Remove current image
                  </label>
                )}
              </div>
            )}

            <div className="announcement-footer">
              <small className="announcement-date">
                {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : a.date}
              </small>

              {editingId === (a._id || a.id) ? (
                <>
                  <button
                    className="delete-btn"
                    onClick={() => saveEdit(a._id || a.id)}
                    disabled={busy}
                  >
                    Save
                  </button>
                  <button
                    className="delete-btn"
                    onClick={cancelEdit}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="delete-btn"
                    onClick={() => startEdit(a)}
                    disabled={busy}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteAnnouncement(a._id || a.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
