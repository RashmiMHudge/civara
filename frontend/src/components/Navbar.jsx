import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  // Smooth scroll function
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar">
      {/* Left Brand */}
      <div className="navbar-left" onClick={() => scrollToSection("home")}>
        <span className="brand-name">CIVARA</span>
        <span className="brand-tagline">Smart Living Platform</span>
      </div>

      {/* Right Links */}
      <div className="navbar-right">
        <button onClick={() => scrollToSection("about")}>About</button>
        <button onClick={() => scrollToSection("why")}>Why Civara</button>
        <button onClick={() => scrollToSection("Contact")}>Contact</button>
        <button className="primary-btn" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
