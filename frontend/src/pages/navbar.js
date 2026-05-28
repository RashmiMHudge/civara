import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const isAuth = localStorage.getItem("isAuth");
  const role = localStorage.getItem("role");

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToDashboard = () => {
    if (role === "ADMIN") navigate("/admin/dashboard");
    else if (role === "RESIDENT") navigate("/resident/dashboard");
    else if (role === "SECURITY") navigate("/security/dashboard");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      {!isAuth ? (
        <>
          <span onClick={() => scrollToSection("about")}>About Us</span>
          <span onClick={() => scrollToSection("why")}>Why Civara</span>
          <span onClick={() => navigate("/contact")}>Contact Civara</span>
          <span onClick={() => navigate("/login")}>Login</span>
        </>
      ) : (
        <>
          <span onClick={goToDashboard}>Dashboard</span>
          <span onClick={handleLogout}>Logout</span>
        </>
      )}
    </nav>
  );
};

export default Navbar;
