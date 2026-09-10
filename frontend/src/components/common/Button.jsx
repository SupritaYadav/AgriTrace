const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="btn-loading">
          <span className="btn-spinner"></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;