const Loader = ({
  size = "medium",
  text = "",
  fullPage = false,
}) => {
  if (fullPage) {
    return (
      <div className="loader-full-page">
        <div
          className={`loader-spinner loader-${size}`}
        />

        {text && (
          <p className="loader-text">
            {text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="loader-wrapper">
      <div
        className={`loader-spinner loader-${size}`}
      />

      {text && (
        <span className="loader-text">
          {text}
        </span>
      )}
    </div>
  );
};

export default Loader;