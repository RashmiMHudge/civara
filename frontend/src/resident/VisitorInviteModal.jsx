import React, { useState } from "react";
import API_BASE from "../config/api";
//import visitorInvitesData from "../admin/data/visitorInvitesData";
import toast from "react-hot-toast";



const VisitorInviteModal = ({  onClose,onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    purpose: "",
    date: "",
    fromTime: "",
    toTime: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    if (!form.name || !form.date || !form.fromTime || !form.toTime) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/visitors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          visitorName: form.name,
          phone: form.phone,
          purpose: form.purpose,
          visitDate: form.date,
          fromTime: form.fromTime,
          toTime: form.toTime
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to create invite");
        return;
      }

      toast.success(`Visitor invite created! Code: ${data.inviteCode}`);
      onCreated(); // refresh visitor list
      onClose();

    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>Invite Visitor</h2>


        <input
          name="name"
          placeholder="Visitor Name *"
          maxLength={40}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Visitor Phone Number (10 digits)"
          maxLength={10}
          onChange={handleChange}
        />

        <input
          name="purpose"
          placeholder="Purpose (optional)"
          maxLength={40}
          onChange={handleChange}
        />
        
        <input
          type="date"
          name="date"
          onChange={handleChange}
        />

        <div className="time-row">
          <label style={{ marginTop: "10px" }}>Time:</label>
          <input
            type="time"
            name="fromTime"
            onChange={handleChange}
          />
          <span style={{ margin: "0 5px" }}>To Time:</span>
          <input
            type="time"
            name="toTime"
            onChange={handleChange}
          />
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleCreate}>
            Generate Invite
          </button>
        </div>

        <p className="muted-text small">
          Visitor must show the code at security gate
        </p>
      </div>
    </div>
  );
};

export default VisitorInviteModal;
