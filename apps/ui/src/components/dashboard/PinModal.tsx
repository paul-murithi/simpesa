import { useState } from "react";
import { getApiUrl } from "../../hooks/useDashboardTransactions";
import { formatTransactionAmount } from "../../utils/dashboard";
import "./PinModal.css";

interface PinModalProps {
  checkoutId: string;
  amount: string;
  onClose: () => void;
}

const PinModal = ({ checkoutId, amount, onClose }: PinModalProps) => {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setHasError(false);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;

    setIsSubmitting(true);
    setHasError(false);
    try {
      const response = await fetch(getApiUrl(`/stkpush/pin/${checkoutId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        onClose();
      } else {
        setHasError(true);
        setPin("");
        console.error("Failed to submit PIN");
      }
    } catch (error) {
      setHasError(true);
      setPin("");
      console.error("Error submitting PIN", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await fetch(getApiUrl(`/stkpush/cancel/${checkoutId}`), {
        method: "POST",
      });
      onClose();
    } catch (error) {
      console.error("Error cancelling transaction", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pin-modal-overlay">
      <div className="phone-container">
        <div className={`phone-chrome ${hasError ? "shake" : ""}`}>
          <div className="phone-notch">
            <div className="phone-speaker"></div>
          </div>

          <div className="phone-screen">
            <div className="status-bar">
              <div className="status-left">9:41</div>
              <div className="status-right">
                <div className="signal-bars">
                  <div className="signal-bar" style={{ height: "4px" }}></div>
                  <div className="signal-bar" style={{ height: "6px" }}></div>
                  <div className="signal-bar" style={{ height: "8px" }}></div>
                  <div className="signal-bar" style={{ height: "10px" }}></div>
                </div>
                <div className="wifi-icon">
                  <div className="wifi-arc" style={{ width: "14px", top: "0" }}></div>
                  <div className="wifi-arc" style={{ width: "10px", top: "3px" }}></div>
                  <div className="wifi-arc" style={{ width: "6px", top: "6px" }}></div>
                </div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>

            <div className="stk-content">
              <div className="provider-logo">Safaricom</div>
              <div className="stk-message">
                Enter M-PESA PIN to authorize payment of{" "}
                <span className="stk-amount">
                  KES {formatTransactionAmount(amount)}
                </span>{" "}
                to SIM-PESA.
              </div>

              <div className="pin-display">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`pin-dot ${pin.length > i ? "filled" : ""}`}
                  />
                ))}
              </div>
            </div>

            {isSubmitting && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p className="loading-text">Processing...</p>
              </div>
            )}

            <div className="numpad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="num-btn"
                  onClick={() => handleNumberClick(num.toString())}
                  disabled={isSubmitting}
                >
                  {num}
                </button>
              ))}
              <button
                className="num-btn special cancel"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="num-btn"
                onClick={() => handleNumberClick("0")}
                disabled={isSubmitting}
              >
                0
              </button>
              <button
                className="num-btn special backspace"
                onClick={handleBackspace}
                disabled={isSubmitting || pin.length === 0}
              >
                ⌫
              </button>
              <button
                className={`num-btn ok ${pin.length === 4 ? "enabled" : ""}`}
                onClick={handleSubmit}
                disabled={pin.length !== 4 || isSubmitting}
              >
                {isSubmitting ? "Processing..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModal;
