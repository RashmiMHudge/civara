import React, { useState } from "react";
import API_BASE from "../config/api";

const Home = () => {
  const [activeRole, setActiveRole] = useState("residents");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [contactStatus, setContactStatus] = useState({ type: "", message: "" });
  const [isSending, setIsSending] = useState(false);

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

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    if (isSending) return;

    setIsSending(true);
    setContactStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/api/public/contact-inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(contactForm)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      setContactForm({
        name: "",
        email: "",
        message: ""
      });
      setContactStatus({
        type: "success",
        message: data?.message || "Your message has been sent successfully."
      });
    } catch (error) {
      setContactStatus({
        type: "error",
        message: error.message || "Failed to send message"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <section className="hero" id="home">
        <div
          className="hero-bg"
          style={{
            backgroundImage: "url('/b2.png')"
          }}
        />

        <div className="hero-content">
          <div className="hero-left">
            <h1>Civara</h1>
            <p>
              <h5>
                A Smart Resident Management System to manage complaints,
                visitors, and society operations efficiently.
              </h5>
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

      <section className="about" id="about">
        <div className="about-container">
          <div className="about-left">
            <h2>About Civara</h2>
            <p>
              Civara is a smart resident management platform built to modernize
              how residential societies operate.
            </p>
            <p>
              It focuses on transparency, efficiency, and secure communication,
              making daily operations simpler.
            </p>
          </div>

          <div className="about-right">
            <div className="about-card">
              <h4>Complaint Management</h4>
              <p>Register, track, and resolve issues transparently.</p>
            </div>

            <div className="about-card">
              <h4>Visitor Monitoring</h4>
              <p>Secure visitor entry with approval and tracking.</p>
            </div>

            <div className="about-card">
              <h4>Role-Based Access</h4>
              <p>Dedicated dashboards for all roles.</p>
            </div>

            <div className="about-card">
              <h4>Clear Communication</h4>
              <p>Keep everyone informed within the society.</p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="contact" id="contact">
        <div className="contact-wrapper">
          <div className="contact-image">
            <img src="/contact.png" alt="Contact Civara" />
          </div>

          <div className="contact-content">
            <h2>Get in Touch</h2>
            <p className="contact-subtext">
              Share your society details, onboarding plans, or implementation
              needs and we will reach out to you.
            </p>

            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="input-group">
                <span className="input-icon">@</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon">@</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <div className="input-group textarea-group">
                <textarea
                  name="message"
                  placeholder="Write your message..."
                  rows="4"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                />
              </div>

              <button type="submit" disabled={isSending}>
                {isSending ? "Sending..." : "Send Message"}
              </button>

              {contactStatus.message ? (
                <p
                  className="form-note"
                  style={{
                    color: contactStatus.type === "error" ? "#b42318" : "#157347",
                    marginTop: 12
                  }}
                >
                  {contactStatus.message}
                </p>
              ) : null}

              <p className="form-note">
                Your message goes directly to the Civara developer.
              </p>
            </form>
          </div>
        </div>
      </section>

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
            &copy; {new Date().getFullYear()} Civara. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
