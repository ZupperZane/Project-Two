import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import type { UserRole } from "../contexts/AuthContext";
import "../css/Page.css"
import "../css/App.css"

const signupRoles: Array<{
  value: Exclude<UserRole, null>;
  title: string;
  description: string;
}> = [
  {
    value: "job_seeker",
    title: "Job Seeker",
    description: "Upload a resume and apply to openings.",
  },
  {
    value: "employer",
    title: "Employer",
    description: "Post roles and review applicants.",
  },
  {
    value: "admin",
    title: "Admin",
    description: "Moderate users and listings.",
  },
];

function normalizeSignupRole(value: string | null): Exclude<UserRole, null> {
  return value === "employer" || value === "admin" || value === "job_seeker"
    ? value
    : "job_seeker";
}

function Signup() {
  const { createUser, updateUserProfile, bootstrapUserProfile, deleteAccount, firebaseConfigured, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, null>>(() =>
    normalizeSignupRole(searchParams.get("role"))
  );
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
      await deleteAccount().catch(() => null);
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    }
  };

  if (user) {
    navigate(ROUTES.DASHBOARD, { replace: true });
    return null;
  }

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

            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 15 }}>
              <label className="form-label">Sign up as a</label>
              <div className="role-option-grid">
                {signupRoles.map((option) => (
                  <label
                    key={option.value}
                    className={`role-option ${role === option.value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                    />
                    <span>{option.title}</span>
                    <small>{option.description}</small>
                  </label>
                ))}
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
