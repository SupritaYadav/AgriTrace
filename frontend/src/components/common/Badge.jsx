const STATUS_VARIANTS = {
  Online: "online",
  Available: "available",
  Assigned: "assigned",
  Offline: "offline",
};

const Badge = ({
  status,
  children,
  variant,
  className = "",
}) => {
  // Accepts either a raw device `status` string (preferred — this is
  // how DeviceList calls it) or an explicit `variant` + `children`
  // for manual use elsewhere in the app.
  const resolvedVariant =
    variant || STATUS_VARIANTS[status] || "neutral";

  const label = children ?? status;

  return (
    <span
      className={`badge badge-${resolvedVariant} ${className}`}
    >
      <span className="badge-dot" />
      {label}
    </span>
  );
};

export default Badge;