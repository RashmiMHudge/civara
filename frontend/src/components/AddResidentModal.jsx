import React, { useState } from "react";
import "../styles/residents.css";

const generateId = (count) => `RES-${String(count + 1).padStart(4, "0")}`;
const generatePassword = () =>
  Math.random().toString(36).slice(-8);

const AddResidentModal = ({ onClose, onAdd, existingCount }) => {
  const [form, setForm] = useState({
    name: "",
    flat: "",
    block: "",
    phone: "",
    email: "",
    maintenance: "",
  });

  const residentId = generateId(existingCount);
  const username =
    form.name && form.flat
      ? `${form.name.split(" ")[0].toLowerCase()}.${form.flat}`
      : "";
  const password = generatePassword();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.name || !form.flat || !form.phone) return;

    onAdd({
      id: residentId,
      ...form,
      username,
      password,
      status: "Active",
      maintenanceStatus: "Pending",
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Add New Resident</h2>

        <div className="form-group">
          <label>Resident Name</label>
          <input name="name" onChange={handleChange} />
        </div>

        <div className="form-row">
          <div>
            <label>Flat</label>
            <input name="flat" onChange={handleChange} />
          </div>
          <div>
            <label>Block</label>
            <input name="block" onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input name="phone" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input name="email" onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Monthly Maintenance (₹)</label>
          <input name="maintenance" onChange={handleChange} />
        </div>

        <div className="credentials-box">
          <p><strong>Resident ID:</strong> {residentId}</p>
          <p><strong>Username:</strong> {username || "Auto-generated"}</p>
          <p><strong>Password:</strong> {password}</p>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Create Resident
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddResidentModal;
