import React from "react";

const HeroSection = () => {
  return (
    <section style={{
      backgroundColor: "#61305D",
      height: "300px",       // make it bigger
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      paddingLeft: "40px"
    }}>
      <h1 style={{ fontSize: "5rem", margin: 0 ,color:"white"}}>Civara</h1>   {/* Bigger title */}
      <p style={{ fontSize: "1.8rem", marginTop: "10px", color: "rgba(5, 4, 4, 1)" }}>
        A Smart Resident Management System
      </p>
    </section>
  );
};

export default HeroSection;
