import React, { useState } from "react";
import "../styles/Signup.css";

const Signup = () => {
  const [activeTab, setActiveTab] = useState("existing");

  return (
    <div className="signup-container">
      {/* Left Side with Background Image */}
      <div className="signup-left"></div>

      {/* Right Side with Signup Box */}
      <div className="signup-right">
        <div className="signup-box">
          <h1 className="signup-title">Join Civara Today!</h1>

          {/* Toggle Buttons */}
          <div className="signup-toggle">
            <button
              className={activeTab === "existing" ? "active" : ""}
              onClick={() => setActiveTab("existing")}
            >
              Join Existing Society
            </button>
            <button
              className={activeTab === "new" ? "active" : ""}
              onClick={() => setActiveTab("new")}
            >
              Register New Society
            </button>
          </div>

          {activeTab === "existing" ? (
            <>
              <h2>Create Account</h2>
              <form>
                <div className="input-group">
                  <label>Society Name</label>
                  <select>
                    <option>Select Society</option>
                    <option>Sunrise Residency</option>
                    <option>GreenHeights Apartments</option>
                    <option>Silver Oaks Society</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter your full name" />
                </div>

                <div className="input-group">
                  <label>Role</label>
                  <select>
                    <option>Resident</option>
                    <option>Security</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="Enter your email" />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input type="password" placeholder="Enter your password" />
                </div>

                <button type="submit" className="signup-btn">
                  Join Society
                </button>

                <p className="login-link">
                  Already have an account? <a href="/login">Login</a>
                </p>
              </form>
            </>
          ) : (
            <>
              <h2>Register New Society</h2>
              <form>
                <div className="input-group">
                  <label>Society Name</label>
                  <input type="text" placeholder="Enter society name" />
                </div>

                <div className="input-group">
                  <label>Address</label>
                  <input type="text" placeholder="Enter society address" />
                </div>

                <div className="input-group">
                  <label>Admin Name</label>
                  <input type="text" placeholder="Enter admin name" />
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="Enter admin email" />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input type="password" placeholder="Create password" />
                </div>

                <button type="submit" className="signup-btn">
                  Register Society
                </button>

                <p className="login-link">
                  Already have an account? <a href="/login">Login</a>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
