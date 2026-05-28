import React, { useState } from "react";
import "../styles/admin.css";
import API_BASE from "../config/api";

/* Utils */
const generatePassword = () =>
  Math.random().toString(36).slice(-8);

/* Validation */
const nameRegex = /^[a-zA-Z\s]+$/;
const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const documentNumberRegex = /^\d{12}$/;

const AddResidentModal = ({ onClose, onAdd, existingCount }) => {
  const [form, setForm] = useState({
    name: "",
    block: "",
    flat: "",
    role: "OWNER",
    countryCode: "+91",
    phone: "",
    email: "",
    emergencyCountryCode: "+91",
    emergencyName: "",
    emergencyRelation: "",
    emergencyPhone: "",
    documentType: "",
    documentNumber: "",
    sendCredentials: true,
  });

  const [errors, setErrors] = useState({});

  //const id = `RES-${String(existingCount + 1).padStart(4, "0")}`;

  const username =
    form.name && form.flat
      ? `${form.name.split(" ")[0].toLowerCase()}.${form.flat}`
      : "-";

  const password = generatePassword();

  /* ================= VALIDATION ================= */
  const validate = () => {
    const e = {};

    if (!form.name || !nameRegex.test(form.name))
      e.name = "Enter a valid full name";

    if (!form.flat)
      e.flat = "Flat number is required";

    if (!phoneRegex.test(form.phone))
      e.phone = "Enter valid 10-digit phone number";

    if (form.email && !emailRegex.test(form.email))
      e.email = "Invalid email format";

    if (form.emergencyPhone && !phoneRegex.test(form.emergencyPhone))
      e.emergencyPhone = "Invalid emergency phone number";

    if (form.documentType || form.documentNumber) {
      if (!form.documentType || !form.documentNumber) {
        e.documentNumber = "Document type and number are both required";
      } else if (!documentNumberRegex.test(form.documentNumber)) {
        e.documentNumber = "Document number must be exactly 12 digits";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async() => {
    if (!validate()) return;

    const emergencyContact = form.emergencyName || form.emergencyRelation || form.emergencyPhone
      ? {
          name: form.emergencyName,
          relation: form.emergencyRelation,
          phone: form.emergencyPhone
            ? `${form.emergencyCountryCode}${form.emergencyPhone}`
            : "",
        }
      : null;

    const documents = form.documentType && form.documentNumber
      ? [{
          type: form.documentType,
          number: form.documentNumber,
          verified: false,
        }]
      : [];

   try{ 
    const res = await fetch(`${API_BASE}/api/admin/create-resident`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      name: form.name,
      email: form.email || username,
      password,
      block: form.block,
      flat: form.flat,
      phone: `${form.countryCode}${form.phone}`,
      occupancyType: form.role,
      emergencyContact: emergencyContact || undefined,
      documents,
    }),
  });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to create resident");
      return;
    }

    alert(
      `Resident Created \n\nUsername: ${username}\nPassword: ${password}`
    );

    if (typeof onAdd === "function") {
      onAdd();
    } else {
      onClose();
    }
  } catch (err) {
    alert("Backend not reachable");
  }
};  

   
  

  return (
    <div className="modal-backdrop">
      <div className="modal-card modern-modal">

        <h2>Add New Resident</h2>

        {/* ================= SCROLLABLE CONTENT ================= */}
        <div className="modal-content">

          <input
            name="name"
            placeholder="Full Name *"
            onChange={handleChange}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}

          <input
            name="block"
            placeholder="Block"
            onChange={handleChange}
          />

          <input
            name="flat"
            placeholder="Flat *"
            onChange={handleChange}
          />
          {errors.flat && <p className="error-text">{errors.flat}</p>}

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="OWNER">Owner</option>
            <option value="TENANT">Tenant</option>
          </select>

          {/* PHONE ROW */}
          <div className="phone-row">
            <select
              name="countryCode"
              value={form.countryCode}
              onChange={handleChange}
              className="country-code"
            >
              <option value="+91">+91 (IN)</option>
              <option value="+1">+1 (US)</option>
              <option value="+44">+44 (UK)</option>
            </select>

            <div className="phone-input-wrapper">
              <input
                name="phone"
                placeholder="Phone *"
                value={form.phone}
                maxLength={10}
                onChange={handleChange}
              />
              {errors.phone && (
                <p className="error-text">{errors.phone}</p>
              )}
            </div>
          </div>

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
          />
          {errors.email && <p className="error-text">{errors.email}</p>}

          <hr /><br />
          <h4>Emergency Contact </h4>

          <input
            name="emergencyName"
            placeholder="Name"
            onChange={handleChange}
          />

          <input
            name="emergencyRelation"
            placeholder="Relation"
            onChange={handleChange}
          />

          <div className="phone-row">
            <select
              name="emergencyCountryCode"
              value={form.emergencyCountryCode}
              onChange={handleChange}
              className="country-code"
            >
              <option value="+91">+91 (IN)</option>
              <option value="+1">+1 (US)</option>
            </select>

            <div className="phone-input-wrapper">
              <input
                name="emergencyPhone"
                placeholder="Phone"
                maxLength={10}
                onChange={handleChange}
              />
              {errors.emergencyPhone && (
                <p className="error-text">{errors.emergencyPhone}</p>
              )}
            </div>
          </div>

          <hr /><br />
          <h4>Document</h4>

          <input
            name="documentType"
            placeholder="Document Type (Aadhaar, PAN, etc.)"
            onChange={handleChange}
          />

          <input
            name="documentNumber"
            placeholder="Document Number (12 digits)"
            maxLength={12}
            inputMode="numeric"
            onChange={handleChange}
          />
          {errors.documentNumber && <p className="error-text">{errors.documentNumber}</p>}

          <hr />

          <div className="credentials-box">
            <p><strong>Username:</strong> {username}</p>
            <p><strong>Password:</strong> {password}</p>
            <p className="muted-text">
              Credentials will be shared manually (email integration later)
            </p>
          </div>

        </div>

        {/* ================= STICKY FOOTER ================= */}
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSubmit}>
            Create Resident
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddResidentModal;
