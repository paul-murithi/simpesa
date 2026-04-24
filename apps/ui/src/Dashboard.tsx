import { useState } from "react";
import LiveFeedPanel from "./components/dashboard/LiveFeedPanel";
import PinModal from "./components/dashboard/PinModal";
import Sidebar from "./components/dashboard/Sidebar";
import StatsGrid from "./components/dashboard/StatsGrid";
import TopBar from "./components/dashboard/TopBar";
import TransactionDrawer from "./components/dashboard/TransactionDrawer";
import { useAutoApprovePin } from "./hooks/useAutoApprovePin";
import { useClipboardCopy } from "./hooks/useClipboardCopy";
import { useDashboardDerivedMetrics } from "./hooks/useDashboardDerivedMetrics";
import { useDashboardTransactions } from "./hooks/useDashboardTransactions";
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

  const [autoApprove, setAutoApprove] = useState(true);
  const { copied: copiedKey, copy } = useClipboardCopy();

  const apiKeyPreview = "Bearer ey...xK9f";

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
      />

      <main className="dashboard-main">
        <StatsGrid
          totalToday={totalToday}
          successRate={successRate}
          successToday={successToday}
          failedToday={failedToday}
          lastUpdateAt={lastUpdateAt}
        />

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
    </div>
  );
};

export default Dashboard;
