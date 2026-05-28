// src/securityPortal/visitors/guardContext.js

import { securityStaffData } from "../../admin/data/securityStaffData";
import { shiftsData } from "../../admin/data/shiftsData";

// Get active guard context from localStorage (set at login)
export const getActiveGuardContext = () => {
  const guardId = localStorage.getItem("guardId");
  const name = localStorage.getItem("guardName");
  const email = localStorage.getItem("guardEmail");
  const phone = localStorage.getItem("guardPhone");
  const gate = localStorage.getItem("guardGate") || "Main Gate";
  // Optionally, fetch today's shift from backend if needed
  return {
    guardId,
    name,
    email,
    phone,
    gate
  };
};
