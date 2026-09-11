/**
 * Reusable error state.
 *
 * Renders a normalized backend/network error message (never "[object Object]")
 * with an optional retry action. Mirrors EmptyState's design language.
 */
const ErrorState = ({
  title = "Something went wrong",
  message = "Please try again.",
  retry,
  retryLabel = "Retry",
}) => {
  // Guard against non-string values (e.g. an Error object passed by mistake).
  const displayMessage =
    typeof message === "string"
      ? message
      : message?.message || "Please try again.";

  return (
    <div className="error-state">
      <div className="error-state-icon" aria-hidden="true">
        !
      </div>

      <h3>{title}</h3>

      <p>{displayMessage}</p>

      {retry && (
        <div className="error-state-action">
          <button
            type="button"
            className="btn primary small"
            onClick={retry}
          >
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
