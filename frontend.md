frontend



resident portal 

C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\frontend\\src\\resident\\complaints



complaintscard.jsx

import React from "react";

import { useNavigate } from "react-router-dom";

import { getSLAStatus } from "./slaUtils";



const ComplaintCard = ({ complaint }) => {

&nbsp; const navigate = useNavigate();



&nbsp; const statusClass =

&nbsp;   complaint.status === "OPEN"

&nbsp;     ? "status-open"

&nbsp;     : complaint.status === "COMPLETED"

&nbsp;     ? "status-resolved"

&nbsp;     : "status-progress";

&nbsp; 

&nbsp; const sla = getSLAStatus(

&nbsp; complaint.sla?.startedAt,

&nbsp; complaint.sla?.hours,

&nbsp; complaint.status,

&nbsp; complaint.resolvedAt,

&nbsp; complaint.sla?.paused

);





&nbsp; return (

&nbsp;   <div className="complaint-card">

&nbsp;     {/\* HEADER \*/}

&nbsp;     <div className="complaint-card-header">

&nbsp;       <div>

&nbsp;         <h3 className="complaint-title">

&nbsp;           #{complaint.id || complaint.complaintCode} . {complaint.description || "Untitled Complaint"}

&nbsp;         </h3>



&nbsp;         <p className="muted-text">

&nbsp;           <strong>Category:</strong> {complaint.category}

&nbsp;         </p>



&nbsp;         <p className="muted-text">

&nbsp;           <strong>Assigned:</strong>{" "}

&nbsp;           {complaint.assignment?.assigned

&nbsp;             ? complaint.assignment.assignedTo

&nbsp;             : "Not Assigned"}

&nbsp;         </p>

&nbsp;         

&nbsp;         <p className="muted-text">

&nbsp;           <strong>Raised:</strong>{" "}

&nbsp;           {new Date(complaint.createdAt).toLocaleString()}

&nbsp;         </p>

&nbsp;       </div>

&nbsp;        

&nbsp;         {complaint.automation \&\& (

&nbsp;         <p className="muted-text">

&nbsp;           <strong>Verification Call:</strong>{" "}

&nbsp;           {complaint.automation.callStatus === "PENDING" \&\& "Pending"}

&nbsp;           {complaint.automation.callStatus === "SCHEDULED" \&\& "Scheduled"}

&nbsp;           {complaint.automation.callStatus === "COMPLETED" \&\& "Completed"}

&nbsp;           {complaint.automation.callStatus === "NO\_RESPONSE" \&\& "No Response"}

&nbsp;         </p>

&nbsp;       )}

&nbsp;       <div className="status-sla-wrapper">

&nbsp;         <span className={`status-pill ${statusClass}`}>

&nbsp;           {complaint.status}

&nbsp;         </span>



&nbsp;         {sla.show \&\& (

&nbsp;           <span className={`sla-pill ${sla.className}`}>

&nbsp;             {sla.label}

&nbsp;           </span>

&nbsp;         )}

&nbsp;       </div>

&nbsp;     </div>





&nbsp;     {/\* FOOTER \*/}

&nbsp;     <div className="complaint-card-footer">

&nbsp;       <button

&nbsp;         className="view-btn"

&nbsp;         onClick={() =>

&nbsp;           navigate(`/resident/complaints/${complaint.id || complaint.\_id}`)

&nbsp;         }

&nbsp;       >

&nbsp;         View Details

&nbsp;       </button>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

};



export default ComplaintCard;



complaintscontext.jsx

import React, { createContext, useContext, useState, useEffect,useCallback } from "react";

import complaintsData from "./dataComplaints"; // demo fallback



const ComplaintsContext = createContext();



export const ComplaintsProvider = ({ children }) => {

&nbsp; const \[complaints, setComplaints] = useState(\[]);

&nbsp; const \[loading, setLoading] = useState(true);



&nbsp; const token = localStorage.getItem("token");



&nbsp; //  FETCH REAL COMPLAINTS FROM BACKEND

&nbsp; const fetchComplaints = useCallback(async () => {

&nbsp;   try {

&nbsp;     const res = await fetch("http://localhost:5000/api/complaints/my", {

&nbsp;       headers: {

&nbsp;         Authorization: `Bearer ${token}`,

&nbsp;       },

&nbsp;     });



&nbsp;     const data = await res.json();



&nbsp;     if (Array.isArray(data)) {

&nbsp;       //  MERGE DEMO + REAL

&nbsp;       setComplaints(\[...data, ...complaintsData]);

&nbsp;     } else {

&nbsp;       setComplaints(complaintsData);

&nbsp;     }

&nbsp;   } catch (err) {

&nbsp;     console.error("Error fetching complaints:", err);

&nbsp;     setComplaints(complaintsData);

&nbsp;   } finally {

&nbsp;     setLoading(false);

&nbsp;   }

&nbsp; },\[token]);



&nbsp; useEffect(() => {

&nbsp;   fetchComplaints();

&nbsp; }, \[fetchComplaints]);



&nbsp; //  CREATE COMPLAINT (REAL BACKEND)

&nbsp; const createComplaint = async (formData) => {

&nbsp;   try {

&nbsp;     const data = new FormData();

&nbsp;       data.append("category", formData.category);

&nbsp;       data.append("location", formData.location);

&nbsp;       data.append("priority", formData.priority);

&nbsp;       data.append("description", formData.description);

&nbsp;       data.append("preferredCallTime", formData.preferredCallTime);

&nbsp;       data.append("repeatedIssue", formData.repeatedIssue);



&nbsp;       // attachments (IMPORTANT)

&nbsp;       if (formData.attachments \&\& formData.attachments.length > 0) {

&nbsp;         formData.attachments.forEach((file) => {

&nbsp;           data.append("attachments", file);

&nbsp;         });

&nbsp;       }

&nbsp;     await fetch("http://localhost:5000/api/complaints", {

&nbsp;       method: "POST",

&nbsp;       headers: {

&nbsp;         // "Content-Type": "application/json",

&nbsp;         Authorization: `Bearer ${token}`,

&nbsp;       },

&nbsp;       body: data,

&nbsp;     });



&nbsp;     fetchComplaints(); // refresh list

&nbsp;   } catch (err) {

&nbsp;     console.error("Create complaint error:", err);

&nbsp;   }

&nbsp; };



&nbsp; //  RESOLVE (ADMIN USE CASE)

&nbsp; const resolveComplaint = async (id) => {

&nbsp;   try {

&nbsp;     await fetch(`http://localhost:5000/api/complaints/${id}/resolve`, {

&nbsp;       method: "PATCH",

&nbsp;       headers: {

&nbsp;         Authorization: `Bearer ${token}`,

&nbsp;       },

&nbsp;     });



&nbsp;     fetchComplaints();

&nbsp;   } catch (err) {

&nbsp;     console.error("Resolve error:", err);

&nbsp;   }

&nbsp; };



&nbsp; //  SUBMIT FEEDBACK (BACKEND)

&nbsp; const submitFeedback = async (id, rating, comment) => {

&nbsp;   try {

&nbsp;     await fetch(`http://localhost:5000/api/complaints/${id}/feedback`, {

&nbsp;       method: "POST",

&nbsp;       headers: {

&nbsp;         "Content-Type": "application/json",

&nbsp;         Authorization: `Bearer ${token}`,

&nbsp;       },

&nbsp;       body: JSON.stringify({ rating, comment }),

&nbsp;     });



&nbsp;     fetchComplaints();

&nbsp;   } catch (err) {

&nbsp;     console.error("Feedback error:", err);

&nbsp;   }

&nbsp; };



&nbsp; return (

&nbsp;   <ComplaintsContext.Provider

&nbsp;     value={{

&nbsp;       complaints,

&nbsp;       loading,

&nbsp;       createComplaint,

&nbsp;       resolveComplaint,

&nbsp;       submitFeedback,

&nbsp;     }}

&nbsp;   >

&nbsp;     {children}

&nbsp;   </ComplaintsContext.Provider>

&nbsp; );

};



export const useComplaints = () => {

&nbsp; return useContext(ComplaintsContext);

};



dataComplaints.js

const complaintsData = \[

&nbsp; {

&nbsp;   id: "C001",



&nbsp;   resident: {

&nbsp;     id: "R01",

&nbsp;     name: "Arjun Malik",

&nbsp;     flat: "A-001",

&nbsp;     phone: "+91XXXXXXXXXX"

&nbsp;   },



&nbsp;   category: "Water Leakage",

&nbsp;   location: "Bathroom",

&nbsp;   priority: "HIGH",

&nbsp;   description: "Leakage in bathroom ceiling",



&nbsp;   status: "OPEN",



&nbsp;   assignment: {

&nbsp;     assigned: false,

&nbsp;     assignedTo: null,

&nbsp;     role: null,

&nbsp;     assignedAt: null

&nbsp;   },



&nbsp;   sla: {

&nbsp;     hours: 48,

&nbsp;     startedAt: "2026-01-03T10:00:00",

&nbsp;     paused: false,

&nbsp;     pausedAt: null,

&nbsp;     breached: false

&nbsp;   },



&nbsp;   automation: {

&nbsp;     callAllowed: true,

&nbsp;     callStatus: "SCHEDULED",

&nbsp;     callAttempts: 1,

&nbsp;     lastCallAt: "2026-01-03T18:00:00",

&nbsp;     nextCallAt: null,

&nbsp;     preferredCallTime: "EVENING",

&nbsp;     repeatedIssue: false,

&nbsp;     linkedComplaintId: null

&nbsp;   },



&nbsp;   attachments: \[],



&nbsp;   timeline: \[

&nbsp;     {

&nbsp;       event: "COMPLAINT\_RAISED",

&nbsp;       actor: "RESIDENT",

&nbsp;       meta: {},

&nbsp;       time: "2026-01-03T10:00:00"

&nbsp;     }

&nbsp;   ],



&nbsp;   feedback: {

&nbsp;     eligible: false,

&nbsp;     submitted: false,

&nbsp;     rating: null,

&nbsp;     comment: null

&nbsp;   },



&nbsp;   createdAt: "2026-01-03T10:00:00",

&nbsp;   resolvedAt: null

&nbsp; },

&nbsp; {

&nbsp;   id: "C002", 



&nbsp;   resident: {

&nbsp;     id: "R01",

&nbsp;     name: "Arjun Malik",

&nbsp;     flat: "A-001",

&nbsp;     phone: "+91XXXXXXXXXX"

&nbsp;   },  

&nbsp;   

&nbsp;   category: "Electrical Fault",

&nbsp;   location: "Living Room",

&nbsp;   priority: "MEDIUM",

&nbsp;   description: "Flickering lights in living room",



&nbsp;   status: "COMPLETED",



&nbsp;   assignment: {

&nbsp;     assigned: true,

&nbsp;     assignedTo: "S01",

&nbsp;     role: "ELECTRICIAN",

&nbsp;     assignedAt: "2026-01-03T12:00:00"

&nbsp;   },



&nbsp;   sla: {

&nbsp;     hours: 72,

&nbsp;     startedAt: "2026-01-03T12:00:00",

&nbsp;     paused: false,

&nbsp;     pausedAt: null,

&nbsp;     breached: false

&nbsp;   },



&nbsp;   automation: {

&nbsp;     callAllowed: true,

&nbsp;     callStatus: "COMPLETED",

&nbsp;     callAttempts: 1,

&nbsp;     lastCallAt: "2026-01-03T18:30:00",

&nbsp;     nextCallAt: null,

&nbsp;     preferredCallTime: "EVENING",

&nbsp;     repeatedIssue: false,

&nbsp;     linkedComplaintId: null

&nbsp;   },



&nbsp;   attachments: \[

&nbsp;     {

&nbsp;       name: "fan.webp",

&nbsp;       type: "image/webp",

&nbsp;       url: "/uploads/fan.webp"

&nbsp;     }

&nbsp;   ],



&nbsp;   timeline: \[

&nbsp;     {

&nbsp;       event: "COMPLAINT\_RAISED",

&nbsp;       actor: "RESIDENT",

&nbsp;       time: "2026-01-03T12:00:00"

&nbsp;     },

&nbsp;     {

&nbsp;       event: "ASSIGNED\_TO\_ELECTRICIAN",

&nbsp;       actor: "ADMIN",

&nbsp;       time: "2026-01-03T14:00:00"

&nbsp;     },

&nbsp;     {

&nbsp;       event: "AUTOMATED\_CALL\_COMPLETED",

&nbsp;       actor: "SYSTEM",

&nbsp;       time: "2026-01-03T18:30:00"

&nbsp;     },

&nbsp;     {

&nbsp;       event: "COMPLAINT\_RESOLVED",

&nbsp;       actor: "ELECTRICIAN",

&nbsp;       time: "2026-01-03T15:30:00"

&nbsp;     }

&nbsp;   ],





&nbsp;   feedback : {

&nbsp;     eligible : true,

&nbsp;     submitted : true,

&nbsp;     rating : 5,

&nbsp;     comment : "The issue was resolved quickly and professionally."

&nbsp;   },



&nbsp;   createdAt:"2026-01-03T12:35:45Z",

&nbsp;   resolvedAt:"2026-01-03T15:30:00Z"

&nbsp; }

];



export default complaintsData;



DetailComplaints.jsx



import React from "react";

import { useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { useComplaints } from "./ComplaintsContext";

import { getSLAStatus } from "./slaUtils";

import toast from "react-hot-toast";



const DetailComplaints = () => {

&nbsp; const { id } = useParams();

&nbsp; const navigate = useNavigate();

&nbsp; const { complaints , submitFeedback } = useComplaints();

&nbsp; const \[rating, setRating] = useState(null);

&nbsp; const \[comment, setComment] = useState("");



&nbsp; if (!Array.isArray(complaints)) {

&nbsp;   return <p className="empty">Loading complaints...</p>;

&nbsp; }



&nbsp; const complaint = complaints.find(c => c.id === id || c.\_id === id);

&nbsp; if (!complaint) return <p className="empty">Complaint not found</p>;



&nbsp; /\* =========================

&nbsp;    SAFE FALLBACKS

&nbsp; ========================= \*/

&nbsp; 

&nbsp; const assignment = complaint.assignment || {};

&nbsp; const automation = complaint.automation || {};

&nbsp; const timeline = Array.isArray(complaint.timeline) ? complaint.timeline : \[];

&nbsp; const attachments = Array.isArray(complaint.attachments)

&nbsp;   ? complaint.attachments

&nbsp;   : \[];

&nbsp; //const feedback = complaint.feedback || {};



&nbsp; const sla = getSLAStatus(

&nbsp;   complaint.sla?.startedAt || complaint.createdAt,

&nbsp;   complaint.sla?.hours || complaint.slaHours || 48,

&nbsp;   complaint.status,

&nbsp;   complaint.resolvedAt,

&nbsp;   complaint.sla?.paused

&nbsp; );

&nbsp; 

&nbsp;





&nbsp; /\* =========================

&nbsp;    HANDLERS

&nbsp; ========================= \*/

&nbsp; const handleFeedbackSubmit = async () => {

&nbsp;   if (rating === null) {

&nbsp;     toast.error("Please select a rating");

&nbsp;     return;

&nbsp;   }

&nbsp;   submitFeedback(id, rating, comment);

&nbsp;     toast.success("Feedback submitted successfully!");

&nbsp;       navigate("/resident/complaints");

&nbsp; };



&nbsp; return (

&nbsp;   <div className="page-container">

&nbsp;     <button

&nbsp;       className="back-btn"

&nbsp;       onClick={() => navigate("/resident/complaints")}

&nbsp;     >

&nbsp;       ← Back to My Complaints

&nbsp;     </button>



&nbsp;     {/\* ===== HEADER ===== \*/}

&nbsp;     <div className="card complaint-header-card">

&nbsp;       <div className="complaint-header-top">

&nbsp;         <div>

&nbsp;           <h1>Complaint #{complaint.id}</h1>

&nbsp;           <p className="complaint-title">

&nbsp;             {complaint.title || complaint.description}

&nbsp;           </p>

&nbsp;         </div>



&nbsp;         <span

&nbsp;           className={`status-pill status-${complaint.status.toLowerCase()}`}

&nbsp;         >

&nbsp;           {complaint.status}

&nbsp;         </span>

&nbsp;       </div>



&nbsp;       <div className="complaint-header-meta">

&nbsp;         <p>

&nbsp;           <strong>Category:</strong> {complaint.category}

&nbsp;         </p>



&nbsp;           <p>

&nbsp;               <strong>Assigned to:</strong>{" "}

&nbsp;               {assignment.assigned

&nbsp;                   ? assignment.name ||

&nbsp;                   `${assignment.role || "Staff"} (${assignment.assignedTo})`

&nbsp;                   : "Not Assigned"}

&nbsp;           </p>





&nbsp;         <span className={`sla-pill ${sla.className}`}>

&nbsp;           {sla.label}

&nbsp;         </span>

&nbsp;       </div>

&nbsp;     </div>



&nbsp;     {/\* 📞 AUTOMATED CALL \*/}

&nbsp;     {automation.callAllowed \&\& (

&nbsp;       <div className="card">

&nbsp;         <h3>📞 Automated Verification Call</h3>

&nbsp;         <p>

&nbsp;           <strong>Status:</strong>{" "}

&nbsp;           {automation.callStatus || "PENDING"}

&nbsp;         </p>

&nbsp;         <p>

&nbsp;           <strong>Attempts:</strong>{" "}

&nbsp;           {automation.callAttempts ?? 0} / 3

&nbsp;         </p>

&nbsp;         <p>

&nbsp;           <strong>Preferred Time:</strong>{" "}

&nbsp;           {automation.preferredCallTime || "ANYTIME"}

&nbsp;         </p>

&nbsp;       </div>

&nbsp;     )}



&nbsp;     {/\* ===== SPLIT VIEW ===== \*/}

&nbsp;     <div className="complaint-split">

&nbsp;       {/\* TIMELINE \*/}

&nbsp;       <div className="card timeline-card">

&nbsp;         <h3>Status Timeline</h3>



&nbsp;         {timeline.length === 0 ? (

&nbsp;           <p className="muted-text">No timeline updates yet</p>

&nbsp;         ) : (

&nbsp;           <ul className="timeline">

&nbsp;             {timeline.map((t, i) => (

&nbsp;               <li key={i} className="timeline-item">

&nbsp;                 <div className="timeline-dot"></div>

&nbsp;                 {i !== timeline.length - 1 \&\& (

&nbsp;                   <div className="timeline-line"></div>

&nbsp;                 )}

&nbsp;                 <div className="timeline-content">

&nbsp;                   <strong>{t.event || t.action}</strong>{" "}

&nbsp;                   {t.actor \&\& <>— {t.actor}</>}

&nbsp;                   <span className="timeline-time">

&nbsp;                     {t.time

&nbsp;                       ? new Date(t.time).toLocaleString()

&nbsp;                       : ""}

&nbsp;                   </span>

&nbsp;                 </div>

&nbsp;               </li>

&nbsp;             ))}

&nbsp;           </ul>

&nbsp;         )}

&nbsp;       </div>



&nbsp;       {/\* ATTACHMENTS \*/}

&nbsp;       <div className="card attachment-card">

&nbsp;         <h3>Attachments</h3>



&nbsp;         {attachments.length === 0 ? (

&nbsp;           <p className="muted-text">No attachments</p>

&nbsp;         ) : (

&nbsp;           attachments.map((a, i) => {

&nbsp;             const url =

&nbsp;               typeof a === "string"

&nbsp;                 ? `http://localhost:5000/uploads/${a}`

&nbsp;                 : `http://localhost:5000/uploads/${a.url || a.filename || a.name}`;



&nbsp;             return (

&nbsp;               <div key={i} className="attachment-item">

&nbsp;                 <a href={url} target="\_blank" rel="noreferrer">

&nbsp;                   <img

&nbsp;                     src={url}

&nbsp;                     alt={a.name || "attachment"}

&nbsp;                     className="attachment-preview"

&nbsp;                   />

&nbsp;                   <div className="attachment-name">

&nbsp;                     {a.name || "Attachment"}

&nbsp;                   </div>

&nbsp;                 </a>

&nbsp;               </div>

&nbsp;             );

&nbsp;           })

&nbsp;         )}

&nbsp;       </div>

&nbsp;     </div>



&nbsp;     {/\* ===== FEEDBACK ===== \*/}

&nbsp;     {complaint.feedback?.eligible \&\& (

&nbsp;       <div className="card feedback-card">

&nbsp;               <h3 className="feedback-title">Rate Your Experience</h3>

&nbsp;               <p className="feedback-subtitle">

&nbsp;               Your feedback helps us improve maintenance services.

&nbsp;               </p>



&nbsp;               <div className="feedback-form">

&nbsp;               {/\* Rating \*/}

&nbsp;               <div className="feedback-field">

&nbsp;                   <label>Rating</label>

&nbsp;                   <select

&nbsp;                   value={rating ?? ""}

&nbsp;                   onChange={(e) => setRating(Number(e.target.value))}

&nbsp;                   >

&nbsp;                   <option value="" disabled>Select rating</option>

&nbsp;                   <option value="5">⭐⭐⭐⭐⭐ Excellent</option>

&nbsp;                   <option value="4">⭐⭐⭐⭐ Good</option>

&nbsp;                   <option value="3">⭐⭐⭐ Average</option>

&nbsp;                   <option value="2">⭐⭐ Poor</option>

&nbsp;                   <option value="1">⭐ Very Bad</option>

&nbsp;                   </select>

&nbsp;               </div>



&nbsp;               {/\* Comment \*/}

&nbsp;               <div className="feedback-field">

&nbsp;                   <label>Comments (optional)</label>

&nbsp;                   <textarea

&nbsp;                   rows="4"

&nbsp;                   placeholder="Share your experience..."

&nbsp;                   value={comment}

&nbsp;                   onChange={(e) => setComment(e.target.value)}

&nbsp;                   />

&nbsp;               </div>



&nbsp;               {/\* Submit \*/}

&nbsp;               <div className="feedback-actions">

&nbsp;                   <button

&nbsp;                   className="primary-btn"

&nbsp;                   onClick={handleFeedbackSubmit}

&nbsp;                   >

&nbsp;                   Submit Feedback

&nbsp;                   </button>

&nbsp;               </div>

&nbsp;               </div>

&nbsp;           </div>

&nbsp;           )}

&nbsp;        </div>

&nbsp;       );

&nbsp;   };



export default DetailComplaints;



raisecomplaints.jsx



import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { useComplaints } from "./ComplaintsContext";



const RaiseComplaint = () => {

&nbsp; const navigate = useNavigate();

&nbsp; const { createComplaint } = useComplaints();



&nbsp; /\* =========================

&nbsp;    STATE

&nbsp; ========================= \*/



&nbsp; const \[form, setForm] = useState({

&nbsp;   title: "",

&nbsp;   category: "",

&nbsp;   location: "",

&nbsp;   priority: "NORMAL",

&nbsp;   description: "",

&nbsp;   attachments: \[],

&nbsp;   preferredCallTime: "ANYTIME",

&nbsp;   repeatedIssue: false

&nbsp; });



&nbsp; const \[errors, setErrors] = useState({});



&nbsp; /\* =========================

&nbsp;    HANDLERS

&nbsp; ========================= \*/



&nbsp; const handleChange = (e) => {

&nbsp;   const { name, value, type, checked } = e.target;

&nbsp;   setForm((prev) => ({

&nbsp;     ...prev,

&nbsp;     \[name]: type === "checkbox" ? checked : value

&nbsp;   }));

&nbsp; };



&nbsp; const handleFileChange = (e) => {

&nbsp;   const files = Array.from(e.target.files);

&nbsp;   setForm((prev) => ({

&nbsp;     ...prev,

&nbsp;     attachments: \[...prev.attachments, ...files]

&nbsp;   }));

&nbsp; };



&nbsp; const handleRemoveFile = (fileName) => {

&nbsp;   setForm((prev) => ({

&nbsp;     ...prev,

&nbsp;     attachments: prev.attachments.filter(

&nbsp;       (file) => file.name !== fileName

&nbsp;     )

&nbsp;   }));

&nbsp; };



&nbsp; /\* =========================

&nbsp;    VALIDATION

&nbsp; ========================= \*/



&nbsp; const validate = () => {

&nbsp;   const newErrors = {};



&nbsp;   if (form.title.trim().length < 5) {

&nbsp;     newErrors.title = "Title must be at least 5 characters";

&nbsp;   }



&nbsp;   if (form.description.trim().length < 20) {

&nbsp;     newErrors.description = "Description must be at least 20 characters";

&nbsp;   }



&nbsp;   if (

&nbsp;     form.priority === "EMERGENCY" \&\&

&nbsp;     form.description.trim().length < 50

&nbsp;   ) {

&nbsp;     newErrors.description =

&nbsp;       "Emergency complaints require at least 50 characters";

&nbsp;   }



&nbsp;   if (form.attachments.length > 5) {

&nbsp;     newErrors.attachments = "Maximum 5 files allowed";

&nbsp;   }



&nbsp;   form.attachments.forEach((file) => {

&nbsp;     if (file.size > 5 \* 1024 \* 1024) {

&nbsp;       newErrors.attachments = "Each file must be under 5MB";

&nbsp;     }



&nbsp;     const allowedTypes = \[

&nbsp;       "image/png",

&nbsp;       "image/jpeg",

&nbsp;       "image/jpg",

&nbsp;       "image/webp",

&nbsp;       "application/pdf"

&nbsp;     ];



&nbsp;     if (!allowedTypes.includes(file.type)) {

&nbsp;       newErrors.attachments =

&nbsp;         "Only images and PDF files are allowed";

&nbsp;     }

&nbsp;   });



&nbsp;   setErrors(newErrors);

&nbsp;   return Object.keys(newErrors).length === 0;

&nbsp; };



&nbsp; /\* =========================

&nbsp;    SUBMIT (CONNECTED TO BACKEND)

&nbsp; ========================= \*/



&nbsp; const handleSubmit = async (e) => {

&nbsp;   e.preventDefault();



&nbsp;   if (!validate()) return;



&nbsp;   try {

&nbsp;     await createComplaint({

&nbsp;       category: form.category,

&nbsp;       location: form.location,

&nbsp;       priority: form.priority,

&nbsp;       description: form.description,

&nbsp;       preferredCallTime: form.preferredCallTime,

&nbsp;       repeatedIssue: form.repeatedIssue,

&nbsp;       attachments: form.attachments

&nbsp;     });



&nbsp;     toast.success("Complaint registered successfully");

&nbsp;     navigate("/resident/complaints");



&nbsp;   } catch (error) {

&nbsp;     console.error(error);

&nbsp;     toast.error("Failed to register complaint");

&nbsp;   }

&nbsp; };



&nbsp; /\* =========================

&nbsp;    UI

&nbsp; ========================= \*/



&nbsp; return (

&nbsp;   <div className="page-container">

&nbsp;     <button

&nbsp;       className="primary-btn"

&nbsp;       onClick={() => navigate("/resident/complaints")}

&nbsp;     >

&nbsp;       ← Back to My Complaints

&nbsp;     </button>



&nbsp;     <h1 className="page-title">Raise New Complaint</h1>



&nbsp;     <form className="card" onSubmit={handleSubmit}>

&nbsp;       {/\* TITLE \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Title</label>

&nbsp;         <input name="title" onChange={handleChange} />

&nbsp;         {errors.title \&\& (

&nbsp;           <p className="error-text">{errors.title}</p>

&nbsp;         )}

&nbsp;       </div>



&nbsp;       {/\* CATEGORY \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Category</label>

&nbsp;         <select name="category" onChange={handleChange}>

&nbsp;           <option value="">Select</option>

&nbsp;           <option>Plumbing</option>

&nbsp;           <option>Electrical</option>

&nbsp;           <option>Security</option>

&nbsp;           <option>Other</option>

&nbsp;         </select>

&nbsp;       </div>



&nbsp;       {/\* LOCATION \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Location</label>

&nbsp;         <input

&nbsp;           name="location"

&nbsp;           placeholder="Bathroom / Kitchen"

&nbsp;           onChange={handleChange}

&nbsp;         />

&nbsp;       </div>



&nbsp;       {/\* PRIORITY \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Priority</label>

&nbsp;         <select name="priority" onChange={handleChange}>

&nbsp;           <option>NORMAL</option>

&nbsp;           <option>HIGH</option>

&nbsp;           <option>EMERGENCY</option>

&nbsp;         </select>

&nbsp;       </div>



&nbsp;       {/\* DESCRIPTION \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Description</label>

&nbsp;         <textarea

&nbsp;           name="description"

&nbsp;           rows="4"

&nbsp;           spellCheck="false"

&nbsp;           onChange={handleChange}

&nbsp;         />

&nbsp;         {errors.description \&\& (

&nbsp;           <p className="error-text">{errors.description}</p>

&nbsp;         )}

&nbsp;       </div>



&nbsp;       {/\* CALL TIME \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Preferred Call Time</label>

&nbsp;         <select

&nbsp;           name="preferredCallTime"

&nbsp;           onChange={handleChange}

&nbsp;         >

&nbsp;           <option>ANYTIME</option>

&nbsp;           <option>MORNING</option>

&nbsp;           <option>AFTERNOON</option>

&nbsp;           <option>EVENING</option>

&nbsp;         </select>

&nbsp;       </div>



&nbsp;       {/\* REPEATED ISSUE \*/}

&nbsp;       <div className="form-section checkbox-row">

&nbsp;         <label className="checkbox-label">

&nbsp;           <input

&nbsp;             type="checkbox"

&nbsp;             name="repeatedIssue"

&nbsp;             checked={form.repeatedIssue}

&nbsp;             onChange={handleChange}

&nbsp;           />

&nbsp;           <span>This issue occurred earlier</span>

&nbsp;         </label>

&nbsp;       </div>



&nbsp;       {/\* ATTACHMENTS (UI ONLY FOR NOW) \*/}

&nbsp;       <div className="form-section">

&nbsp;         <label>Attachments</label>

&nbsp;         <input type="file" multiple onChange={handleFileChange} />



&nbsp;         {errors.attachments \&\& (

&nbsp;           <p className="error-text">{errors.attachments}</p>

&nbsp;         )}



&nbsp;         {form.attachments.length > 0 \&\& (

&nbsp;           <div className="attachment-preview-grid">

&nbsp;             {form.attachments.map((file, index) => {

&nbsp;               const isImage = file.type.startsWith("image/");

&nbsp;               const previewUrl = URL.createObjectURL(file);



&nbsp;               return (

&nbsp;                 <div

&nbsp;                   key={index}

&nbsp;                   className="attachment-preview-card"

&nbsp;                 >

&nbsp;                   {isImage ? (

&nbsp;                     <img src={previewUrl} alt={file.name} />

&nbsp;                   ) : (

&nbsp;                     <div className="file-icon">📎</div>

&nbsp;                   )}



&nbsp;                   <p className="file-name">{file.name}</p>



&nbsp;                   <button

&nbsp;                     type="button"

&nbsp;                     className="remove-file"

&nbsp;                     onClick={() => handleRemoveFile(file.name)}

&nbsp;                   >

&nbsp;                     ✕

&nbsp;                   </button>

&nbsp;                 </div>

&nbsp;               );

&nbsp;             })}

&nbsp;           </div>

&nbsp;         )}

&nbsp;       </div>



&nbsp;       <button className="primary-btn">

&nbsp;         Submit Complaint

&nbsp;       </button>

&nbsp;     </form>

&nbsp;   </div>

&nbsp; );

};



export default RaiseComplaint;



ReasidentComplaints.jsx

import React from "react";

import { useNavigate } from "react-router-dom";

import { useComplaints } from "./ComplaintsContext";

import ComplaintCard from "./ComplaintCard";



const ResidentComplaints = () => {

&nbsp; const navigate = useNavigate();

&nbsp; const { complaints } = useComplaints();



&nbsp; return (

&nbsp;   <div className="page-container">

&nbsp;     <div className="page-header">

&nbsp;       <h1 className="page-title">My Complaints</h1>



&nbsp;       <button

&nbsp;         className="primary-btn"

&nbsp;         onClick={() => navigate("/resident/complaints/raise")}

&nbsp;       >

&nbsp;         + Raise Complaint

&nbsp;       </button>

&nbsp;     </div>



&nbsp;     {complaints.length === 0 ? (

&nbsp;       <p className="empty">No complaints raised yet.</p>

&nbsp;     ) : (

&nbsp;       complaints.map((complaint) => (

&nbsp;         <ComplaintCard

&nbsp;           key={complaint.id}

&nbsp;           complaint={complaint}

&nbsp;         />

&nbsp;       ))

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

};



export default ResidentComplaints;



slaUtils.js

export const getSLAStatus = (

&nbsp; startedAt,

&nbsp; slaHours,

&nbsp; status,

&nbsp; resolvedAt,

&nbsp; paused = false

) => {

&nbsp; if (!startedAt || !slaHours) {

&nbsp;   return {

&nbsp;     label: "SLA Not Started",

&nbsp;     className: "sla-warning",

&nbsp;     show: false

&nbsp;   };

&nbsp; }



&nbsp; if(paused) {

&nbsp;   return {

&nbsp;     label: "SLA Paused",

&nbsp;     className: "sla-warning",

&nbsp;     show: true

&nbsp;   };

&nbsp; }



&nbsp; const startTime = new Date(startedAt).getTime();

&nbsp; const slaMs = slaHours \* 60 \* 60 \* 1000;



&nbsp; const comparisonTime =

&nbsp;   status === "COMPLETED" \&\& resolvedAt

&nbsp;     ? new Date(resolvedAt).getTime()

&nbsp;     : Date.now();



&nbsp; const elapsed = comparisonTime - startTime;

&nbsp; const remainingMs = slaMs - elapsed;



&nbsp; // SLA BREACHED

&nbsp; if (remainingMs <= 0) {

&nbsp;   return {

&nbsp;     label: "SLA Breached",

&nbsp;     className: "sla-breached",

&nbsp;     show: true

&nbsp;   };

&nbsp; }



&nbsp; // COMPLETED WITHIN SLA

&nbsp; if (status === "COMPLETED") {

&nbsp;   return {

&nbsp;     label: "Resolved within SLA",

&nbsp;     className: "sla-safe",

&nbsp;     show: true

&nbsp;   };

&nbsp; }



&nbsp; const remainingHours = Math.ceil(remainingMs / (60 \* 60 \* 1000));



&nbsp; return {

&nbsp;   label: `${remainingHours}h remaining`,

&nbsp;   className: remainingHours <= 6 ? "sla-warning" : "sla-safe",

&nbsp;   show: true

&nbsp; };

};



emergencyActions.jsx

import React from "react";



const EmergencyActions = ({ onTrigger }) => {

&nbsp; const actions = \[

&nbsp;   { type: "SOS", label: "SOS", className: "danger" },

&nbsp;   { type: "MEDICAL", label: "Medical", className: "warning" },

&nbsp;   { type: "SUSPICIOUS", label: "Suspicious", className: "info" },

&nbsp;   { type: "FIRE", label: "Fire", className: "danger" },

&nbsp; ];

&nbsp; 

&nbsp;  



&nbsp; return (

&nbsp;   <div className="card emergency-card">

&nbsp;     <h3>Emergency Actions</h3>



&nbsp;     <div className="emergency-grid">

&nbsp;       {actions.map((a) => (

&nbsp;         <button

&nbsp;           key={a.type}

&nbsp;           className={`emergency-btn ${a.className}`}

&nbsp;           onClick={() => onTrigger(a.type)}

&nbsp;         >

&nbsp;           <span className="icon">{a.icon}</span>

&nbsp;           <span>{a.label}</span>

&nbsp;         </button>

&nbsp;       ))}

&nbsp;     </div>



&nbsp;     <p className="muted-text small">

&nbsp;       Use only in case of real emergencies. Security will be notified immediately.

&nbsp;     </p>

&nbsp;       



&nbsp;   </div>

&nbsp; );

};



export default EmergencyActions;



EmergencyModal.jsx

import React, { useState } from "react";

//import societyConfig from "../securityPortal/components/societyConfig";





const EmergencyModal = ({ type, societyContacts, onClose, onSubmit }) => {

&nbsp;   

&nbsp; const \[description, setDescription] = useState("");



&nbsp; if(!societyContacts) return null; //safety check in case config is missing



&nbsp; const handleSubmit = () => {

&nbsp;   if (!description.trim()) {

&nbsp;     alert("Please describe the emergency.");

&nbsp;     return;

&nbsp;   }

&nbsp;   onSubmit(description);

&nbsp; };



&nbsp; return (

&nbsp;   <div className="modal-backdrop">

&nbsp;     <div className="modal">

&nbsp;       <h2>🚨 {type} Emergency</h2>

&nbsp;       <br />



&nbsp;       <textarea

&nbsp;         placeholder="Describe the emergency situation..."

&nbsp;         value={description}

&nbsp;         onChange={(e) => setDescription(e.target.value)}

&nbsp;       />



&nbsp;       <div className="emergency-contacts">

&nbsp;         <h4>Emergency Numbers</h4>

&nbsp;          <p>Society Security: {societyContacts.security}</p>

&nbsp;             {(type === "SOS" || type === "SUSPICIOUS") \&\& (

&nbsp;               <p>Police: {societyContacts.police}</p>

&nbsp;             )}

&nbsp;             {(type === "MEDICAL") \&\& (

&nbsp;               <p>Ambulance: {societyContacts.ambulance}</p>

&nbsp;             )}

&nbsp;             {(type === "FIRE") \&\& (

&nbsp;               <p>Fire: {societyContacts.fire}</p>

&nbsp;             )}

&nbsp;       </div>



&nbsp;       <div className="modal-actions">

&nbsp;         <button className="danger" onClick={handleSubmit}>

&nbsp;           Submit \& Alert Security

&nbsp;         </button>

&nbsp;         <button onClick={onClose}>Cancel</button>

&nbsp;       </div>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

};



export default EmergencyModal;



ResidentAnnouncements.jsx

import React, { useEffect, useState } from "react";

import announcementsData from "../admin/data/announcementsData"; // fallback



const ResidentAnnouncements = () => {

&nbsp; const \[announcements, setAnnouncements] = useState(\[]);



&nbsp; useEffect(() => {

&nbsp;   const fetchAnnouncements = async () => {

&nbsp;     try {

&nbsp;       const token = localStorage.getItem("token");



&nbsp;       const res = await fetch("http://localhost:5000/api/announcements", {

&nbsp;         headers: {

&nbsp;           Authorization: `Bearer ${token}`,

&nbsp;         },

&nbsp;       });



&nbsp;       if (!res.ok) throw new Error("Backend failed");



&nbsp;       const data = await res.json();



&nbsp;       if (Array.isArray(data) \&\& data.length > 0) {

&nbsp;         setAnnouncements(data);

&nbsp;       } else {

&nbsp;         setAnnouncements(announcementsData); // fallback

&nbsp;       }

&nbsp;     } catch (error) {

&nbsp;       console.log("Using static fallback announcements");

&nbsp;       setAnnouncements(announcementsData);

&nbsp;     }

&nbsp;   };



&nbsp;   fetchAnnouncements();

&nbsp; }, \[]);



&nbsp; const priorityOrder = {

&nbsp;   Emergency: 1,

&nbsp;   Important: 2,

&nbsp;   Normal: 3,

&nbsp; };



&nbsp; const sortedAnnouncements = \[...announcements].sort(

&nbsp;   (a, b) => priorityOrder\[a.priority] - priorityOrder\[b.priority]

&nbsp; );



&nbsp; return (

&nbsp;   <div className="page-container">

&nbsp;     <h1 className="page-title">Announcements</h1>



&nbsp;     {sortedAnnouncements.length === 0 ? (

&nbsp;       <div className="card muted-text">

&nbsp;         No announcements available

&nbsp;       </div>

&nbsp;     ) : (

&nbsp;       sortedAnnouncements.map((a) => (

&nbsp;         <div key={a.\_id || a.id} className="card announcement-card">

&nbsp;           <h3>{a.title}</h3>

&nbsp;           <p>{a.message}</p>



&nbsp;           <div className="announcement-footer">

&nbsp;             <span className="muted-text">

&nbsp;               {a.createdAt

&nbsp;                 ? new Date(a.createdAt).toLocaleDateString()

&nbsp;                 : a.date}

&nbsp;             </span>



&nbsp;             {a.priority \&\& (

&nbsp;               <span

&nbsp;                 className={`priority-pill priority-${a.priority.toLowerCase()}`}

&nbsp;               >

&nbsp;                 {a.priority}

&nbsp;               </span>

&nbsp;             )}

&nbsp;           </div>

&nbsp;         </div>

&nbsp;       ))

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

};



export default ResidentAnnouncements;



residentdashboard.jsx

import React from "react";

import { useEffect } from "react";

import EmergencyActions from "./EmergencyActions";

//import emergencyLogsData from "../admin/data/emergencyLogsData";

import toast from "react-hot-toast";

import announcementsData from "../admin/data/announcementsData";

import VisitorInviteModal from "./VisitorInviteModal";

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import EmergencyModal from "./EmergencyModal";

import societyConfig from "../securityPortal/components/societyConfig";

//import { addEmergency } from "../admin/data/emergencyStore";

import { useComplaints } from "./complaints/ComplaintsContext.jsx";



const ResidentDashboard = () => {



&nbsp;const navigate = useNavigate();

&nbsp;const\[resident, setResident] = useState(null);

&nbsp;const \[showInvite, setShowInvite] = useState(false);

&nbsp;const \[myVisitors, setMyVisitors] = useState(\[]);



&nbsp;const { complaints } = useComplaints();  

&nbsp; const today = new Date().toDateString();



&nbsp; const todaysVisitors = myVisitors.filter(

&nbsp;   v => new Date(v.visitDate).toDateString() === today

&nbsp; );



&nbsp; 



&nbsp; useEffect(() => {

&nbsp;   fetchResident();

&nbsp; fetchMyVisitors();

&nbsp; fetchLatestAnnouncement();

&nbsp; }, \[]);



&nbsp; const fetchMyVisitors = async () => {

&nbsp;   try {

&nbsp;     const res = await fetch("http://localhost:5000/api/visitors/my-visitors", {

&nbsp;       headers: {

&nbsp;         Authorization: `Bearer ${localStorage.getItem("token")}`

&nbsp;       }

&nbsp;     });



&nbsp;     const data = await res.json();



&nbsp;     if (!res.ok) {

&nbsp;       console.error(data.message);

&nbsp;       return;

&nbsp;     }



&nbsp;     setMyVisitors(data);



&nbsp;   } catch (error) {

&nbsp;     console.error("Failed to fetch visitors", error);

&nbsp;   }

&nbsp; };



&nbsp; const fetchResident = async () => {

&nbsp;   try {

&nbsp;     const res = await fetch("http://localhost:5000/api/resident/me", {

&nbsp;       headers: {

&nbsp;         Authorization: `Bearer ${localStorage.getItem("token")}`

&nbsp;       }

&nbsp;     });



&nbsp;     const data = await res.json();



&nbsp;     if (!res.ok) {

&nbsp;       console.error(data.message);

&nbsp;       return;

&nbsp;     }



&nbsp;     setResident(data);



&nbsp;   } catch (error) {

&nbsp;     console.error("Failed to fetch resident profile", error);

&nbsp;   }

&nbsp; };



&nbsp;const\[latestAnnouncement, setLatestAnnouncement] = useState(null);

&nbsp;const fetchLatestAnnouncement = async () => {

&nbsp;   try {

&nbsp;     const res = await fetch("http://localhost:5000/api/announcements", {

&nbsp;       headers: {

&nbsp;         Authorization: `Bearer ${localStorage.getItem("token")}`

&nbsp;       }

&nbsp;     });



&nbsp;     const data = await res.json();



&nbsp;      if (Array.isArray(data) \&\& data.length > 0) {

&nbsp;     setLatestAnnouncement(data\[0]);

&nbsp;     } else {

&nbsp;       // fallback to static

&nbsp;       setLatestAnnouncement(announcementsData\[0]);

&nbsp;     }



&nbsp;   } catch (error) {

&nbsp;     console.error("Failed to fetch announcements", error);

&nbsp;   }

&nbsp;   setLatestAnnouncement(announcementsData\[0]);

&nbsp; };

// if (latestAnnouncement) {

&nbsp; // console.log("Latest Announcement:", latestAnnouncement.title);

&nbsp;//}

&nbsp;const \[activeEmergency, setActiveEmergency] = useState(null);

&nbsp;const society = resident ? societyConfig\[resident.societyId] : null;

&nbsp;const societyContacts = society

? {

&nbsp;  security: society.securityNumber,

&nbsp;  police: society.emergencyNumbers.police,

&nbsp;  ambulance: society.emergencyNumbers.ambulance,

&nbsp;  fire: society.emergencyNumbers.fire,

&nbsp;}

&nbsp;:null;



&nbsp;const handleEmergency = (type) => {

&nbsp; setActiveEmergency(type); // open modal

};



const submitEmergency = async (description) => {

&nbsp; try {

&nbsp;   const res = await fetch("http://localhost:5000/api/emergencies", {

&nbsp;     method: "POST",

&nbsp;     headers: {

&nbsp;       "Content-Type": "application/json",

&nbsp;       Authorization: `Bearer ${localStorage.getItem("token")}`

&nbsp;     },

&nbsp;     body: JSON.stringify({

&nbsp;       type: activeEmergency,

&nbsp;       description

&nbsp;     })

&nbsp;   });



&nbsp;   const data = await res.json();



&nbsp;   if (!res.ok) {

&nbsp;     toast.error(data.message || "Failed to send emergency");

&nbsp;     return;

&nbsp;   }



&nbsp;   toast.success(` ${activeEmergency} alert sent to security`);



&nbsp;   setActiveEmergency(null); // close modal



&nbsp; } catch (error) {

&nbsp;   console.error(error);

&nbsp;   toast.error("Server error");

&nbsp; }

&nbsp; 

};

const openComplaints =

&nbsp; complaints?.filter(c => c.status === "OPEN").length || 0;



const resolvedComplaints =

&nbsp; complaints?.filter(c => c.status === "COMPLETED").length || 0;

&nbsp;





&nbsp;return (

&nbsp;  <div className="page-container">

&nbsp;   {resident \&\& (

&nbsp;     <>

&nbsp;    <h1 className="page-title">Welcome, {resident.name}</h1>

&nbsp;    <p className="muted-text">

&nbsp;      Flat: {resident.flat} · Role: {resident.role}

&nbsp;    </p>

&nbsp;    </>  

&nbsp;   )}



&nbsp;    <br /> 



&nbsp;  {/\* 🔴 EMERGENCY FIRST \*/}

&nbsp;   <EmergencyActions onTrigger={handleEmergency} />

&nbsp;    {activeEmergency \&\& societyContacts \&\& (

&nbsp;      <EmergencyModal

&nbsp;        type={activeEmergency}

&nbsp;        societyContacts={societyContacts}

&nbsp;        onClose={() => setActiveEmergency(null)}

&nbsp;        onSubmit={submitEmergency}

&nbsp;      />

&nbsp;    )}

&nbsp;    

&nbsp;    

&nbsp;    <br />





&nbsp;    <div className="quick-actions">

&nbsp;      <button className="qa-btn danger" onClick={() => toast.error("🚨 Calling Security...")}>Call Security</button>

&nbsp;      <button className="qa-btn neutral" onClick={() => setShowInvite(true)}>Invite Visitor</button>

&nbsp;      <button className="qa-btn secondary" onClick={() => navigate("/resident/complaints/raise")}>Raise Complaint</button>

&nbsp;    </div>

&nbsp;    

&nbsp;    

&nbsp;    <br />

&nbsp;    



&nbsp;    {/\* KPIs \*/}

&nbsp;    <div className="kpi-grid">

&nbsp;      <div className="kpi-card">

&nbsp;        My Complaints

&nbsp;       <strong>

&nbsp;         {openComplaints} Open / {resolvedComplaints} Resolved

&nbsp;       </strong>

&nbsp;      </div>



&nbsp;      <div className="kpi-card warning">

&nbsp;        Latest Announcement

&nbsp;        <strong>{latestAnnouncement?.title || "None"}</strong>

&nbsp;      </div>



&nbsp;      <div className={`kpi-card ${resident?.maintenanceStatus === "Pending" ? "danger" : "success"}`}>

&nbsp;        Maintenance Status

&nbsp;        <strong>{resident?.maintenanceStatus}</strong>

&nbsp;      </div>



&nbsp;        {/\* NEW VISITOR STATS \*/}



&nbsp;       <div className="kpi-card">

&nbsp;         Visitors Today

&nbsp;         <strong>{todaysVisitors.length}</strong>

&nbsp;       </div>

&nbsp;    </div>

&nbsp;    <br />

&nbsp;   <h2>My Visitors</h2>

&nbsp;   

&nbsp;   <br />



&nbsp;   {myVisitors.length === 0 ? (

&nbsp;     <p className="muted-text">No visitors yet.</p>

&nbsp;   ) : (

&nbsp;     <div className="visitor-list">

&nbsp;       {myVisitors.map((visitor) => (

&nbsp;         <div key={visitor.\_id} className="visitor-row">

&nbsp;           <h4>{visitor.visitorName}</h4>

&nbsp;           <p>

&nbsp;             Visit Date: {new Date(visitor.visitDate).toLocaleDateString()}

&nbsp;           </p>



&nbsp;           <p>Status: {visitor.status}</p>



&nbsp;           <p>Invite Code: {visitor.inviteCode}</p>



&nbsp;           {visitor.checkInTime \&\& (

&nbsp;             <p>

&nbsp;               Entered at {new Date(visitor.checkInTime).toLocaleTimeString()}

&nbsp;             </p>

&nbsp;           )}



&nbsp;           {visitor.checkOutTime \&\& (

&nbsp;             <p>

&nbsp;               Exited at {new Date(visitor.checkOutTime).toLocaleTimeString()}

&nbsp;             </p>

&nbsp;           )}

&nbsp;         </div>

&nbsp;       ))} 

&nbsp;     </div>

&nbsp;   )}



&nbsp; {showInvite \&\& (<VisitorInviteModal  onClose={() => setShowInvite(false)} onCreated={fetchMyVisitors} />)}   </div>



&nbsp;);

};



export default ResidentDashboard;



residentLayout.jsx

import React from "react";

import { NavLink, Outlet, useNavigate } from "react-router-dom";

import "../styles/admin.css";

//import { ComplaintsProvider } from "./complaints/ComplaintsContext";

import { useAuth } from "../auth/AuthContext";



const ResidentLayout = () => {

&nbsp; const navigate = useNavigate();

&nbsp; const {setAuth} =useAuth();



&nbsp; const handleLogout = () => {

&nbsp;   localStorage.removeItem("token");

&nbsp;   localStorage.removeItem("role");

&nbsp;   localStorage.removeItem("isAuth");



&nbsp;   setAuth({

&nbsp;     isAuth: false,

&nbsp;     role: null,

&nbsp;     token: null,

&nbsp;   });



&nbsp;   navigate("/login");

&nbsp; };







&nbsp; return (

&nbsp;   <div className="admin-layout">

&nbsp;     {/\* SIDEBAR \*/}

&nbsp;     <aside className="admin-sidebar">

&nbsp;       <h2 className="admin-logo">CIVARA</h2>



&nbsp;       <nav className="admin-nav">

&nbsp;         <NavLink

&nbsp;           to="/resident/dashboard"

&nbsp;           className={({ isActive }) =>

&nbsp;             isActive ? "admin-link active-link" : "admin-link"

&nbsp;           }

&nbsp;         >

&nbsp;           Dashboard

&nbsp;         </NavLink>



&nbsp;         <NavLink

&nbsp;           to="/resident/announcements"

&nbsp;           className={({ isActive }) =>

&nbsp;             isActive ? "admin-link active-link" : "admin-link"

&nbsp;           }

&nbsp;         >

&nbsp;           Announcements

&nbsp;         </NavLink>



&nbsp;         <NavLink

&nbsp;           to="/resident/complaints"

&nbsp;           className={({ isActive }) =>

&nbsp;             isActive ? "admin-link active-link" : "admin-link"

&nbsp;           }

&nbsp;         >

&nbsp;           Complaints

&nbsp;         </NavLink>



&nbsp;         <NavLink

&nbsp;           to="/resident/profile"

&nbsp;           className={({ isActive }) =>

&nbsp;             isActive ? "admin-link active-link" : "admin-link"

&nbsp;           }

&nbsp;         >

&nbsp;           My Profile

&nbsp;         </NavLink>

&nbsp;       </nav>



&nbsp;       <div className="admin-footer">

&nbsp;         <button onClick={handleLogout}>

&nbsp;           Logout

&nbsp;         </button>

&nbsp;       </div>

&nbsp;     </aside>



&nbsp;     {/\* CONTENT \*/}

&nbsp;     <main className="admin-content">

&nbsp;        <Outlet />

&nbsp;     </main>

&nbsp;   </div>

&nbsp; );

};



export default ResidentLayout;



rsidentprofile.jsx

import React, { useEffect, useState } from "react";

import toast from "react-hot-toast";



const ResidentProfile = () => {

&nbsp; const \[resident, setResident] = useState(null);

&nbsp; const \[neighbours, setNeighbours] = useState(\[]);

&nbsp; const \[profilePic, setProfilePic] = useState(null);



&nbsp; const \[currentPassword, setCurrentPassword] = useState("");

&nbsp; const \[newPassword, setNewPassword] = useState("");

&nbsp; const \[confirmPassword, setConfirmPassword] = useState("");



&nbsp; const token = localStorage.getItem("token");



&nbsp; /\* ================= FETCH PROFILE ================= \*/

&nbsp; useEffect(() => {

&nbsp;   const fetchProfile = async () => {

&nbsp;     try {

&nbsp;       const res = await fetch(

&nbsp;         "http://localhost:5000/api/resident/me",

&nbsp;         {

&nbsp;           headers: { Authorization: `Bearer ${token}` }

&nbsp;         }

&nbsp;       );

&nbsp;       const data = await res.json();

&nbsp;       setResident(data);

&nbsp;     } catch {

&nbsp;       toast.error("Failed to load profile");

&nbsp;     }

&nbsp;   };



&nbsp;   const fetchNeighbours = async () => {

&nbsp;     try {

&nbsp;       const res = await fetch(

&nbsp;         "http://localhost:5000/api/resident/neighbours",

&nbsp;         {

&nbsp;           headers: { Authorization: `Bearer ${token}` }

&nbsp;         }

&nbsp;       );

&nbsp;       const data = await res.json();

&nbsp;       setNeighbours(data);

&nbsp;     } catch {

&nbsp;       console.log("Failed to load neighbours");

&nbsp;     }

&nbsp;   };



&nbsp;   fetchProfile();

&nbsp;   fetchNeighbours();

&nbsp; }, \[token]);



&nbsp; if (!resident) return <p className="page-container">Loading...</p>;



&nbsp; const fullFlat = `${resident.block || ""}-${resident.flat || ""}`;

&nbsp; const documents = resident.documents || \[];

&nbsp; const emergency = resident.emergencyContact;



&nbsp; /\* ================= PROFILE PIC ================= \*/

&nbsp; const handlePicUpload = (e) => {

&nbsp;   const file = e.target.files\[0];

&nbsp;   if (!file) return;

&nbsp;   setProfilePic(URL.createObjectURL(file));

&nbsp;   toast.success("Profile photo updated");

&nbsp; };



&nbsp; const removePic = () => {

&nbsp;   setProfilePic(null);

&nbsp;   toast.success("Profile photo removed");

&nbsp; };



&nbsp; /\* ================= PASSWORD CHANGE ================= \*/

&nbsp; const handlePasswordChange = async () => {

&nbsp;   if (!currentPassword || !newPassword || !confirmPassword) {

&nbsp;     toast.error("All fields are required");

&nbsp;     return;

&nbsp;   }



&nbsp;   if (newPassword !== confirmPassword) {

&nbsp;     toast.error("Passwords do not match");

&nbsp;     return;

&nbsp;   }



&nbsp;   try {

&nbsp;     const res = await fetch(

&nbsp;       "http://localhost:5000/api/resident/change-password",

&nbsp;       {

&nbsp;         method: "PUT",

&nbsp;         headers: {

&nbsp;           "Content-Type": "application/json",

&nbsp;           Authorization: `Bearer ${token}`

&nbsp;         },

&nbsp;         body: JSON.stringify({ currentPassword, newPassword })

&nbsp;       }

&nbsp;     );



&nbsp;     const data = await res.json();



&nbsp;     if (!res.ok) {

&nbsp;       toast.error(data.message);

&nbsp;       return;

&nbsp;     }



&nbsp;     toast.success("Password updated successfully");

&nbsp;     setCurrentPassword("");

&nbsp;     setNewPassword("");

&nbsp;     setConfirmPassword("");

&nbsp;   } catch {

&nbsp;     toast.error("Password update failed");

&nbsp;   }

&nbsp; };



&nbsp; return (

&nbsp;   <div className="page-container">

&nbsp;     <h1 className="page-title">My Profile</h1>



&nbsp;     <div className="profile-grid">



&nbsp;       {/\* PROFILE CARD \*/}

&nbsp;       <div className="card profile-card">

&nbsp;         <div className="profile-top">

&nbsp;           <div className="profile-avatar-lg">

&nbsp;             {profilePic ? (

&nbsp;               <>

&nbsp;                 <img src={profilePic} alt="profile" />

&nbsp;                 <div className="avatar-actions">

&nbsp;                   <label className="avatar-btn">

&nbsp;                     Change

&nbsp;                     <input type="file" hidden onChange={handlePicUpload} />

&nbsp;                   </label>

&nbsp;                 </div>

&nbsp;               </>

&nbsp;             ) : (

&nbsp;               <label className="upload-pic">

&nbsp;                 {resident?.name ? resident.name.charAt(0) : "U"}

&nbsp;                 <input type="file" hidden onChange={handlePicUpload} />

&nbsp;               </label>

&nbsp;             )}

&nbsp;           </div>



&nbsp;           <div>

&nbsp;             <h2>{resident.name}</h2>

&nbsp;             <p className="muted-text">{resident.role}</p>

&nbsp;           </div>

&nbsp;         </div>



&nbsp;         <div className="profile-details">

&nbsp;           <p><strong>Flat : </strong> {fullFlat}</p>

&nbsp;           <p><strong>Phone : </strong> {resident.phone}</p>

&nbsp;           <p>

&nbsp;             <strong>Status :  </strong>

&nbsp;             <span className="status-pill status-open"> Active </span>

&nbsp;           </p>

&nbsp;         </div>

&nbsp;         <br />



&nbsp;         <button className="primary-btn" onClick={removePic}>

&nbsp;           Remove Photo

&nbsp;         </button>

&nbsp;       </div>



&nbsp;       {/\* PASSWORD CARD \*/}

&nbsp;       <div className="card">

&nbsp;         <h3 className="card-title">Change Password</h3>



&nbsp;         <div className="form-group">

&nbsp;           <label>Current Password</label>

&nbsp;           <input

&nbsp;             type="password"

&nbsp;             value={currentPassword}

&nbsp;             onChange={(e) => setCurrentPassword(e.target.value)}

&nbsp;           />

&nbsp;         </div>



&nbsp;         <div className="form-group">

&nbsp;           <label>New Password</label>

&nbsp;           <input

&nbsp;             type="password"

&nbsp;             value={newPassword}

&nbsp;             onChange={(e) => setNewPassword(e.target.value)}

&nbsp;           />

&nbsp;         </div>



&nbsp;         <div className="form-group">

&nbsp;           <label>Confirm New Password</label>

&nbsp;           <input

&nbsp;             type="password"

&nbsp;             value={confirmPassword}

&nbsp;             onChange={(e) => setConfirmPassword(e.target.value)}

&nbsp;           />

&nbsp;         </div>



&nbsp;         <button className="primary-btn full-width" onClick={handlePasswordChange}>

&nbsp;           Update Password

&nbsp;         </button>

&nbsp;       </div>

&nbsp;     </div>



&nbsp;     {/\* NEIGHBOURS \*/}

&nbsp;     <div className="card">

&nbsp;       <h3>Neighbours</h3>



&nbsp;       <div className="neighbour-list">

&nbsp;         {neighbours.length === 0 ? (

&nbsp;           <p className="muted-text">No neighbours found</p>

&nbsp;         ) : (

&nbsp;           neighbours.map((n) => (

&nbsp;             <div key={n.\_id} className="neighbour-row">

&nbsp;               <div className="avatar-sm">

&nbsp;                 {n?.name ? n.name.charAt(0) :"U"}

&nbsp;               </div>



&nbsp;               <div className="neighbour-info">

&nbsp;                 <strong>{n.name}</strong>

&nbsp;                 <p className="muted-text">

&nbsp;                   Flat {n.flat} · {n.role}

&nbsp;                 </p>

&nbsp;               </div>



&nbsp;               <span className="status-badge status-active">

&nbsp;                 Active

&nbsp;               </span>

&nbsp;             </div>

&nbsp;           ))

&nbsp;         )}

&nbsp;       </div>

&nbsp;     </div>



&nbsp;     {/\* DOCUMENTS \*/}

&nbsp;     <div className="card">

&nbsp;       <h3>Documents</h3>



&nbsp;       {documents.length === 0 ? (

&nbsp;         <p className="muted-text">No documents uploaded</p>

&nbsp;       ) : (

&nbsp;         documents.map((doc, index) => (

&nbsp;           <div key={index} className="document-row">

&nbsp;             <div>

&nbsp;               <strong>{doc.type}</strong>

&nbsp;               <p className="muted-text">{doc.number || "—"}</p>

&nbsp;               {doc.verifiedOn \&\& (

&nbsp;                 <p className="muted-text small">

&nbsp;                   Verified on {doc.verifiedOn}

&nbsp;                 </p>

&nbsp;               )}

&nbsp;             </div>



&nbsp;             <span className={`status-badge ${doc.verified ? "status-active" : "status-inactive"}`}>

&nbsp;               {doc.verified ? "Verified" : "Pending"}

&nbsp;             </span>

&nbsp;           </div>

&nbsp;         ))

&nbsp;       )}

&nbsp;     </div>



&nbsp;     {/\* EMERGENCY CONTACT \*/}

&nbsp;     <div className="card">

&nbsp;       <h3> Emergency Contact</h3>



&nbsp;       {emergency ? (

&nbsp;         <>

&nbsp;           <p><strong>Name:</strong> {emergency.name}</p>

&nbsp;           <p><strong>Relation:</strong> {emergency.relation}</p>

&nbsp;           <p><strong>Phone:</strong> {emergency.phone}</p>

&nbsp;         </>

&nbsp;       ) : (

&nbsp;         <p className="muted-text">No emergency contact added</p>

&nbsp;       )}

&nbsp;     </div>



&nbsp;   </div>

&nbsp; );

};



export default ResidentProfile;



VisitorsInviteModal.jsx

import React, { useState } from "react";

//import visitorInvitesData from "../admin/data/visitorInvitesData";

import toast from "react-hot-toast";







const VisitorInviteModal = ({  onClose,onCreated }) => {

&nbsp; const \[form, setForm] = useState({

&nbsp;   name: "",

&nbsp;   purpose: "",

&nbsp;   date: "",

&nbsp;   fromTime: "",

&nbsp;   toTime: "",

&nbsp; });



&nbsp; const handleChange = (e) => {

&nbsp;   setForm({ ...form, \[e.target.name]: e.target.value });

&nbsp; };



&nbsp;const handleCreate = async () => {

&nbsp; if (!form.name || !form.date || !form.fromTime || !form.toTime) {

&nbsp;   toast.error("Please fill all required fields");

&nbsp;   return;

&nbsp; }



&nbsp; try {

&nbsp;   const res = await fetch("http://localhost:5000/api/visitors", {

&nbsp;     method: "POST",

&nbsp;     headers: {

&nbsp;       "Content-Type": "application/json",

&nbsp;       Authorization: `Bearer ${localStorage.getItem("token")}`

&nbsp;     },

&nbsp;     body: JSON.stringify({

&nbsp;       visitorName: form.name,

&nbsp;       purpose: form.purpose,

&nbsp;       visitDate: form.date

&nbsp;     })

&nbsp;   });



&nbsp;   const data = await res.json();



&nbsp;   if (!res.ok) {

&nbsp;     toast.error(data.message || "Failed to create invite");

&nbsp;     return;

&nbsp;   }



&nbsp;   toast.success(`Visitor invite created successfully! Invite Code: ${data.inviteCode}`);

&nbsp;   onCreated(); // refresh visitor list

&nbsp;   onClose();



&nbsp; } catch (error) {

&nbsp;   console.error(error);

&nbsp;   toast.error("Server error");

&nbsp; }

};



&nbsp; return (

&nbsp;   <div className="modal-backdrop">

&nbsp;     <div className="modal-card">

&nbsp;       <h2>Invite Visitor</h2>



&nbsp;       <input

&nbsp;         name="name"

&nbsp;         placeholder="Visitor Name \*"

&nbsp;         onChange={handleChange}

&nbsp;       />



&nbsp;       <input

&nbsp;         name="purpose"

&nbsp;         placeholder="Purpose (optional)"

&nbsp;         onChange={handleChange}

&nbsp;       />

&nbsp;       

&nbsp;       <input

&nbsp;         type="date"

&nbsp;         name="date"

&nbsp;         onChange={handleChange}

&nbsp;       />



&nbsp;       <div className="time-row">

&nbsp;         <label style={{ marginTop: "10px" }}>Time:</label>

&nbsp;         <input

&nbsp;           type="time"

&nbsp;           name="fromTime"

&nbsp;           onChange={handleChange}

&nbsp;         />

&nbsp;             <span style={{ margin: "0 5px" }}>To Time:</span>

&nbsp;         <input

&nbsp;           type="time"

&nbsp;           name="toTime"

&nbsp;           onChange={handleChange}

&nbsp;         />

&nbsp;       </div>



&nbsp;       <div className="modal-actions">

&nbsp;         <button className="secondary-btn" onClick={onClose}>

&nbsp;           Cancel

&nbsp;         </button>

&nbsp;         <button className="primary-btn" onClick={handleCreate}>

&nbsp;           Generate Invite

&nbsp;         </button>

&nbsp;       </div>



&nbsp;       <p className="muted-text small">

&nbsp;         Visitor must show the code at security gate

&nbsp;       </p>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

};



export default VisitorInviteModal;









------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

backend 



complaint.controller.js



import Complaint from "../models/Complaint.js";

import User from "../models/User.js";



/\* =====================================================

&nbsp;   RESIDENT - CREATE COMPLAINT

===================================================== \*/

export const createComplaint = async (req, res) => {

&nbsp; try {

&nbsp;   const {

&nbsp;     category,

&nbsp;     location,

&nbsp;     priority,

&nbsp;     description,

&nbsp;     preferredCallTime,

&nbsp;     repeatedIssue

&nbsp;   } = req.body;



&nbsp;   const resident = await User.findById(req.user.id);



&nbsp;   if (!resident) {

&nbsp;     return res.status(404).json({ message: "Resident not found" });

&nbsp;   }

&nbsp;   //  Repeated Issue Detection (last 30 days)

&nbsp;   const lastComplaint = await Complaint.findOne({

&nbsp;     "resident.id": resident.\_id,

&nbsp;     category,

&nbsp;     location,

&nbsp;     createdAt: {

&nbsp;       $gte: new Date(Date.now() - 30 \* 24 \* 60 \* 60 \* 1000)

&nbsp;     },

&nbsp;     status: { $ne: "REJECTED" }

&nbsp;   }).sort({ createdAt: -1 });



&nbsp; // SLA Logic

&nbsp;   const slaHours =

&nbsp;     priority === "EMERGENCY"

&nbsp;       ? 6

&nbsp;       : priority === "HIGH"

&nbsp;       ? 24

&nbsp;       : 48;



&nbsp;   //const slaHours=0.001;\*/



&nbsp;   const files = req.files || \[];

&nbsp;   let attachments = \[];

&nbsp;   if(files \&\& files.length > 0){

&nbsp;     attachments = files.map(file => ({

&nbsp;       name: file.originalname,

&nbsp;       type: file.mimetype,

&nbsp;       url:file.filename

&nbsp;     }));

&nbsp;   }



&nbsp;   const complaint = await Complaint.create({

&nbsp;     resident: {

&nbsp;       id: resident.\_id,

&nbsp;       name: resident.name,

&nbsp;       flat: resident.flat||"",

&nbsp;       phone: resident.phone||""

&nbsp;     },



&nbsp;     category,

&nbsp;     location,

&nbsp;     priority,

&nbsp;     description,

&nbsp;     attachments,



&nbsp;     sla: {

&nbsp;       hours: slaHours,

&nbsp;       startedAt: new Date()

&nbsp;     },



&nbsp;     automation: {

&nbsp;       preferredCallTime,

&nbsp;       repeatedIssue:lastComplaint? true : false

&nbsp;     },



&nbsp;     timeline: \[

&nbsp;       {

&nbsp;         event: "COMPLAINT\_RAISED",

&nbsp;         actor: "RESIDENT"

&nbsp;       }

&nbsp;     ]

&nbsp;   });

&nbsp;   // If repeated issue detected, add timeline entry

&nbsp;     if (lastComplaint) {

&nbsp;       complaint.timeline.push({

&nbsp;         event: "REPEATED\_ISSUE\_DETECTED",

&nbsp;         actor: "SYSTEM"

&nbsp;       });



&nbsp;       await complaint.save();

&nbsp;     }

&nbsp;    /\* ===========================

&nbsp;       AUTOMATION SIMULATION

&nbsp;   =========================== \*/



&nbsp;   //  Schedule Call after 3 sec

&nbsp;   setTimeout(async () => {

&nbsp;     complaint.automation.callStatus = "SCHEDULED";

&nbsp;     complaint.automation.callAttempts = 1;



&nbsp;     complaint.sla.paused = true;

&nbsp;     complaint.sla.pausedAt = new Date();



&nbsp;     complaint.timeline.push({

&nbsp;       event: "AUTOMATED\_CALL\_SCHEDULED",

&nbsp;       actor: "SYSTEM"

&nbsp;     });



&nbsp;     await complaint.save();



&nbsp;     //  Complete Call after 5 sec more

&nbsp;     setTimeout(async () => {

&nbsp;       complaint.automation.callStatus = "COMPLETED";



&nbsp;       complaint.sla.paused = false;

&nbsp;       complaint.sla.pausedAt = null;



&nbsp;       complaint.timeline.push({

&nbsp;         event: "AUTOMATED\_CALL\_COMPLETED",

&nbsp;         actor: "SYSTEM"

&nbsp;       });



&nbsp;       await complaint.save();

&nbsp;     }, 5000);



&nbsp;   }, 3000);



&nbsp;   res.status(201).json(complaint);

&nbsp;} catch (error) {

&nbsp; console.error("Create Complaint Error:", error);

&nbsp; res.status(500).json({ message: error.message });

}

};



/\* =====================================================

&nbsp;   RESIDENT - GET MY COMPLAINTS

===================================================== \*/

export const getMyComplaints = async (req, res) => {

&nbsp; try {

&nbsp;   const complaints = await Complaint.find({

&nbsp;     "resident.id": req.user.id

&nbsp;   }).sort({ createdAt: -1 });



&nbsp;   res.json(complaints);

&nbsp; } catch (error) {

&nbsp; console.error("Create Complaint Error:", error);

&nbsp; res.status(500).json({ message: "Server error" });

}

};



/\* =====================================================

&nbsp;   ADMIN - GET ALL COMPLAINTS

===================================================== \*/

export const getAllComplaints = async (req, res) => {

&nbsp; try {

&nbsp;   const complaints = await Complaint.find().sort({ createdAt: -1 });



&nbsp;   res.json(complaints);

&nbsp; } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



/\* =====================================================

&nbsp;   ADMIN - ASSIGN COMPLAINT

===================================================== \*/

export const assignComplaint = async (req, res) => {

&nbsp; try {

&nbsp;   const { staffId, role } = req.body;



&nbsp;   const complaint = await Complaint.findById(req.params.id);



&nbsp;   if (!complaint) {

&nbsp;     return res.status(404).json({ message: "Complaint not found" });

&nbsp;   }



&nbsp;   complaint.assignment = {

&nbsp;     assigned: true,

&nbsp;     assignedTo: staffId,

&nbsp;     role,

&nbsp;     assignedAt: new Date()

&nbsp;   };



&nbsp;   complaint.status = "IN\_PROGRESS";



&nbsp;   complaint.timeline.push({

&nbsp;     event: "COMPLAINT\_ASSIGNED",

&nbsp;     actor: "ADMIN",

&nbsp;     meta: { staffId, role }

&nbsp;   });



&nbsp;   await complaint.save();



&nbsp;   res.json(complaint);

&nbsp; } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



/\* =====================================================

&nbsp;   ADMIN - RESOLVE COMPLAINT

===================================================== \*/

export const resolveComplaint = async (req, res) => {

&nbsp; try {

&nbsp;   const complaint = await Complaint.findById(req.params.id);



&nbsp;   if (!complaint) {

&nbsp;     return res.status(404).json({ message: "Complaint not found" });

&nbsp;   }



&nbsp;   complaint.status = "COMPLETED";

&nbsp;   complaint.resolvedAt = new Date();



&nbsp;   complaint.feedback.eligible = true;



&nbsp;   complaint.timeline.push({

&nbsp;     event: "COMPLAINT\_RESOLVED",

&nbsp;     actor: "ADMIN"

&nbsp;   });



&nbsp;   await complaint.save();



&nbsp;   res.json(complaint);

&nbsp; } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



/\* =====================================================

&nbsp;   RESIDENT - SUBMIT FEEDBACK

===================================================== \*/

export const submitFeedback = async (req, res) => {

&nbsp; try {

&nbsp;   const { rating, comment } = req.body;

&nbsp;   const complaint = await Complaint.findById(req.params.id);

&nbsp;   if (!complaint) {

&nbsp;     return res.status(404).json({ message: "Complaint not found" });

&nbsp;   }

&nbsp;   if (!complaint.feedback.eligible) {

&nbsp;     return res.status(400).json({ message: "Feedback not allowed for this complaint" });

&nbsp;   }

&nbsp;   if (complaint.feedback.submitted) {

&nbsp;     return res.status(400).json({ message: "Feedback already submitted" });

&nbsp;   }

&nbsp;   complaint.feedback = {

&nbsp;     eligible: false,

&nbsp;     submitted: true,

&nbsp;     rating,

&nbsp;     comment

&nbsp;   };

&nbsp;   complaint.timeline.push({

&nbsp;     event: "FEEDBACK\_SUBMITTED",

&nbsp;     actor: "RESIDENT",

&nbsp;     meta: { rating }

&nbsp;   });

&nbsp;   await complaint.save();

&nbsp;   res.json({ message: "Feedback submitted successfully" });

&nbsp; } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



emergency.controller.js



import Emergency from "../models/Emergency.js";

import User from "../models/User.js";

/\* =====================================================

&nbsp;   RESIDENT - TRIGGER EMERGENCY

===================================================== \*/

export const triggerEmergency = async (req, res) => {

&nbsp; try {

&nbsp;   const { type, description } = req.body;

&nbsp;   const resident = await User.findById(req.user.id);

&nbsp;   if (!resident) {

&nbsp;     return res.status(404).json({ message: "Resident not found" });

&nbsp;   }

&nbsp;   const emergency = await Emergency.create({

&nbsp;     resident: {

&nbsp;       id: resident.\_id,

&nbsp;       name: resident.name,

&nbsp;       flat: resident.flat,

&nbsp;       phone: resident.phone

&nbsp;       },

&nbsp;       type,

&nbsp;       description

&nbsp;   });

&nbsp;   console.log("Emergency Alert Created:", type, resident.name);

&nbsp;   res.status(201).json(emergency);

&nbsp; } catch (error) {

&nbsp;   console.error("Error triggering emergency:", error);

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



/\* =====================================================

&nbsp;    EMERGENCIES ADMIN/SECURITY VIEW

===================================================== \*/

export const getMyEmergencies = async (req, res) => {

&nbsp; try {

&nbsp;   const emergencies = await Emergency.find({

&nbsp;     "resident.id": req.user.id

&nbsp;   }).sort({ createdAt: -1 });

&nbsp;   res.json(emergencies);

&nbsp; } catch (error) {

&nbsp;   console.error("Error fetching emergencies:", error);

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



/\* =====================================================

RESOLVE EMERGENCY (SECURITY/ADMIN)

===================================================== \*/

export const resolveEmergency = async (req, res) => {

&nbsp; try {

&nbsp;   const emergency = await Emergency.findById(req.params.id);

&nbsp;   if (!emergency) {

&nbsp;     return res.status(404).json({ message: "Emergency not found" });

&nbsp;   }

&nbsp;   emergency.status = "RESOLVED";

&nbsp;   emergency.resolvedAt = new Date();

&nbsp;   emergency.respondedBy = req.user.id;

&nbsp;   await emergency.save();

&nbsp;   res.json({ message: "Emergency resolved" });

&nbsp; } catch (error) {

&nbsp;   console.error("Error resolving emergency:", error);

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



/\* =====================================================

&nbsp;   GET ALL EMERGENCIES (ADMIN/SECURITY)

===================================================== \*/

export const getAllEmergencies = async (req, res) => {

&nbsp; try {

&nbsp;   const emergencies = await Emergency.find().sort({ createdAt: -1 });

&nbsp;   res.json(emergencies);

&nbsp; } catch (error) {

&nbsp;   console.error("Error fetching emergencies:", error);

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



visitor.controller.js

import Visitor from "../models/Visitor.js";

import User from "../models/User.js";



export const createVisitor = async (req, res) => {

&nbsp; try {

&nbsp;   const { visitorName, phone, purpose, visitDate } = req.body;

&nbsp;   const today = new Date();

&nbsp;   today.setHours(0, 0, 0, 0);

&nbsp;   const selectedDate = new Date(visitDate);

&nbsp;   if (selectedDate < today) {

&nbsp;     return res.status(400).json({ message: "Visit date cannot be in the past" });

&nbsp;   }



&nbsp;   const resident = await User.findById(req.user.id);



&nbsp;   if (!resident) {

&nbsp;     return res.status(404).json({ message: "Resident not found" });

&nbsp;   }

&nbsp;   

&nbsp;   const inviteCode = Math.floor(1000000 + Math.random() \* 900000).toString();

&nbsp;   const visitor = await Visitor.create({

&nbsp;     resident: {

&nbsp;       id: resident.\_id,

&nbsp;       name: resident.name,

&nbsp;       flat: resident.flat

&nbsp;     },

&nbsp;     visitorName,

&nbsp;     phone,

&nbsp;     purpose,

&nbsp;     visitDate,

&nbsp;     inviteCode

&nbsp;   });

&nbsp;   

&nbsp;   res.status(201).json(visitor);

&nbsp; } catch (error) {

&nbsp;   console.error("Error creating visitor:", error);

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



export const updateVisitorStatus = async (req, res) => {

&nbsp; try {

&nbsp;   const visitor = await Visitor.findById(req.params.id);

&nbsp;   if (!visitor) {

&nbsp;     return res.status(404).json({ message: "Visitor not found" });

&nbsp;   }

&nbsp;   visitor.status = req.body.status;

&nbsp;   if (req.body.status === "CHECKED\_IN") {

&nbsp;     visitor.checkInTime = new Date();

&nbsp;   }

&nbsp;   if (req.body.status === "CHECKED\_OUT") {

&nbsp;     visitor.checkOutTime = new Date();

&nbsp;   }

&nbsp;   if (req.body.status === "APPROVED") {

&nbsp;     visitor.approvedBy = req.user.id;

&nbsp;   }

&nbsp;   await visitor.save();

&nbsp;   res.json(visitor);

&nbsp; } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



export const getMyVisitors = async (req, res) => {

&nbsp; try {

&nbsp;   const visitors = await Visitor.find({

&nbsp;     "resident.id": req.user.id

&nbsp;   }).sort({ createdAt: -1 });

&nbsp;   

&nbsp;   const today = new Date();

&nbsp;   today.setHours(0, 0, 0, 0);



&nbsp;   for (let visitor of visitors) {

&nbsp;     const visitDate = new Date(visitor.visitDate);

&nbsp;     visitDate.setHours(0, 0, 0, 0);



&nbsp;     if (

&nbsp;       visitor.status === "EXPECTED" \&\&

&nbsp;       visitDate < today

&nbsp;     ) {

&nbsp;       visitor.status = "EXPIRED";

&nbsp;       await visitor.save();

&nbsp;     }

&nbsp;   }

&nbsp;   res.json(visitors);

&nbsp; } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

};



export const getAllVisitors = async (req, res) => {

&nbsp; try {

&nbsp;   const visitors = await Visitor.find().sort({ createdAt: -1 });  

&nbsp;   res.json(visitors);

&nbsp;   } catch (error) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp;   }

};



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\middleware\\authmiddleware.js



import jwt from "jsonwebtoken";



export const protect = (req, res, next) => {

&nbsp; const authHeader = req.headers.authorization;



&nbsp; if (!authHeader || !authHeader.startsWith("Bearer ")) {

&nbsp;   return res.status(401).json({ message: "Not authorized" });

&nbsp; }



&nbsp; try {

&nbsp;   const token = authHeader.split(" ")\[1];

&nbsp;   const decoded = jwt.verify(token, process.env.JWT\_SECRET);



&nbsp;   req.user = decoded; // { id, role }

&nbsp;   next();

&nbsp; } catch (err) {

&nbsp;   return res.status(401).json({ message: "Invalid token" });

&nbsp; }

};



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\middleware\\roleMiddleware.js



export const allowRoles = (...roles) => {

&nbsp; return (req, res, next) => {

&nbsp;   if (!roles.includes(req.user.role)) {

&nbsp;     return res.status(403).json({ message: "Access denied" });

&nbsp;   }

&nbsp;   next();

&nbsp; };

};



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\middleware\\upload.js



import multer from 'multer';

import path from 'path';

const storage = multer.diskStorage({

&nbsp; destination: (req, file, cb) => {

&nbsp;   cb(null, 'uploads/');

&nbsp; },

&nbsp;   filename: function(req, file, cb) {

&nbsp;     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() \* 1E9);

&nbsp;     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

&nbsp;   }

});



const upload = multer({ storage: storage });

export default upload;



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\models\\Announcement.js



import mongoose from "mongoose";



const announcementSchema = new mongoose.Schema(

&nbsp; {

&nbsp;   title: { type: String, required: true },

&nbsp;   message: { type: String, required: true },

&nbsp;   priority: {

&nbsp;     type: String,

&nbsp;     enum: \["Emergency", "Important", "Normal"],

&nbsp;     default: "Normal"

&nbsp;   }

&nbsp; },

&nbsp; { timestamps: true }

);



export default mongoose.model("Announcement", announcementSchema);





C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\models\\Complaint.js

import mongoose from "mongoose";



const timelineSchema = new mongoose.Schema({

&nbsp; event: { type: String, required: true },

&nbsp; actor: { type: String, required: true }, // RESIDENT / ADMIN / SYSTEM / SECURITY

&nbsp; meta: { type: Object, default: {} },

&nbsp; time: { type: Date, default: Date.now }

});



const attachmentSchema = new mongoose.Schema({

&nbsp; name: String,

&nbsp; type: String,

&nbsp; url: String

});



const complaintSchema = new mongoose.Schema(

&nbsp; {

&nbsp;   complaintCode: {

&nbsp;     type: String,

&nbsp;     unique: true

&nbsp;   },



&nbsp;   resident: {

&nbsp;     id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

&nbsp;     name: String,

&nbsp;     flat: String,

&nbsp;     phone: String

&nbsp;   },



&nbsp;   category: {

&nbsp;     type: String,

&nbsp;     required: true

&nbsp;   },



&nbsp;   location: String,



&nbsp;   priority: {

&nbsp;     type: String,

&nbsp;     enum: \["NORMAL", "HIGH", "EMERGENCY"],

&nbsp;     default: "NORMAL"

&nbsp;   },



&nbsp;   description: {

&nbsp;     type: String,

&nbsp;     required: true

&nbsp;   },



&nbsp;   status: {

&nbsp;     type: String,

&nbsp;     enum: \["OPEN", "IN\_PROGRESS", "COMPLETED", "REJECTED"],

&nbsp;     default: "OPEN"

&nbsp;   },



&nbsp;   assignment: {

&nbsp;     assigned: { type: Boolean, default: false },

&nbsp;     assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

&nbsp;     role: String,

&nbsp;     assignedAt: Date

&nbsp;   },



&nbsp;   sla: {

&nbsp;     hours: { type: Number, required: true },

&nbsp;     startedAt: Date,

&nbsp;     paused: { type: Boolean, default: false },

&nbsp;     pausedAt: Date,

&nbsp;     breached: { type: Boolean, default: false }

&nbsp;   },



&nbsp;   automation: {

&nbsp;     callAllowed: { type: Boolean, default: true },

&nbsp;     callStatus: {

&nbsp;       type: String,

&nbsp;       enum: \["PENDING", "SCHEDULED", "COMPLETED", "NO\_RESPONSE"],

&nbsp;       default: "PENDING"

&nbsp;     },

&nbsp;     callAttempts: { type: Number, default: 0 },

&nbsp;     preferredCallTime: {

&nbsp;       type: String,

&nbsp;       enum: \["ANYTIME", "MORNING", "AFTERNOON", "EVENING"],

&nbsp;       default: "ANYTIME"

&nbsp;     },

&nbsp;     repeatedIssue: { type: Boolean, default: false }

&nbsp;   },



&nbsp;   attachments: \[attachmentSchema],



&nbsp;   timeline: \[timelineSchema],



&nbsp;   feedback: {

&nbsp;     eligible: { type: Boolean, default: false },

&nbsp;     submitted: { type: Boolean, default: false },

&nbsp;     rating: Number,

&nbsp;     comment: String

&nbsp;   },



&nbsp;   resolvedAt: Date

&nbsp; },

&nbsp; { timestamps: true }

);





complaintSchema.pre("save", function () {

&nbsp; if (!this.complaintCode) {

&nbsp;   this.complaintCode = `CIV-${Date.now()}-${Math.floor(

&nbsp;     100 + Math.random() \* 900

&nbsp;   )}`;

&nbsp; }

});



export default mongoose.model("Complaint", complaintSchema);



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\models\\Emergency.js

import mongoose from "mongoose";



const emergencySchema = new mongoose.Schema(

&nbsp; {

&nbsp;   resident: {

&nbsp;     id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

&nbsp;     name: String,

&nbsp;     flat: String,

&nbsp;     phone: String

&nbsp;   },



&nbsp;   type: {

&nbsp;     type: String,

&nbsp;     enum: \["SOS", "MEDICAL", "SUSPICIOUS", "FIRE"],

&nbsp;     required: true

&nbsp;   },

&nbsp;   description: {

&nbsp;     type: String,

&nbsp;     required: true

&nbsp;   },



&nbsp;   status: {

&nbsp;     type: String,

&nbsp;     enum: \["ACTIVE", "RESOLVED"],

&nbsp;     default: "ACTIVE"

&nbsp;   },



&nbsp;   respondedBy: {

&nbsp;     type: mongoose.Schema.Types.ObjectId,

&nbsp;     ref: "User"

&nbsp;   },



&nbsp;   resolvedAt: Date

&nbsp; },

&nbsp; { timestamps: true }

);



export default mongoose.model("Emergency", emerC:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\models\\User.jsgencySchema);

import mongoose from "mongoose";



const userSchema = new mongoose.Schema(

&nbsp; {

&nbsp;   role: {

&nbsp;     type: String,

&nbsp;     enum: \["admin", "resident", "security"],

&nbsp;     required: true,

&nbsp;   },

&nbsp;   societyCode: {

&nbsp;     type: String,

&nbsp;     required: true,

&nbsp;   },

&nbsp;   email: {

&nbsp;     type: String,

&nbsp;     required: true,

&nbsp;     lowercase: true,

&nbsp;     unique: true,

&nbsp;   },

&nbsp;   password: {

&nbsp;     type: String,

&nbsp;     required: true,

&nbsp;   },

&nbsp;    name: {

&nbsp;     type: String,

&nbsp;     required:true,

&nbsp;   },

&nbsp;   phone: {

&nbsp;     type: String,

&nbsp;   },

&nbsp;   //resident fields 

&nbsp;   block: {

&nbsp;     type: String,

&nbsp;   },

&nbsp;   flat: {

&nbsp;     type: String,

&nbsp;   },

&nbsp;   maintenanceStatue : {

&nbsp;     type : String,

&nbsp;     enum:\["Pending","Paid"],

&nbsp;     default: "Pending",

&nbsp;   },

&nbsp;   documents:\[

&nbsp;     {

&nbsp;       type :{type:String},

&nbsp;       number:{type:String},

&nbsp;       verified:{type:Boolean,default:false},

&nbsp;       verification:Date

&nbsp;     }

&nbsp;   ],

&nbsp;   emergencyContact:{

&nbsp;     name:String,

&nbsp;     relation : String,

&nbsp;     phone :String

&nbsp;   },

&nbsp;   /\*security fields

&nbsp;   guardId: {

&nbsp;     type : String,

&nbsp;   },

&nbsp;   Status :{

&nbsp;     type: String,

&nbsp;     default :"Active ",

&nbsp;   },\*/

&nbsp; },

&nbsp; { timestamps: true }

);



export default mongoose.model("User", userSchema);







C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\models\\Visitor.js

import { ExplainVerbosity } from "mongodb";

import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(

&nbsp;   {

&nbsp;       resident: {

&nbsp;           id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

&nbsp;           name: String,

&nbsp;           flat: String,

&nbsp;           phone: String

&nbsp;       },

&nbsp;       visitorName: {

&nbsp;           type: String,

&nbsp;           required: true

&nbsp;       },

&nbsp;       phone: String,

&nbsp;       purpose: String,

&nbsp;       visitDate: {

&nbsp;           type: Date,

&nbsp;           required: true

&nbsp;       },

&nbsp;       inviteCode: {

&nbsp;           type: String,

&nbsp;           required: true,

&nbsp;           unique: true

&nbsp;       },

&nbsp;       status: {

&nbsp;           type: String,

&nbsp;           enum: \["EXPECTED", "APPROVED", "DENIED", "CHECKED\_IN", "CHECKED\_OUT","EXPIRED"],

&nbsp;           default: "EXPECTED"

&nbsp;       },

&nbsp;       checkInTime: Date,

&nbsp;       checkOutTime: Date,

&nbsp;       approvedBy: {

&nbsp;           type: mongoose.Schema.Types.ObjectId,   

&nbsp;           ref: "User"

&nbsp;       }

&nbsp;   },

&nbsp;   { timestamps: true }

);  

export default mongoose.model("Visitor", visitorSchema);





C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\admin.routes.js

import express from "express";

import bcrypt from "bcryptjs";

import User from "../models/User.js";

import { protect } from "../middleware/authmiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";



const router = express.Router();



// CREATE RESIDENT

router.post(

&nbsp; "/create-resident",

&nbsp; protect,

&nbsp; allowRoles("admin"),

&nbsp; async (req, res) => {

&nbsp;   const { name, email, password, societyCode,block,flat,phone } = req.body;



&nbsp;   const exists = await User.findOne({ email });

&nbsp;   if (exists) {

&nbsp;     return res.status(400).json({ message: "User already exists" });

&nbsp;   }



&nbsp;   const hashed = await bcrypt.hash(password, 10);



&nbsp;   const user = await User.create({

&nbsp;     name,

&nbsp;     email,

&nbsp;     password: hashed,

&nbsp;     role: "resident",

&nbsp;     societyCode,

&nbsp;     block,

&nbsp;     flat,

&nbsp;     phone

&nbsp;   });



&nbsp;   res.json({ message: "Resident created", userId: user.\_id });

&nbsp; }

);



// CREATE SECURITY

router.post(

&nbsp; "/create-security",

&nbsp; protect,

&nbsp; allowRoles("admin"),

&nbsp; async (req, res) => {

&nbsp;   const { name, email, password, societyCode } = req.body;



&nbsp;   const hashed = await bcrypt.hash(password, 10);



&nbsp;   await User.create({

&nbsp;     name,

&nbsp;     email,

&nbsp;     password: hashed,

&nbsp;     role: "security",

&nbsp;     societyCode,

&nbsp;   });



&nbsp;   res.json({ message: "Security created" });

&nbsp; }

);



export default router;





C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\announcement.routes.js

import express from "express";

import Announcement from "../models/Announcement.js";

import { protect } from "../middleware/authmiddleware.js";



const router = express.Router();



router.get("/", protect, async (req, res) => {

&nbsp; try {

&nbsp;   const announcements = await Announcement.find().sort({ createdAt: -1 });

&nbsp;   res.json(announcements);

&nbsp; } catch {

&nbsp;   res.status(500).json({ message: "Error fetching announcements" });

&nbsp; }

});



export default router;



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\auth.routes.js

import express from "express";

import Announcement from "../models/Announcement.js";

import { protect } from "../middleware/authmiddleware.js";



const router = express.Router();



router.get("/", protect, async (req, res) => {

&nbsp; try {

&nbsp;   const announcements = await Announcement.find().sort({ createdAt: -1 });

&nbsp;   res.json(announcements);

&nbsp; } catch {

&nbsp;   res.status(500).json({ message: "Error fetching announcements" });

&nbsp; }

});



export default router;





C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\complaint.routes.js

import express from "express";

import {

&nbsp; createComplaint,

&nbsp; getMyComplaints,

&nbsp; getAllComplaints,

&nbsp; assignComplaint,

&nbsp; resolveComplaint,

&nbsp; submitFeedback

} from "../controllers/complaint.controller.js";



import { protect } from "../middleware/authmiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";

import upload from "../middleware/upload.js";

const router = express.Router();



/\* ===============================

&nbsp;  RESIDENT ROUTES

================================ \*/

router.post(

&nbsp; "/",

&nbsp; protect,

&nbsp; allowRoles("resident"),

&nbsp; upload.array("attachments", 5), // max 5 files

&nbsp; createComplaint

);



router.post(

&nbsp; "/:id/feedback",

&nbsp; protect,

&nbsp; allowRoles("resident"),

&nbsp; submitFeedback

);



router.get(

&nbsp; "/my",

&nbsp; protect,

&nbsp; allowRoles("resident"),

&nbsp; getMyComplaints

);



/\* ===============================

&nbsp;  ADMIN ROUTES

================================ \*/

router.get(

&nbsp; "/",

&nbsp; protect,

&nbsp; allowRoles("admin"),

&nbsp; getAllComplaints

);



router.patch(

&nbsp; "/:id/assign",

&nbsp; protect,

&nbsp; allowRoles("admin"),

&nbsp; assignComplaint

);



router.patch(

&nbsp; "/:id/resolve",

&nbsp; protect,

&nbsp; allowRoles("admin"),

&nbsp; resolveComplaint

);



export default router;





C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\emergency.routes.js

import express from "express";

import {

&nbsp; triggerEmergency,

&nbsp; getMyEmergencies,

&nbsp; resolveEmergency,

&nbsp; getAllEmergencies

} from "../controllers/emergency.controller.js";



import { protect } from "../middleware/authmiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";



const router = express.Router();



router.post(

&nbsp; "/",

&nbsp; protect,

&nbsp; allowRoles("resident"),

&nbsp; triggerEmergency

);



router.get(

&nbsp; "/",

&nbsp; protect,

&nbsp; allowRoles("admin", "security"),

&nbsp; getMyEmergencies

);



router.get(

&nbsp; "/all",

&nbsp; protect,

&nbsp; allowRoles("admin", "security"),

&nbsp; getAllEmergencies

);



router.patch(

&nbsp; "/:id/resolve",

&nbsp; protect,

&nbsp; allowRoles("admin", "security"),

&nbsp; resolveEmergency

);



export default router;



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\protected.routes.js

import express from "express";

import { protect } from "../middleware/authmiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";



const router = express.Router();



router.get(

&nbsp; "/admin",

&nbsp; protect,

&nbsp; allowRoles("admin"),

&nbsp; (req, res) => {

&nbsp;   res.json({ message: "Admin access granted" });

&nbsp; }

);



router.get(

&nbsp; "/security",

&nbsp; protect,

&nbsp; allowRoles("security"),

&nbsp; (req, res) => {

&nbsp;   res.json({ message: "Security access granted" });

&nbsp; }

);



router.get(

&nbsp; "/resident",

&nbsp; protect,

&nbsp; allowRoles("resident"),

&nbsp; (req, res) => {

&nbsp;   res.json({ message: "Resident access granted" });

&nbsp; }

);



export default router;



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\resident.routes.js

import express from "express";

import User from "../models/User.js";

import { protect } from "../middleware/authmiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";

import bcrypt from "bcryptjs";

const router = express.Router();



router.get("/me", protect, allowRoles("resident"), async (req, res) => {

&nbsp; try {

&nbsp;   const user = await User.findById(req.user.id).select("-password");



&nbsp;   if (!user) {

&nbsp;     return res.status(404).json({ message: "Resident not found" });

&nbsp;   }



&nbsp;   res.json(user);

&nbsp; } catch (err) {

&nbsp;   res.status(500).json({ message: "Server error" });

&nbsp; }

});





// UPDATE PROFILE INFO

router.put("/me", protect, allowRoles("resident"), async (req, res) => {

&nbsp; try {

&nbsp;   const { name, phone, flat, block } = req.body;



&nbsp;   const user = await User.findById(req.user.id);



&nbsp;   if (!user) {

&nbsp;     return res.status(404).json({ message: "Resident not found" });

&nbsp;   }



&nbsp;   user.name = name ?? user.name;

&nbsp;   user.phone = phone ?? user.phone;

&nbsp;   user.flat = flat ?? user.flat;

&nbsp;   user.block = block ?? user.block;



&nbsp;   await user.save();



&nbsp;   res.json(user);

&nbsp; } catch {

&nbsp;   res.status(500).json({ message: "Profile update failed" });

&nbsp; }

});



// CHANGE PASSWORD

router.put("/change-password", protect, allowRoles("resident"), async (req, res) => {

&nbsp; try {

&nbsp;   const { currentPassword, newPassword } = req.body;



&nbsp;   const user = await User.findById(req.user.id);



&nbsp;   const isMatch = await bcrypt.compare(currentPassword, user.password);



&nbsp;   if (!isMatch) {

&nbsp;     return res.status(400).json({ message: "Current password incorrect" });

&nbsp;   }



&nbsp;   const hashed = await bcrypt.hash(newPassword, 10);

&nbsp;   user.password = hashed;



&nbsp;   await user.save();



&nbsp;   res.json({ message: "Password updated successfully" });

&nbsp; } catch {

&nbsp;   res.status(500).json({ message: "Password change failed" });

&nbsp; }

});



//neighbours

router.get(

&nbsp; "/neighbours",

&nbsp; protect,

&nbsp; allowRoles("resident"),

&nbsp; async (req, res) => {

&nbsp;   try {

&nbsp;     const currentUser = await User.findById(req.user.id);



&nbsp;     if (!currentUser) {

&nbsp;       return res.status(404).json({ message: "User not found" });

&nbsp;     }



&nbsp;     const neighbours = await User.find({

&nbsp;       role: "resident",

&nbsp;       societyCode: currentUser.societyCode,

&nbsp;       block: currentUser.block,

&nbsp;       \_id: { $ne: currentUser.\_id }

&nbsp;     }).select("-password");



&nbsp;     res.json(neighbours);

&nbsp;   } catch (err) {

&nbsp;     res.status(500).json({ message: "Server error" });

&nbsp;   }

&nbsp; }

);



export default router;

C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\routes\\visitor.routes.js

import express from "express";

import {

&nbsp;   createVisitor,

&nbsp;   updateVisitorStatus,

&nbsp;   getMyVisitors,

&nbsp;   getAllVisitors

} from "../controllers/visitor.controller.js";

import { protect } from "../middleware/authmiddleware.js";

import { allowRoles } from "../middleware/roleMiddleware.js";



const router = express.Router();



router.post(

&nbsp;   "/",

&nbsp;   protect,

&nbsp;   allowRoles("resident"),

&nbsp;   createVisitor

);

&nbsp;   

router.patch(

&nbsp;   "/:id/status",

&nbsp;   protect,

&nbsp;   allowRoles("security", "admin"),

&nbsp;   updateVisitorStatus

);



router.get(

&nbsp;   "/my-visitors",

&nbsp;   protect,

&nbsp;   allowRoles("resident"),

&nbsp;   getMyVisitors

);

router.get(

&nbsp;   "/",

&nbsp;   protect,

&nbsp;   allowRoles("security", "admin"),

&nbsp;   getAllVisitors

);





export default router;



C:\\Users\\MALIKARJUN\\OneDrive\\Desktop\\project\\civara\\backend\\src\\services\\sla.service.js

import cron from "node-cron";

import Complaint from "../models/Complaint.js";



export const startSLAMonitor = () => {

&nbsp; // Runs every 5 minutes

&nbsp; cron.schedule("\*/5 \* \* \* \*", async () => {

&nbsp;   console.log(" Running SLA Monitor...");



&nbsp;   try {

&nbsp;     const complaints = await Complaint.find({

&nbsp;       status: { $ne: "COMPLETED" },

&nbsp;       "sla.breached": false

&nbsp;     });



&nbsp;     for (const complaint of complaints) {

&nbsp;       const startedAt = complaint.sla.startedAt;

&nbsp;       const slaHours = complaint.sla.hours;



&nbsp;       if (!startedAt || !slaHours) continue;



&nbsp;       const deadline =

&nbsp;         new Date(startedAt).getTime() + slaHours \* 60 \* 60 \* 1000;



&nbsp;       if (Date.now() > deadline) {

&nbsp;         complaint.sla.breached = true;



&nbsp;         complaint.timeline.push({

&nbsp;           event: "SLA\_BREACHED",

&nbsp;           actor: "SYSTEM"

&nbsp;         });



&nbsp;         await complaint.save();



&nbsp;         console.log(

&nbsp;           ` SLA Breached for Complaint: ${complaint.complaintCode}`

&nbsp;         );

&nbsp;       }

&nbsp;     }

&nbsp;   } catch (error) {

&nbsp;     console.error("SLA Monitor Error:", error);

&nbsp;   }

&nbsp; });

};



import express from "express";

import cors from "cors";

import authRoutes from "./routes/auth.routes.js";



const app = express();



app.use(cors({

&nbsp; origin: "http://localhost:3000",

&nbsp; credentials: true,

}));



app.use(express.json());



app.get("/", (req, res) => {

&nbsp; res.send("CIVARA Backend Running");

});



// 🔑 AUTH ROUTES

app.use("/api/auth", authRoutes);



export default app;





import dotenv from "dotenv";

dotenv.config();



import express from "express";

import app from "./src/app.js";

import connectDB from "./src/config/db.js";



import authRoutes from "./src/routes/auth.routes.js";

import protectedRoutes from "./src/routes/protected.routes.js";

import adminRoutes from "./src/routes/admin.routes.js";

import residentRoutes from "./src/routes/resident.routes.js";

import complaintRoutes from "./src/routes/complaint.routes.js";

import { startSLAMonitor } from "./src/services/sla.service.js";

import announcementRoutes from "./src/routes/announcement.routes.js";

import emergencyRoutes from "./src/routes/emergency.routes.js";  

import visitorRoutes from "./src/routes/visitor.routes.js"; 



connectDB();

startSLAMonitor();



app.use("/api/auth",authRoutes);

app.use("/api/protected",protectedRoutes);

app.use("/api/admin",adminRoutes);

app.use("/api/resident",residentRoutes);

app.use("/api/complaints",complaintRoutes);

app.use("/uploads", express.static("uploads"));

app.use("/api/announcements",announcementRoutes);

app.use("/api/emergencies",emergencyRoutes);

app.use("/api/visitors", visitorRoutes);



app.listen(process.env.PORT, () => {

&nbsp; console.log(`Server running on ${process.env.PORT}`);

});





