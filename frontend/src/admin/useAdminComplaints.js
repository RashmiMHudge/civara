import complaintsData from "./data/complaintsData";

export const useAdminComplaints = () => {
  // later this becomes: fetch("/api/admin/complaints")
  return {
    complaints: complaintsData,
  };
};
