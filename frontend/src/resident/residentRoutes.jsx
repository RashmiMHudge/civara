import { Routes, Route } from "react-router-dom";
import ResidentComplaints from "./ResidentComplaints";
import RaiseComplaint from "./RaiseComplaint";
import DetailComplaints from "./DetailComplaints";

const ResidentRoutes = () => {
  return (
    <Routes>
      <Route path="complaints" element={<ResidentComplaints />} />
      <Route path="complaints/raise" element={<RaiseComplaint />} />
      <Route path="complaints/:id" element={<DetailComplaints />} />
    </Routes>
  );
};

export default ResidentRoutes;
             
