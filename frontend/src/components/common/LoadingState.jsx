const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="loading-state">
      <div className="spinner" aria-label="Loading" />
      <p>{message}</p>
      <style>{`
        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
