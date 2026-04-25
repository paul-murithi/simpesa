const formatUpdateTime = (date: Date | null) => {
  if (!date) return "Waiting for updates";
  return date.toLocaleTimeString();
};

interface StatsGridProps {
  totalToday: number;
  lastUpdateAt: Date | null;
}

const CompactStatusBar = ({
  totalToday,
  lastUpdateAt,
}: StatsGridProps) => {
  return (
    <div className="compact-status-bar">
      <span className="status-item">
        <strong>Total today:</strong> {totalToday}
      </span>
      <span className="status-divider">•</span>
      <span className="status-item">
        <strong>Last webhook fired:</strong> {formatUpdateTime(lastUpdateAt)}
      </span>
    </div>
  );
};

export default CompactStatusBar;
