interface TopBarProps {
  autoApprove: boolean;
  onToggleAutoApprove: () => void;
  apiKeyPreview: string;
  copiedKey: boolean;
  onCopyApiKey: () => void;
}

const TopBar = ({
  autoApprove,
  onToggleAutoApprove,
  apiKeyPreview,
  copiedKey,
  onCopyApiKey,
}: TopBarProps) => {
  return (
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
            onClick={onToggleAutoApprove}
          >
            <span className="toggle-knob" />
          </button>
        </label>

        <div className="api-key-preview">
          <span title={apiKeyPreview}>
            {apiKeyPreview.length > 20
              ? `${apiKeyPreview.slice(0, 10)}...${apiKeyPreview.slice(-4)}`
              : apiKeyPreview}
          </span>
          <button type="button" onClick={onCopyApiKey}>
            {copiedKey ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
