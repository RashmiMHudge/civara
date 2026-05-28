import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComplaints } from "./ComplaintsContext";
import ComplaintCard from "./ComplaintCard";

const ResidentComplaints = () => {
  const [search,setSearch]=useState("");
  const navigate = useNavigate();
  const { complaints , loading , error } = useComplaints();

  const filteredComplaints = complaints.filter(c =>
    //c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||   
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.complaintCode?.toLowerCase().includes(search.toLowerCase()) ||
    c.status?.toLowerCase().includes(search.toLowerCase())
  );
  if (loading) return <p className="empty">Loading complaints...</p>;
  if (error) return <p className="empty">Error loading complaints: {error}</p>;

  return (
    <div className="page-container">
      <div className="page-header">
            <h1 className="page-title">My Complaints</h1>
            <br />
            
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button
              className="primary-btn"
              onClick={() => navigate("/resident/complaints/raise")}
            >
              + Raise Complaint
            </button> 
          </div>
        
      {complaints.length === 0 ? (
        <p className="empty">You have not raised any complaints yet.</p>
      ) : filteredComplaints.length === 0 ? (
        <p className="empty">No complaints match the search criteria.</p>
      ) : (
        filteredComplaints.map((complaint) => (
          <ComplaintCard
            key={complaint._id}
            complaint={complaint}
          />
        ))
      )}
      
    </div>
  );
};

export default ResidentComplaints;
