import React, { useState, useEffect } from "react";
import { getApiUrl } from "../../hooks/useDashboardTransactions";
import "./MerchantConfigModal.css";

interface MerchantConfigModalProps {
  token: string | null;
  onClose: () => void;
}

interface MerchantConfig {
  short_code: string;
  callback_url: string;
}

const MerchantConfigModal = ({ token, onClose }: MerchantConfigModalProps) => {
  const [config, setConfig] = useState<MerchantConfig | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!token) return;

      try {
        const response = await fetch(getApiUrl("/api/v1/merchant"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch merchant configuration");
        }

        const data = await response.json();
        setConfig(data);
        setCallbackUrl(data.callback_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(getApiUrl("/api/v1/merchant"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ callbackUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update configuration");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="pin-modal-header">
          <h2>Merchant Configuration</h2>
          <p>Update your simulator settings</p>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading configuration...</div>
        ) : error && !config ? (
          <div className="stk-response-error">
            <p>{error}</p>
            <button className="btn-cancel" onClick={onClose} style={{ marginTop: '1rem', width: '100%' }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stk-form">
            <div className="form-group">
              <label>Short Code (Paybill)</label>
              <input
                type="text"
                value={config?.short_code || ""}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <small style={{ color: 'var(--text-disabled)', fontSize: '0.7rem' }}>
                Short code cannot be changed after setup.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="callbackUrl">Callback URL</label>
              <input
                id="callbackUrl"
                type="url"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="https://your-api.com/callback"
                required
              />
              <small style={{ color: 'var(--text-disabled)', fontSize: '0.7rem' }}>
                This is where the simulator will send STK Push results.
              </small>
            </div>

            {error && <div className="stk-response-error"><p>{error}</p></div>}
            {success && <div className="stk-response-success"><p>Configuration updated successfully!</p></div>}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving || !callbackUrl}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MerchantConfigModal;
