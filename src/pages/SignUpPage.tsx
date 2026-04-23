import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import type { UserRole } from "../contexts/AuthContext";
import "../css/Page.css"
import "../css/App.css"

function Signup() {
  const { createUser, updateUserProfile, bootstrapUserProfile, firebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, null>>("job_seeker");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await createUser(email, password);

      if (displayName.trim()) {
        await updateUserProfile({ displayName: displayName.trim() });
      }

      await bootstrapUserProfile(role);

      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    }
  };

  if (!firebaseConfigured) {
    return (
      <section>
        <h2>Signup</h2>
        <p>Firebase is not configured. Set VITE_FIREBASE_* variables.</p>
      </section>
    );
  }

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center">
        <div className="login-container" style={{ paddingTop: 40 }}>
          <h2 style={{ margin: 0, color: "var(--text-1)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Sign Up</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Display Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 15, paddingTop: 40 }}>
              <label className="form-label">Display Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 15}}>
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

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10}}>
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            {/* Role Selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 15 }}>
              <label className="form-label">Sign up as a</label>
              <div style={{ display: "flex", gap: 12, paddingTop: 5 }}>

                {/* Job Seeker Styling */}
                <label style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 13px",
                  borderRadius: 20,
                  border: `1.5px solid ${role === "job_seeker" ? "var(--button-heavy)" : "rgba(255,255,255,0.5)"}`,
                  background: role === "job_seeker" ? "var(--button-light)" : "rgba(255,255,255,0.55)",
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
                    checked={role === "job_seeker"}
                    onChange={() => setRole("job_seeker")}
                    style={{ display: "none" }}
                  />
                  Job Seeker
                </label>

                {/* Employer Styling */}
                <label style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 13px",
                  borderRadius: 20,
                  border: `1.5px solid ${role === "employer" ? "var(--button-heavy)" : "rgba(255,255,255,0.5)"}`,
                  background: role === "employer" ? "var(--button-light)" : "rgba(255,255,255,0.55)",
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
                    checked={role === "employer"}
                    onChange={() => setRole("employer")}
                    style={{ display: "none" }}
                  />
                  Employer
                </label>
              </div>
            </div>

            <div style={{ paddingTop: 5 }}></div>
            <button type="submit" className="btn" style={{ marginTop: 4, color: "var(--text-2)" }}>
              Create account
            </button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "center", paddingTop: 50 }}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-1)", opacity: 0.75, paddingBottom: 20 }}>
              Already have an account?{" "}
              <Link to={ROUTES.LOGIN} style={{ color: "var(--button-heavy)", fontWeight: 700, textDecoration: "none" }}>Login</Link>
            </p>
          </div>

          {error ? <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: "var(--neg-secondary)" }}>{error}</p> : null}

        </div>
      </div>
    </div>
  );
}

export default Signup;
