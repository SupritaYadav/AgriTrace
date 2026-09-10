function buildSparklinePoints(history) {
  if (!history || history.length < 2) {
    return "";
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const stepX = 100 / (history.length - 1);

  return history
    .map((value, index) => {
      const x = index * stepX;
      // 28px viewBox height, 2px padding top/bottom
      const y =
        26 -
        ((value - min) / range) * 24 +
        1;
      return `${x},${y}`;
    })
    .join(" ");
}

function SensorCard({
  icon,
  title,
  value,
  subtitle,
  status = "safe",
  history,
}) {
  const points = buildSparklinePoints(history);

  return (
    <article className={`sensor-card ${status}`}>

      <div className="sensor-card-icon">
        {icon}
      </div>

      <div className="sensor-card-content">
        <span className="sensor-card-title">
          {title}
        </span>

        <span className="sensor-card-value">
          {value}
        </span>

        <span className="sensor-card-subtitle">
          {subtitle}
        </span>

        {points && (
          <svg
            className="sensor-sparkline"
            viewBox="0 0 100 28"
            preserveAspectRatio="none"
          >
            <polyline points={points} />
          </svg>
        )}
      </div>

    </article>
  );
}

export default SensorCard;