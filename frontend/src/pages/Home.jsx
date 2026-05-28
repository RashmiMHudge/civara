import React, { useState } from "react";


const Home = () => {
  const [activeRole, setActiveRole] = useState("residents");

  const roleContent = {
    residents: {
      title: "Residents",
      description:
        "Residents can raise complaints, track their status, receive important society updates, and approve visitors easily through a simple dashboard."
    },
    admins: {
      title: "Admins",
      description:
        "Administrators can manage complaints, assign tasks, monitor society activities, and oversee operations using a centralized admin dashboard."
    },
    security: {
      title: "Security",
      description:
        "Security personnel can monitor visitor entries, verify approvals in real time, and ensure safe access within the society."
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="hero" id="home">
        <div
          className="hero-bg"
          style={{
            backgroundImage: `url('/b2.png')`,
          }}
        />

        <div className="hero-content">
          <div className="hero-left">
            <h1>Civara</h1>
            <p>
            <h5> A Smart Resident Management System to manage complaints,
              visitors, and society operations efficiently.</h5>
            </p>
            <button onClick={() => (window.location.href = "/login")}>
              Get Started
            </button>
          </div>

          <div className="hero-right">
            <img src="/hero-image.png" alt="Civara illustration" />
          </div>
        </div>
      </section>


      {/* ABOUT */}
      <section className="about" id="about">
        <div className="about-container">
          <div className="about-left">
            <h2>About Civara</h2>
            <p>
              Civara is a smart resident management platform built to
              modernize how residential societies operate.
            </p>
            <p>
              It focuses on transparency, efficiency, and secure
              communication—making daily operations simpler.
            </p>
          </div>

          <div className="about-right">
            <div className="about-card">
              {/* <span>🛠️</span> */}
              <h4>Complaint Management</h4>
              <p>Register, track, and resolve issues transparently.</p>
            </div>

            <div className="about-card">
              {/* <span>🚪</span> */}
              <h4>Visitor Monitoring</h4>
              <p>Secure visitor entry with approval and tracking.</p>
            </div>

            <div className="about-card">
             {/* <span>📊</span>*/}
              <h4>Role-Based Access</h4>
              <p>Dedicated dashboards for all roles.</p>
            </div>

            <div className="about-card">
             {/* <span>💬</span>*/}
              <h4>Clear Communication</h4>
              <p>Keep everyone informed within the society.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CIVARA */}
      <section className="why-civara" id="why">
        <h2>Why Choose Civara?</h2>
        <p className="why-subtitle">
          One platform to replace manual processes and scattered communication.
        </p>

        <div className="why-cards">
          <div className="why-card">
            <h3>Centralized System</h3>
            <p>All operations managed from one unified dashboard.</p>
          </div>

          <div className="why-card">
            <h3>Transparent Workflow</h3>
            <p>Real-time tracking improves accountability.</p>
          </div>

          <div className="why-card">
            <h3>Faster Resolution</h3>
            <p>Automated assignments reduce delays.</p>
          </div>

          <div className="why-card">
            <h3>Secure Access</h3>
            <p>Role-based permissions ensure safety.</p>
          </div>
        </div>
      </section>
          
          {/* ROLES */}
          <section className="roles roles-bg">
               <div
                className="roles-bg-image"
                style={{ backgroundImage: "url('/b2.png')" }}
              />

              <div className="roles-content">
                <h2>Built for Everyone in the Society</h2>
                <div className="role-tabs">
                  <button
                    className={activeRole === "residents" ? "active" : ""}
                    onClick={() => setActiveRole("residents")}
                  >
                    Residents
                  </button>

                  <button
                      className={activeRole === "admins" ? "active" : ""}
                      onClick={() => setActiveRole("admins")}
                  >
                    Admins
                  </button>
                  <button
                      className={activeRole === "security" ? "active" : ""}
                      onClick={() => setActiveRole("security")}
                  >
                    Security
                  </button>
                </div>
                <div className="role-content">
                  <h3>{roleContent[activeRole].title}</h3>
                  <p>{roleContent[activeRole].description}</p>
                </div>
              </div>
            </section>
      {/* CONTACT */}
      <section className="contact" id="Contact">
        <div className="contact-wrapper">
          <div className="contact-image">
            <img src="/contact.png" alt="Contact Civara" />
          </div>

          <div className="contact-content">
            <h2>Get in Touch</h2>
            <p className="contact-subtext">
              Have questions or want to collaborate? Let’s talk.
            </p>

           <form className="contact-form">
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input type="text" placeholder="Your name" />
              </div>

              <div className="input-group">
                  <span className="input-icon">📧</span>
                  <input type="email" placeholder="Your email" />
              </div>

              <div className="input-group textarea-group">
                {/*<span className="input-icon">💬</span>*/}
                <textarea placeholder="Write your message..." rows="4" />
              </div>

              <button type="submit">Send Message</button>   
              <p className="form-note">
                  Your details are safe. We reply within 24–48 hours.
               </p>
            </form>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>CIVARA</h3>
            <p>Smart Living Platform</p>
          </div>

          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#why">Why Civara</a>
            <a href="#contact">Contact</a>
            <a href="/login">Login</a>
          </div>

          <div className="footer-copy">
            © {new Date().getFullYear()} Civara. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
