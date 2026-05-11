import { type TransactionUI } from "@app/types";
import { formatTransactionAmount } from "../../utils/dashboard";

interface SidebarProps {
  latestTransaction: TransactionUI | null;
  merchantBalance?: string | null | undefined;
  userBalance?: string | null | undefined;
  userStatus: string;
  onMerchantClick?: () => void;
}

const Sidebar = ({
  latestTransaction,
  merchantBalance,
  userBalance,
  userStatus,
  onMerchantClick,
}: SidebarProps) => {
  return (
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
          <button
            type="button"
            className="sidebar-link"
            onClick={onMerchantClick}
          >
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
            <strong>{latestTransaction?.phone_number ?? "No live data"}</strong>
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
  );
};

export default Sidebar;
