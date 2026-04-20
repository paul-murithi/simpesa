import React, { useMemo, useState } from "react";
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
    transactions,
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
  const [autoApprove, setAutoApprove] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  const apiKeyPreview = "Bearer ey...xK9f";

  const todaysTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((transaction) => {
      const createdAt = new Date(transaction.created_at);

      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate()
      );
    });
  }, [transactions]);

  const totalToday = todaysTransactions.length;
  const successToday = todaysTransactions.filter(
    (transaction) => transaction.status === "SUCCESS",
  ).length;
  const failedToday = todaysTransactions.filter(
    (transaction) => transaction.status === "FAILED",
  ).length;
  const successRate =
    totalToday === 0 ? 0 : Math.round((successToday / totalToday) * 100);

  const latestTransaction = transactions[0] ?? null;
  const merchantBalance = latestTransaction?.merchant_balance;
  const userBalance = latestTransaction?.user_balance;
  const userStatus = latestTransaction?.user_status ?? "UNKNOWN";

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyPreview);
      setCopiedKey(true);
      window.setTimeout(() => setCopiedKey(false), 1200);
    } catch (error) {
      console.error("Failed to copy API key", error);
      setCopiedKey(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="top-bar">
        <div className="brand-logo" aria-label="Sim-Pesa">
          <span className="brand-sim">sim</span>
          <span className="brand-pesa">pesa</span>
        </div>

        <div className="top-actions">
          <label className="toggle-group" htmlFor="auto-approve-toggle">
            <span>Auto-approve</span>
            <button
              id="auto-approve-toggle"
              type="button"
              role="switch"
              aria-checked={autoApprove}
              className={`toggle-switch ${autoApprove ? "enabled" : ""}`}
              onClick={() => setAutoApprove((current) => !current)}
            >
              <span className="toggle-knob" />
            </button>
          </label>

          <div className="api-key-preview">
            <span>{apiKeyPreview}</span>
            <button type="button" onClick={handleCopyApiKey}>
              {copiedKey ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="top-section card">
          <div className="sidebar-section">
            <span className="section-title">Monitor</span>
            <button type="button" className="sidebar-link active">
              Transactions
            </button>
          </div>

          <div className="sidebar-section">
            <span className="section-title">Config</span>
            <button type="button" className="sidebar-link">
              Merchant
            </button>
            <button type="button" className="sidebar-link">
              Test users
            </button>
          </div>
        </div>
        <div className="bottom-section card">
          <div className="merchant-card">
            <h3>Merchant</h3>
            <div className="merchant-detail">
              <span>Paybill</span>
              <strong>
                {latestTransaction?.short_code
                  ? `${latestTransaction.short_code} (active)`
                  : "No live data"}
              </strong>
            </div>
            <div className="merchant-detail">
              <span>Balance</span>
              <strong>
                {merchantBalance
                  ? `KES ${formatTransactionAmount(merchantBalance)}`
                  : "KES --"}
              </strong>
            </div>
            <div className="merchant-detail">
              <span>Last state</span>
              <strong>{latestTransaction?.status ?? "UNKNOWN"}</strong>
            </div>
          </div>
          <div className="merchant-card">
            <h3>User</h3>
            <div className="merchant-detail">
              <span>Phone</span>
              <strong>
                {latestTransaction?.phone_number ?? "No live data"}
              </strong>
            </div>
            <div className="merchant-detail">
              <span>Status</span>
              <strong>{userStatus}</strong>
            </div>
            <div className="merchant-detail">
              <span>Balance</span>
              <strong>
                {userBalance
                  ? `KES ${formatTransactionAmount(userBalance)}`
                  : "KES --"}
              </strong>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <section className="stats-grid">
          <article className="stat-card">
            <p>Total today</p>
            <strong>{totalToday}</strong>
            <span>Last webhook fired: {formatUpdateTime(lastUpdateAt)}</span>
          </article>

          <article className="stat-card success">
            <p>Success rate</p>
            <strong>{successRate}%</strong>
            <span>{successToday} successful today</span>
          </article>

          <article className="stat-card failed">
            <p>Failed</p>
            <strong>{failedToday}</strong>
            <span>Requires attention</span>
          </article>
        </section>

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                    onClick={() => setStatusFilter(option.value)}
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
        </section>
      </main>

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
