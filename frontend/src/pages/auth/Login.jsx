import { useState } from "react";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const { login, user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(
        formData.email,
        formData.password
      );

      const destination =
        location.state?.from?.pathname ||
        "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (error) {
      console.error(error);

      switch (error.code) {
        case "auth/invalid-credential":
          setError(
            "Incorrect email address or password."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
          );
          break;

        default:
          setError(
            "Unable to sign in. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand">
          <span className="auth-logo">A</span>
          <strong>AgriTrace</strong>
        </div>

        <div className="auth-brand-content">
          <span>SMART SUPPLY CHAIN</span>

          <h1>
            Trace every harvest.
            <br />
            Trust every delivery.
          </h1>

          <p>
            Monitor agricultural shipments in real time
            using IoT sensing, secure traceability and
            transparent farm-to-fork data.
          </p>

          <div className="auth-feature-list">
            <div>✓ Real-time environmental monitoring</div>
            <div>✓ Farm-to-fork traceability</div>
            <div>✓ Tamper-resistant records</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Welcome back</h2>

            <p>
              Sign in to access your AgriTrace dashboard.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="form-group">
              <div className="input-label-row">
                <label>Password</label>

                <button
                  type="button"
                  className="text-button"
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                minLength="6"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">
              Create account
            </Link>
          </p>

          <div className="auth-security">
            Secure authentication powered by Firebase
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;