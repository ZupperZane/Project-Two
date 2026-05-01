import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import type { UserRole } from "../contexts/AuthContext";
import "../css/Page.css";
import "../css/App.css";

type SelectableRole = Exclude<UserRole, null | "admin">;

function SelectRolePage() {
  const { user, role, loading, bootstrapUserProfile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectableRole>("job_seeker");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) return null;

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  if (role) return <Navigate to={ROUTES.DASHBOARD} replace />;

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await bootstrapUserProfile(selected);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center">
        <div className="login-container" style={{ paddingTop: 40 }}>
          <h2 style={{ margin: 0, color: "var(--text-1)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            One more step
          </h2>
          <p style={{ margin: "10px 0 0", color: "var(--text-1)", opacity: 0.6, fontSize: "0.92rem" }}>
            Choose how you'll use the platform.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 32 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 13px",
                borderRadius: 20,
                border: `1.5px solid ${selected === "job_seeker" ? "var(--button-heavy)" : "rgba(255,255,255,0.5)"}`,
                background: selected === "job_seeker" ? "var(--button-light)" : "rgba(255,255,255,0.55)",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "var(--text-1)",
                transition: "all 0.15s",
              }}>
                <input
                  type="radio"
                  name="role"
                  value="job_seeker"
                  checked={selected === "job_seeker"}
                  onChange={() => setSelected("job_seeker")}
                  style={{ display: "none" }}
                />
                Job Seeker
              </label>

              <label style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 13px",
                borderRadius: 20,
                border: `1.5px solid ${selected === "employer" ? "var(--button-heavy)" : "rgba(255,255,255,0.5)"}`,
                background: selected === "employer" ? "var(--button-light)" : "rgba(255,255,255,0.55)",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "var(--text-1)",
                transition: "all 0.15s",
              }}>
                <input
                  type="radio"
                  name="role"
                  value="employer"
                  checked={selected === "employer"}
                  onChange={() => setSelected("employer")}
                  style={{ display: "none" }}
                />
                Employer
              </label>
            </div>

            <button
              className="btn"
              style={{ color: "var(--text-2)", marginTop: 4 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Setting up..." : "Continue"}
            </button>

            {error && (
              <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: "var(--neg-secondary)" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectRolePage;
