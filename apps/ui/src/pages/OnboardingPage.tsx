import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Onboarding.css";
import "../Dashboard.css"; // Reuse dashboard variables

const OnboardingPage = () => {
  const [shortCode, setShortCode] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/onboarding/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shortCode, callbackUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const data = await response.json();
      if (data.success) {
        // Registration successful, the API has flipped the isFirstRun flag
        navigate("/dashboard");
      } else {
        setError("Failed to complete onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container dashboard-container">
      <div className="onboarding-card">
        <div className="brand-logo" style={{ justifyContent: "center", marginBottom: "1rem" }}>
          <span className="brand-sim">sim</span>
          <span className="brand-pesa">pesa</span>
        </div>
        <h1>Welcome to SimPesa</h1>
        <p>Let's get your simulator configured in under 60 seconds.</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="shortCode">Short Code</label>
            <input
              type="text"
              id="shortCode"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="e.g. 174379"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="callbackUrl">Callback URL</label>
            <input
              type="url"
              id="callbackUrl"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              placeholder="https://your-api.com/callback"
              required
            />
            <small>This is where we'll send STK Push results.</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-setup" disabled={loading}>
            {loading ? "Configuring..." : "Finish Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
