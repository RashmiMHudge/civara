import React, { useState } from "react";
import { useEffect } from "react";
import VisitorsList from "./VisitorsList";
import API_BASE from "../../config/api";
//import visitorsData from "../../admin/data/visitorsData";
import "./visitors.css";
import QRScannerModal from "./QRScannerModal";
import VerifyVisitorModal from "./VerifyVisitorModal";


const Visitors = () => {
  const [visitors, setVisitors] = useState([]); 
  const [loading, setLoading] = useState(true);
  //const [search , setSearch] = useState("");

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/visitors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message);
        return;
      }

      setVisitors(data);

    } catch (error) {
      console.error("Failed to fetch visitors", error);
    } finally {
      setLoading(false);
    }
  };
  const updateVisitorStatus = async (id, status) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/visitors/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message);
        return;
      }

      fetchVisitors(); // refresh list

    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const [scanOpen, setScanOpen] = useState(false);
  const [verifyVisitor, setVerifyVisitor] = useState(null);

  const handleQRScan = (text) => {
      setScanOpen(false);

      const cleanText = text.trim();
      const [visitorId, inviteCode] = cleanText
        .split("|")
        .map(v => v.trim());

      const visitor = visitors.find(
        (v) => v._id === visitorId && v.inviteCode === inviteCode && ["EXPECTED", "APPROVED"].includes(v.status)
      );

      if (!visitor) {
        alert("Invalid or expired QR code");
        return;
      }

      // ✅ ONLY here we open Verify modal
      setVerifyVisitor(visitor);
    };


  return (
    <div className="page-container">
      <h1 className="page-title">Visitors</h1>
      
      <p className="muted-text">
        Verify visitor entry using invite code or ID
      </p>
       
      <br />

      {loading && <p className="muted-text">Loading visitors...</p>}
      {!loading && visitors.length === 0 && (
        <p className="muted-text">No visitor requests at the moment.</p>
      )}

      <VisitorsList
        visitors={visitors}
        onUpdate={updateVisitorStatus}
        onScan={()=>{
          setScanOpen(true);
        }}
      />
      
      {scanOpen && (
        <QRScannerModal
          onScan={handleQRScan}
          onClose={() => setScanOpen(false)}
        />
      )}
    
     {verifyVisitor && (
        <VerifyVisitorModal
          visitor={verifyVisitor}
          onClose={() => setVerifyVisitor(null)}
          onDecision={(status, extra) => {
            updateVisitorStatus(verifyVisitor._id, status, extra);
            setVerifyVisitor(null);
          }}
        />
      )}

    </div>
  );
};

export default Visitors;
