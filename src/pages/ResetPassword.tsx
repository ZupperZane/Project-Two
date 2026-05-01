import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import "../css/Page.css";

function ResetPassword() {
  const { resetUserPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await resetUserPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    }
  };

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center">
        <div className="login-container" style={{ paddingTop: 40 }}>
          <h2 style={{ margin: 0, color: "var(--text-1)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Reset Password
          </h2>

          {sent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 32 }}>
              <p style={{ margin: 0, color: "var(--text-1)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Check your inbox — if an account exists for <strong>{email}</strong>, a reset link is on its way.
              </p>
              <Link
                to={ROUTES.LOGIN}
                style={{ color: "var(--button-heavy)", fontWeight: 700, textDecoration: "none", fontSize: "0.9rem" }}
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 15, paddingTop: 40 }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div style={{ paddingTop: 5 }} />
              <button type="submit" className="btn" style={{ color: "var(--text-2)" }}>
                Send reset link
              </button>

              {error && (
                <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: "var(--neg-secondary)" }}>
                  {error}
                </p>
              )}

              <div style={{ textAlign: "center", paddingTop: 16, paddingBottom: 20 }}>
                <Link
                  to={ROUTES.LOGIN}
                  style={{ color: "var(--button-heavy)", fontWeight: 700, textDecoration: "none", fontSize: "0.88rem" }}
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
