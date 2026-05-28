import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useComplaints } from "./ComplaintsContext";

const RaiseComplaint = () => {
  const navigate = useNavigate();
  const { createComplaint } = useComplaints();

  /* =========================
     STATE
  ========================= */

  const [form, setForm] = useState({
    //title: "",
    category: "",
    location: "",
    priority: "NORMAL",
    description: "",
    attachments: [],
    preferredCallTime: "ANYTIME",
    //repeatedIssue: false
  });

  const [errors, setErrors] = useState({});
  
  /* =========================
     HANDLERS
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveFile = (fileName) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter(
        (file) => file.name !== fileName
      )
    }));
  };

  /* =========================
     VALIDATION
  ========================= */

  const validate = () => {
    const newErrors = {};
    /*
    if (form.title.trim().length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }*/

    if (form.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters";
    }
    if(!form.category) {
      newErrors.category = "Category is required";
    }

    if (
      form.priority === "EMERGENCY" &&
      form.description.trim().length < 50
    ) {
      newErrors.description =
        "Emergency complaints require at least 50 characters";
    }

    if (form.attachments.length > 5) {
      newErrors.attachments = "Maximum 5 files allowed";
    }

    form.attachments.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        newErrors.attachments = "Each file must be under 5MB";
      }

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "application/pdf"
      ];

      if (!allowedTypes.includes(file.type)) {
        newErrors.attachments =
          "Only images and PDF files are allowed";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =========================
     SUBMIT (CONNECTED TO BACKEND)
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const created = await createComplaint({
        category: form.category,
        location: form.location,
        priority: form.priority,
        description: form.description,
        preferredCallTime: form.preferredCallTime,
        //repeatedIssue: form.repeatedIssue,
        attachments: form.attachments
      });

      toast.success(
        `Complaint ${created.complaintCode || ""} registered successfully`
      );
      navigate("/resident/complaints");

    } catch (error) {
      console.error(error);
      toast.error(error.message ||"Failed to register complaint");
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="page-container">
      <button
        className="primary-btn"
        onClick={() => navigate("/resident/complaints")}
      >
         Back to My Complaints
      </button>
      <br />

      <h1 className="page-title">Raise New Complaint</h1>

      <form className="card" onSubmit={handleSubmit}>
        {/* TITLE 
        <div className="form-section">
          <label>Title</label>
          <input name="title" onChange={handleChange} />
          {errors.title && (
            <p className="error-text">{errors.title}</p>
          )}
        </div>*/}

        {/* CATEGORY */}
        <div className="form-section">
          <label>Category</label>
          <select name="category" onChange={handleChange} value={form.category}>
            <option value="">Select</option>
            <option>Plumbing</option>
            <option>Electrical</option>
            <option>Security</option>
            <option>Other</option>
          </select>

          {errors.category && (
            <p className="error-text">{errors.category}</p>
          )}
        </div>

        {/* LOCATION */}
        <div className="form-section">
          <label>Location</label>
          <input
            name="location"
            placeholder="Bathroom / Kitchen"
            onChange={handleChange}
          />
        </div>

        {/* PRIORITY */}
        <div className="form-section">
          <label>Priority</label>
          <select name="priority" onChange={handleChange}>
            <option>NORMAL</option>
            <option>HIGH</option>
            <option>EMERGENCY</option>
          </select>
        </div>

        {/* DESCRIPTION */}
        <div className="form-section">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            rows="4"
            spellCheck="false"
            onChange={handleChange}
          />
          {errors.description && (
            <p className="error-text">{errors.description}</p>
          )}
        </div>

        {/* CALL TIME */}
        <div className="form-section">
          <label>Preferred Call Time</label>
          <select
            name="preferredCallTime"
            value={form.preferredCallTime}
            onChange={handleChange}
          >
            <option>ANYTIME</option>
            <option>MORNING</option>
            <option>AFTERNOON</option>
            <option>EVENING</option>
          </select>
        </div>

        {/* REPEATED ISSUE 
        <div className="form-section checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="repeatedIssue"
              checked={form.repeatedIssue}
              onChange={handleChange}
            />
            <span>This issue occurred earlier</span>
          </label>
        </div>*/}

        {/* ATTACHMENTS (UI ONLY FOR NOW) */}
        <div className="form-section">
          <label>Attachments</label>
          <input type="file" multiple onChange={handleFileChange} />

          {errors.attachments && (
            <p className="error-text">{errors.attachments}</p>
          )}

          {form.attachments.length > 0 && (
            <div className="attachment-preview-grid">
              {form.attachments.map((file, index) => {
                const isImage = file.type.startsWith("image/");
                const previewUrl = URL.createObjectURL(file);

                return (
                  <div
                    key={index}
                    className="attachment-preview-card"
                  >
                    {isImage ? (
                      <img src={previewUrl} alt={file.name} />
                    ) : (
                      <div className="file-icon">📎</div>
                    )}

                    <p className="file-name">{file.name}</p>

                    <button
                      type="button"
                      className="remove-file"
                      onClick={() => handleRemoveFile(file.name)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button className="primary-btn" type="submit">
          Submit Complaint
        </button>
      </form>
    </div>
  );
};

export default RaiseComplaint;