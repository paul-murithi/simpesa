import React from "react";
import { useDashboardTransactions } from "./hooks/useDashboardTransactions";
import {
  dashboardStatusOptions,
  formatTransactionAmount,
  formatTransactionDate,
  formatTransactionDateShort,
  formatTransactionCheckoutPreview,
} from "./utils/dashboard";
import "./Dashboard.css";

const formatUpdateTime = (date: Date | null) => {
  if (!date) return "Waiting for updates";
  return date.toLocaleTimeString();
};

const Dashboard: React.FC = () => {
  const {
    filteredTransactions,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isConnected,
    isReconnecting,
    lastUpdateAt,
    selectedTx,
    setSelectedTx,
  } = useDashboardTransactions();

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <div className="top-identity">
          <div className="brand-logo" aria-label="Sim-Pesa">
            Sim-Pesa
          </div>
          <div className="page-context">
            <h1>Transactions Dashboard</h1>
            <p>Real-time transaction lifecycle monitor</p>
          </div>
        </div>

        <div className="top-meta">
          <div className="system-status">
            <div
              className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
            ></div>
            <span>{isConnected ? "LIVE MONITORING" : "DISCONNECTED"}</span>
            {isReconnecting && (
              <span className="reconnect-hint">Reconnecting...</span>
            )}
          </div>
          <div className="top-summary">
            <strong>{filteredTransactions.length}</strong> Transactions Shown
            <span className="last-update">
              Last update: {formatUpdateTime(lastUpdateAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <select
          className="filter-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {dashboardStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search phone or ID..."
          className="filter-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="transaction-feed">
        <div className="transaction-list">
          {filteredTransactions.map((tx) => (
            <button
              key={tx.checkout_id}
              type="button"
              className="transaction-card"
              aria-label={`Open transaction ${tx.checkout_id}`}
              onClick={() => setSelectedTx(tx)}
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

      {selectedTx && (
        <div className="drawer-overlay" onClick={() => setSelectedTx(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Transaction Details</h2>
              <button
                className="drawer-close"
                onClick={() => setSelectedTx(null)}
              >
                &times;
              </button>
            </div>
            <div className="drawer-content">
              <div className="detail-group">
                <div className="detail-label">Checkout ID</div>
                <div className="detail-value">{selectedTx.checkout_id}</div>
              </div>
              <div className="detail-group">
                <div className="detail-label">External Reference</div>
                <div className="detail-value">
                  {selectedTx.external_reference}
                </div>
              </div>
              <div className="detail-group">
                <div className="detail-label">Status</div>
                <div className={`status status-${selectedTx.status}`}>
                  {selectedTx.status}
                </div>
              </div>
              <div className="detail-group">
                <div className="detail-label">Phone Number</div>
                <div className="detail-value">{selectedTx.phone_number}</div>
              </div>
              <div className="detail-group">
                <div className="detail-label">Amount</div>
                <div className="detail-value">
                  KES {formatTransactionAmount(selectedTx.amount)}
                </div>
              </div>
              <div className="detail-group">
                <div className="detail-label">Timestamp</div>
                <div className="detail-value">
                  {formatTransactionDate(selectedTx.created_at)}
                </div>
              </div>
              <div className="detail-group">
                <div className="detail-label">Raw Metadata</div>
                <div className="metadata-box">
                  {JSON.stringify(selectedTx.metadata || {}, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
