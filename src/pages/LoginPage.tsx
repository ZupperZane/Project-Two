import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import "../css/Page.css"

function Login() {
  const { signInUser, signInWithGoogle, firebaseConfigured, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await signInUser(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google login failed";
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
        <h2>Login</h2>
        <p>Firebase is not configured. Set VITE_FIREBASE_* variables.</p>
      </section>
    );
  }

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center">

        <div className="login-container" style={{paddingTop: 40}}>

          <h2 style={{ margin: 0, color: "var(--text-1)", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em"}}>Login</h2>

          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 20}}>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 15, paddingTop: 40}}>
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

            {/* Sign in Button*/}
              <div style ={{ paddingTop: 5 }}></div>
            <button type="submit" className="btn" style={{ marginTop: 4, color: "var(--text-2)"}}>
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, paddingBottom: 10}}>
            <div style={{ flex: 1, height: 1, background: "rgba(43,43,43,0.18)"}} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-1)", opacity: 0.4 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(43,43,43,0.18)" }} />
          </div>

          {/* Login with Google */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(255,255,255,0.65)",
              color: "var(--text-1)",
              border: "1.5px solid rgba(255,255,255,0.55)",
              borderRadius: 9,
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            }}
          >
            <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
            Login with Google
          </button>

          {/* Forgot Password and Sign Up */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "center", paddingTop: 50}}>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-1)", opacity: 0.75 }}>
              Forgot your password?{" "}
              <Link to={ROUTES.RESET_PASSWORD} style={{ color: "var(--button-heavy)", fontWeight: 700, textDecoration: "none" }}>Reset it here</Link>
            </p>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-1)", opacity: 0.75, paddingTop: 10, paddingBottom: 20 }}>
              No account?{" "}
              <Link to={ROUTES.SIGNUP} style={{ color: "var(--button-heavy)", fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
            </p>
          </div>

          {error ? <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", fontWeight: 600, color: "var(--neg-secondary)" }}>{error}</p> : null}

        </div>
      </div>
    </div>
  );
}

export default Login;
