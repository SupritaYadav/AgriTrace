import { useEffect } from "react";

const Toast = ({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: "✓",
    error: "!",
    warning: "!",
    info: "i",
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {icons[type] || icons.info}
      </div>

      <div className="toast-content">
        <p>{message}</p>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;