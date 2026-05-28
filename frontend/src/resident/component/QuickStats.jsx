import React from "react";

const WelcomeCard = ({ resident }) => {
  return (
    <div className="card" style={{ marginBottom: "20px" }}>
      <h2>Welcome, {resident.name}</h2>
      <p className="muted-text">
        Flat: <strong>{resident.flat}</strong> • Role:{" "}
        <strong>{resident.role}</strong>
      </p>
    </div>
  );
};

export default WelcomeCard;
