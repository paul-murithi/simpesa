import { type TransactionUI } from "@app/types";
import {
  dashboardStatusOptions,
  formatTransactionAmount,
  formatTransactionCheckoutPreview,
  formatTransactionDateShort,
} from "../../utils/dashboard";

interface LiveFeedPanelProps {
  isConnected: boolean;
  isReconnecting: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  filteredTransactions: TransactionUI[];
  onSelectTransaction: (transaction: TransactionUI) => void;
}

const LiveFeedPanel = ({
  isConnected,
  isReconnecting,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredTransactions,
  onSelectTransaction,
}: LiveFeedPanelProps) => {
  return (
    <section className="live-feed-panel">
      <div className="live-feed-header">
        <div className="live-feed-title-wrap">
          <h2>Live feed</h2>
          <div className="system-status">
            <div
              className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
            ></div>
            <span>SSE: {isConnected ? "connected" : "disconnected"}</span>
            {isReconnecting && (
              <span className="reconnect-hint">Reconnecting...</span>
            )}
          </div>
        </div>

        <div className="feed-filters-wrap">
          <input
            type="text"
            placeholder="Search phone or ID..."
            className="filter-input"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />

          <div
            className="status-filters"
            role="tablist"
            aria-label="Status filters"
          >
            {dashboardStatusOptions.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                className={`status-filter-btn ${statusFilter === option.value ? "active" : ""}`}
                onClick={() => onStatusFilterChange(option.value)}
              >
                {option.value === "" ? "All" : option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="transaction-feed">
        <div className="transaction-list">
          {filteredTransactions.map((tx) => (
            <button
              key={tx.checkout_id}
              type="button"
              className="transaction-card"
              aria-label={`Open transaction ${tx.checkout_id}`}
              onClick={() => onSelectTransaction(tx)}
            >
              <div className="phone">
                {tx.phone_number}
                <div className="short-code">SC: {tx.short_code}</div>
              </div>
              <div className="amount">
                KES {formatTransactionAmount(tx.amount)}
              </div>
              <div>
                <span className={`status status-${tx.status}`}>
                  {tx.status}
                </span>
              </div>
              <div className="timestamp">
                {formatTransactionDateShort(tx.created_at)}
              </div>
              <div className="checkout-id" title={tx.checkout_id}>
                ID: {formatTransactionCheckoutPreview(tx.checkout_id)}
              </div>
            </button>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="empty-state">No transactions found</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveFeedPanel;
