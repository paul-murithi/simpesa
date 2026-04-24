const formatUpdateTime = (date: Date | null) => {
  if (!date) return "Waiting for updates";
  return date.toLocaleTimeString();
};

interface StatsGridProps {
  totalToday: number;
  successRate: number;
  successToday: number;
  failedToday: number;
  lastUpdateAt: Date | null;
}

const StatsGrid = ({
  totalToday,
  successRate,
  successToday,
  failedToday,
  lastUpdateAt,
}: StatsGridProps) => {
  return (
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
  );
};

export default StatsGrid;
