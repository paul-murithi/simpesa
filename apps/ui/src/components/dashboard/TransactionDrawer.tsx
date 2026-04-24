import { type TransactionUI } from "@app/types";
import {
  formatTransactionAmount,
  formatTransactionDate,
} from "../../utils/dashboard";

interface TransactionDrawerProps {
  transaction: TransactionUI;
  onClose: () => void;
}

const TransactionDrawer = ({
  transaction,
  onClose,
}: TransactionDrawerProps) => {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h2>Transaction Details</h2>
          <button className="drawer-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="drawer-content">
          <div className="detail-group">
            <div className="detail-label">Checkout ID</div>
            <div className="detail-value">{transaction.checkout_id}</div>
          </div>
          <div className="detail-group">
            <div className="detail-label">External Reference</div>
            <div className="detail-value">{transaction.external_reference}</div>
          </div>
          <div className="detail-group">
            <div className="detail-label">Status</div>
            <div className={`status status-${transaction.status}`}>
              {transaction.status}
            </div>
          </div>
          <div className="detail-group">
            <div className="detail-label">Phone Number</div>
            <div className="detail-value">{transaction.phone_number}</div>
          </div>
          <div className="detail-group">
            <div className="detail-label">Amount</div>
            <div className="detail-value">
              KES {formatTransactionAmount(transaction.amount)}
            </div>
          </div>
          <div className="detail-group">
            <div className="detail-label">Timestamp</div>
            <div className="detail-value">
              {formatTransactionDate(transaction.created_at)}
            </div>
          </div>
          <div className="detail-group">
            <div className="detail-label">Raw Metadata</div>
            <div className="metadata-box">
              {JSON.stringify(transaction.metadata || {}, null, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDrawer;
