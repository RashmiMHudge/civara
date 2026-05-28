import React, { createContext, useContext, useState, useEffect,useCallback } from "react";
import API_BASE from "../../config/api";

const ComplaintsContext = createContext();

export const ComplaintsProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  
  //  FETCH REAL COMPLAINTS FROM BACKEND
  const fetchComplaints = useCallback(async () => {
    if(!token) {
      setComplaints([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/complaints/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if(!res.ok){
        throw new Error(data.message || "Failed to fetch complaints");
      }
      setComplaints(Array.isArray(data) ? data : []);
      setError(null);

    } catch (err) {
      console.error("Error fetching complaints:", err);
      setComplaints([]);
      setError(err.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  },[token]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  //  CREATE COMPLAINT (REAL BACKEND)
  const createComplaint = async (formData) => {
    try {
      const data = new FormData();
        data.append("category", formData.category);
        data.append("location", formData.location);
        data.append("priority", formData.priority);
        data.append("description", formData.description);
        data.append("preferredCallTime", formData.preferredCallTime);
        //data.append("repeatedIssue", formData.repeatedIssue);

        // attachments (IMPORTANT)
        if (formData.attachments && formData.attachments.length > 0) {
          formData.attachments.forEach((file) => {
            data.append("attachments", file);
          });
        }
      const res = await fetch(`${API_BASE}/api/complaints`, {
        method: "POST",
        headers: {
          // "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });
      const result = await res.json();
      if(!res.ok){
        throw new Error(result.message || "Failed to create complaint");
      }

     setComplaints((prev) => [result, ...prev]);

     return result;
    } catch (err) {
      console.error("Create complaint error:", err);
      throw err;
    }
  };

  //  RESOLVE (ADMIN USE CASE)
  const resolveComplaint = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${id}/resolve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      
      if(!res.ok){
        throw new Error("Failed to resolve complaint");
      }
      setComplaints((prev) =>
        prev.map((c) => (c._id === id ? result : c))
      );
      return result;
    } catch (err) {
      console.error("Resolve error:", err);
      throw err;
    }
  };

  //  SUBMIT FEEDBACK (BACKEND)
  const submitFeedback = async (id, rating, comment) => {
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });
      const result = await res.json();
      
      if(!res.ok){
        throw new Error("Failed to submit feedback");
      }
      await fetchComplaints(); // Refresh complaints to get updated feedback status
      return result;
    } catch (err) {
      console.error("Feedback error:", err);
      throw err;
    }
  };

  const rescheduleComplaint = async (id, preferredSlot, notes = "") => {
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredSlot, notes }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to reschedule complaint");
      }

      await fetchComplaints();
      return result;
    } catch (err) {
      console.error("Reschedule complaint error:", err);
      throw err;
    }
  };

  return (
    <ComplaintsContext.Provider
      value={{
        complaints,
        loading,
        error,
        fetchComplaints,
        createComplaint,
        resolveComplaint,
        submitFeedback,
        rescheduleComplaint
      }}
    >
      {children}
    </ComplaintsContext.Provider>
  );
};

export const useComplaints = () => {
  return useContext(ComplaintsContext);
};
