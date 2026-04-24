import { useEffect, useRef, useState } from "react";
import { getApiUrl } from "../../hooks/useDashboardTransactions";
import { formatTransactionAmount } from "../../utils/dashboard";

interface PinModalProps {
  checkoutId: string;
  amount: string;
  onClose: () => void;
}

const PinModal = ({ checkoutId, amount, onClose }: PinModalProps) => {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    inputRefs[0]!.current?.focus();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1]!.current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1]!.current?.focus();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const pinString = pin.join("");
    if (pinString.length !== 4) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl(`/stkpush/pin/${checkoutId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinString }),
      });

      if (response.ok) {
        onClose();
      } else {
        console.error("Failed to submit PIN");
      }
    } catch (error) {
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
      <div className="pin-modal">
        <div className="pin-modal-header">
          <h2>Enter PIN</h2>
          <p>Confirm payment of KES {formatTransactionAmount(amount)}</p>
        </div>
        <form className="pin-form" onSubmit={handleSubmit}>
          <div className="pin-input-group">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handlePinChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className="pin-digit-input"
                disabled={isSubmitting}
              />
            ))}
          </div>
          <div className="pin-modal-actions">
            <button
              type="submit"
              className="btn-send"
              disabled={pin.join("").length !== 4 || isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Send"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
