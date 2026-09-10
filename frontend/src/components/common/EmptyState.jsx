const EmptyState = ({
  title = "No data found",
  description = "There is currently nothing to display.",
  icon = "○",
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;