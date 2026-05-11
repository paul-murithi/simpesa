import { useState } from "react";
import LiveFeedPanel from "./components/dashboard/LiveFeedPanel";
import PinModal from "./components/dashboard/PinModal";
import MerchantConfigModal from "./components/dashboard/MerchantConfigModal";
import Sidebar from "./components/dashboard/Sidebar";
import CompactStatusBar from "./components/dashboard/StatsGrid";
import StkPushForm from "./components/dashboard/StkPushForm";
import TopBar from "./components/dashboard/TopBar";
import TransactionDrawer from "./components/dashboard/TransactionDrawer";
import { useAutoApprovePin } from "./hooks/useAutoApprovePin";
import { useClipboardCopy } from "./hooks/useClipboardCopy";
import { useDashboardDerivedMetrics } from "./hooks/useDashboardDerivedMetrics";
import { useDashboardTransactions } from "./hooks/useDashboardTransactions";
import { useAuth } from "./hooks/useAuth";
import "./Dashboard.css";

const Dashboard = () => {
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
    pendingPinTx,
    setPendingPinTx,
  } = useDashboardTransactions();

  const { token, refreshToken } = useAuth();
  const [autoApprove, setAutoApprove] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { copied: copiedKey, copy } = useClipboardCopy();

  const apiKeyPreview = token ? `Bearer ${token}` : "Generating token...";

  const {
    totalToday,
    successToday,
    failedToday,
    successRate,
    latestTransaction,
    merchantBalance,
    userBalance,
    userStatus,
  } = useDashboardDerivedMetrics(transactions);

  useAutoApprovePin({
    autoApprove,
    pendingPinTx,
    setPendingPinTx,
  });

  return (
    <div className="dashboard-container">
      <TopBar
        autoApprove={autoApprove}
        onToggleAutoApprove={() => setAutoApprove((current) => !current)}
        apiKeyPreview={apiKeyPreview}
        copiedKey={copiedKey}
        onCopyApiKey={() => copy(apiKeyPreview)}
      />

      <Sidebar
        latestTransaction={latestTransaction}
        merchantBalance={merchantBalance}
        userBalance={userBalance}
        userStatus={userStatus}
        onMerchantClick={() => setIsConfigModalOpen(true)}
      />

      <main className="dashboard-main">
        <div className="dashboard-header-row">
          <CompactStatusBar
            totalToday={totalToday}
            lastUpdateAt={lastUpdateAt}
          />
          <StkPushForm authToken={token} onAuthError={refreshToken} />
        </div>

        <LiveFeedPanel
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          filteredTransactions={filteredTransactions}
          onSelectTransaction={setSelectedTx}
        />
      </main>

      {selectedTx && (
        <TransactionDrawer
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {!autoApprove && pendingPinTx && (
        <PinModal
          checkoutId={pendingPinTx.checkout_id}
          amount={pendingPinTx.amount}
          onClose={() => setPendingPinTx(null)}
        />
      )}

      {isConfigModalOpen && (
        <MerchantConfigModal
          token={token}
          onClose={() => setIsConfigModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
