import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import NavbarComponent from "../components/Navbar";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import "../css/Page.css";

function ResetPasswordPage() {
  const { resetUserPassword, firebaseConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setSubmitting(true);

    try {
      await resetUserPassword(email);
      setStatus("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!firebaseConfigured) {
    return (
      <div className="page">
        <NavbarComponent />
        <div className="page-center">
          <p>Firebase is not configured. Set VITE_FIREBASE_* variables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center">
        <div className="login-container">
          <h2>Reset Password</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Sending..." : "Send Reset Email"}
            </button>
          </form>

          {status && <p style={{ paddingTop: 16, color: "var(--pos-tertiary)", fontWeight: 700 }}>{status}</p>}
          {error && <p style={{ paddingTop: 16, color: "var(--neg-secondary)", fontWeight: 700 }}>{error}</p>}

          <p style={{ paddingTop: 24, color: "var(--muted-text)" }}>
            Remembered it?{" "}
            <Link to={ROUTES.LOGIN} style={{ color: "var(--button-heavy)", fontWeight: 800, textDecoration: "none" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
