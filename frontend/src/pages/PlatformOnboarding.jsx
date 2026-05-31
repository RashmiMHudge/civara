import React, { useEffect, useMemo, useState } from "react";
import API_BASE from "../config/api";
import "../styles/PlatformOnboarding.css";

const INITIAL_FORM = {
  societyName: "",
  societyAddress: "",
  societyContact: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
  societyCode: "",
};

const PlatformOnboarding = () => {
  const [platformSecret, setPlatformSecret] = useState(() => localStorage.getItem("platformSecret") || "");
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [societies, setSocieties] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSocieties, setIsLoadingSocieties] = useState(false);

  const hasSecret = useMemo(() => Boolean(platformSecret.trim()), [platformSecret]);
  const societyCount = societies.length;

  const handleSecretChange = (event) => {
    const nextValue = event.target.value;
    setPlatformSecret(nextValue);
    localStorage.setItem("platformSecret", nextValue);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fetchSocieties = async (secret) => {
    if (!String(secret || "").trim()) {
      setSocieties([]);
      return;
    }

    setIsLoadingSocieties(true);
    try {
      const response = await fetch(`${API_BASE}/api/platform/societies`, {
        headers: {
          "x-platform-secret": secret.trim(),
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load societies");
      }

      setSocieties(Array.isArray(data?.societies) ? data.societies : []);
    } catch (error) {
      setSocieties([]);
      setStatus({
        type: "error",
        message: error.message || "Failed to load societies",
      });
    } finally {
      setIsLoadingSocieties(false);
    }
  };

  useEffect(() => {
    if (!hasSecret) return;
    fetchSocieties(platformSecret);
  }, [hasSecret, platformSecret]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE}/api/platform/societies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-platform-secret": platformSecret.trim(),
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to create society");
      }

      setForm(INITIAL_FORM);
      setStatus({
        type: "success",
        message: `Created ${data?.society?.societyName || "society"} with code ${data?.society?.societyCode || ""}.`,
      });
      await fetchSocieties(platformSecret);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Failed to create society",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="platform-page">
      <section className="platform-hero">
        <div className="platform-hero__inner">
          <div className="platform-hero__copy">
            <p className="platform-kicker">Platform Onboarding</p>
            <h1>Set up a new society and first admin</h1>
            <p>
              Create the next Civara tenant, generate a society code, and hand over the first
              admin account without touching seed scripts.
            </p>

            <div className="platform-overview">
              <div className="platform-overview__card">
                <span>Societies onboarded</span>
                <strong>{societyCount}</strong>
              </div>
              <div className="platform-overview__card">
                <span>Setup model</span>
                <strong>Single product, multi-society</strong>
              </div>
              <div className="platform-overview__card">
                <span>Next society code</span>
                <strong>Auto-generated unless you override it</strong>
              </div>
            </div>
          </div>

          <div className="platform-secret">
            <div className="platform-secret__head">
              <div>
                <p className="platform-secret__eyebrow">Access</p>
                <h2>Platform Secret</h2>
              </div>
              <span className={`platform-secret__badge ${hasSecret ? "is-ready" : "is-missing"}`}>
                {hasSecret ? "Saved in browser" : "Required"}
              </span>
            </div>

            <label htmlFor="platformSecret">Secret Key</label>
            <br />
            <input
              id="platformSecret"
              type="password"
              value={platformSecret}
              onChange={handleSecretChange}
              placeholder="Enter platform secret"
            />
          </div>
        </div>
      </section>

      <section className="platform-section">
        <div className="platform-section__inner">
          <form className="platform-form" onSubmit={handleSubmit}>
            <div className="platform-section__head">
              <h2>Create Society</h2>
              <p>
                Create the first admin account and lock the new society into its own tenant space.
                Use a custom society code only when you really need one.
              </p>
            </div>

            <div className="platform-tip">
              <strong>Recommended flow:</strong> create the society, send the admin their credentials,
              then let that admin add residents and security staff inside their own portal.
            </div>

            <div className="platform-grid">
              <label>
                Society Name
                <input
                  type="text"
                  name="societyName"
                  value={form.societyName}
                  onChange={handleFieldChange}
                  placeholder="Green Valley Residency"
                  required
                />
              </label>

              <label>
                Society Contact
                <input
                  type="text"
                  name="societyContact"
                  value={form.societyContact}
                  onChange={handleFieldChange}
                  placeholder="+91 9876543210"
                />
              </label>

              <label className="platform-grid__full">
                Society Address
                <input
                  type="text"
                  name="societyAddress"
                  value={form.societyAddress}
                  onChange={handleFieldChange}
                  placeholder="Pune, Maharashtra"
                />
              </label>

              <label>
                First Admin Name
                <input
                  type="text"
                  name="adminName"
                  value={form.adminName}
                  onChange={handleFieldChange}
                  placeholder="Asha Patil"
                  required
                />
              </label>

              <label>
                First Admin Email
                <input
                  type="email"
                  name="adminEmail"
                  value={form.adminEmail}
                  onChange={handleFieldChange}
                  placeholder="admin@greenvalley.com"
                  required
                />
              </label>

              <label>
                First Admin Phone
                <input
                  type="text"
                  name="adminPhone"
                  value={form.adminPhone}
                  onChange={handleFieldChange}
                  placeholder="+91 9988776655"
                />
              </label>

              <label>
                First Admin Password
                <input
                  type="text"
                  name="adminPassword"
                  value={form.adminPassword}
                  onChange={handleFieldChange}
                  placeholder="admin@123"
                  required
                />
              </label>

              <label>
                Custom Society Code
                <input
                  type="text"
                  name="societyCode"
                  value={form.societyCode}
                  onChange={handleFieldChange}
                  placeholder="Optional, e.g. CIV-010"
                />
              </label>
            </div>

            <div className="platform-actions">
              <button type="submit" disabled={!hasSecret || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Society"}
              </button>
              {status.message ? (
                <p className={`platform-status ${status.type === "error" ? "is-error" : "is-success"}`}>
                  {status.message}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="platform-section platform-section--light">
        <div className="platform-section__inner">
          <div className="platform-section__head">
            <h2>Onboarded Societies</h2>
            <p>Use this list to sanity-check the tenant setup, admin mapping, and society-contact details.</p>
          </div>

          {!hasSecret ? (
            <div className="platform-empty">
              Add the platform secret above to load the society list.
            </div>
          ) : isLoadingSocieties ? (
            <div className="platform-empty">Loading societies...</div>
          ) : societies.length === 0 ? (
            <div className="platform-empty">No societies found yet.</div>
          ) : (
            <div className="platform-list">
              {societies.map((society) => (
                <article className="platform-society" key={`${society.societyCode}-${society.admin.email}`}>
                  <div className="platform-society__top">
                    <div>
                      <p className="platform-society__code">{society.societyCode}</p>
                      <h3>{society.societyName || "Unnamed society"}</h3>
                    </div>
                    <span className="platform-chip">Admin ready</span>
                  </div>

                  <div className="platform-society__meta">
                    <div className="platform-society__item">
                      <span>Admin</span>
                      <strong>{society.admin.name}</strong>
                    </div>
                    <div className="platform-society__item">
                      <span>Email</span>
                      <strong>{society.admin.email}</strong>
                    </div>
                    <div className="platform-society__item">
                      <span>Admin Phone</span>
                      <strong>{society.admin.phone || "Not provided"}</strong>
                    </div>
                    <div className="platform-society__item">
                      <span>Society Contact</span>
                      <strong>{society.societyContact || "Not provided"}</strong>
                    </div>
                    <div className="platform-society__item platform-society__address">
                      <span>Address</span>
                      <strong>{society.societyAddress || "Not provided"}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlatformOnboarding;
