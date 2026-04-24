import { useEffect } from "react";
import { type TransactionUI } from "@app/types";
import { getApiUrl } from "./useDashboardTransactions";

interface UseAutoApprovePinParams {
  autoApprove: boolean;
  pendingPinTx: TransactionUI | null;
  setPendingPinTx: (tx: TransactionUI | null) => void;
}

export const useAutoApprovePin = ({
  autoApprove,
  pendingPinTx,
  setPendingPinTx,
}: UseAutoApprovePinParams) => {
  useEffect(() => {
    if (!autoApprove || !pendingPinTx) return;

    const submitAutoPin = async () => {
      try {
        await fetch(getApiUrl(`/stkpush/pin/${pendingPinTx.checkout_id}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: "1234" }),
        });
        setPendingPinTx(null);
      } catch (error) {
        console.error("Auto-approve PIN failed", error);
      }
    };

    submitAutoPin();
  }, [autoApprove, pendingPinTx, setPendingPinTx]);
};
