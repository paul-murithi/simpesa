import { useState, useEffect } from "react";
import { getApiUrl } from "../../hooks/useDashboardTransactions";

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

interface StkPushFormProps {
  authToken: string | null;
  onAuthError?: () => void;
}

const StkPushForm = ({ authToken, onAuthError }: StkPushFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("254712345678");
  const [amount, setAmount] = useState("10");
  const [externalReference, setExternalReference] = useState("Order_001");
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<StkPushResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPhoneNumber("254712345678");
    setAmount("10");
    setExternalReference("Order_001");
    setResponse(null);
    setError(null);
    setIsSending(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authToken) {
      setError("Authorization token not available yet. Please wait.");
      return;
    }

    setIsSending(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(getApiUrl("/stkpush/v1/processrequest"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          short_code: "174379",
          phone_number: phoneNumber,
          amount: Number(amount),
          external_reference: externalReference,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        onAuthError?.();
        setError(
          "Session expired. Automatically refreshing token... Please try again.",
        );
        return;
      }

      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.message || "Failed to send STK push");
      }
    } catch (err) {
      setError("An error occurred while sending the request");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn-primary initiate-btn"
        onClick={() => setIsOpen(true)}
      >
        Initiate STK Push
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <h2>Initiate STK Push</h2>
              <p>Send a test payment request to a phone number</p>
            </div>

            {!response ? (
              <form onSubmit={handleSubmit} className="stk-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="phone_number">Phone Number</label>
                    <input
                      id="phone_number"
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="2547XXXXXXXX"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">Amount (KES)</label>
                    <input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="external_reference">Reference</label>
                    <input
                      id="external_reference"
                      type="text"
                      value={externalReference}
                      onChange={(e) => setExternalReference(e.target.value)}
                      placeholder="Order_001"
                      required
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSending}
                  >
                    {isSending ? "Sending..." : "Send STK Push"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                </div>

                {error && (
                  <div className="stk-response-error">
                    <p>{error}</p>
                  </div>
                )}
              </form>
            ) : (
              <div className="stk-success-view">
                <div className="stk-response-success">
                  <p>
                    <strong>Success:</strong> {response.ResponseDescription}
                  </p>
                  <div className="response-ids">
                    <span>
                      <strong>Checkout ID:</strong> {response.CheckoutRequestID}
                    </span>
                    <span>
                      <strong>Merchant ID:</strong> {response.MerchantRequestID}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleClose}
                  style={{ marginTop: "1.5rem", width: "100%" }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StkPushForm;
