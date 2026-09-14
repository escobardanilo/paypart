const statusColors: Record<string, string> = {
  successful: "#76b900",
  completed: "#76b900",
  failed: "#ef6461",
  pending: "#f0b44d",
  processing: "#5d8bf4",
};

export function InvestigationActivityChart({ data }: { data: { label: string; count: number }[] }) {
  const width = 680;
  const height = 220;
  const insetX = 30;
  const insetY = 26;
  const max = Math.max(...data.map((item) => item.count), 1);
  const step = data.length > 1 ? (width - insetX * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    ...item,
    x: insetX + index * step,
    y: height - insetY - (item.count / max) * (height - insetY * 2),
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${insetX},${height - insetY} ${line} ${width - insetX},${height - insetY}`;

  return (
    <div className="chart-shell activity-chart" aria-label="Investigation activity over the last seven days">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#76b900" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#76b900" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1={insetX} x2={width - insetX} y1={height * ratio} y2={height * ratio} className="chart-grid-line" />)}
        <polygon points={area} fill="url(#activityFill)" />
        <polyline points={line} className="activity-line" />
        {points.map((point) => <g key={`${point.label}-${point.x}`}><circle cx={point.x} cy={point.y} r="4" className="activity-dot" /><text x={point.x} y={height - 5} textAnchor="middle" className="chart-label">{point.label}</text></g>)}
      </svg>
    </div>
  );
}

export function PaymentStatusChart({ statuses }: { statuses: Record<string, number> }) {
  const entries = Object.entries(statuses).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="payment-status-layout">
      <div className="donut-chart" aria-label={`${total} payment records by status`}>
        <svg viewBox="0 0 140 140" role="img">
          <circle cx="70" cy="70" r={radius} className="donut-track" />
          {entries.map(([status, value], index) => {
            const length = total ? (value / total) * circumference : 0;
            const dashOffset = -offset;
            offset += length;
            return <circle key={status} cx="70" cy="70" r={radius} className="donut-segment" stroke={statusColors[status] ?? ["#6b7fd7", "#31a6a0", "#9a70d6"][index % 3]} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={dashOffset} />;
          })}
        </svg>
        <div><strong>{total}</strong><span>payments</span></div>
      </div>
      <div className="status-legend">
        {entries.length === 0 ? <p className="muted">No payment records yet.</p> : entries.map(([status, value], index) => (
          <div key={status}><span className="legend-dot" style={{ background: statusColors[status] ?? ["#6b7fd7", "#31a6a0", "#9a70d6"][index % 3] }} /><span>{status}</span><strong>{value}</strong></div>
        ))}
      </div>
    </div>
  );
}
