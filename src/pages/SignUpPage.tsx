import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import type { UserRole } from "../contexts/AuthContext";

function Signup() {
  const { createUser, updateUserProfile, firebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, null>>("jobseeker");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const credential = await createUser(email, password);

      if (displayName.trim()) {
        await updateUserProfile({ displayName: displayName.trim() });
      }

      try {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: credential.user.uid, role, email }),
        });
      } catch {
        // MongoDB may not be configured — continue anyway
      }

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
    <section>
        <NavbarComponent/>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.5rem", maxWidth: "320px" }}>
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div>
          <label>
            <input type="radio" name="role" value="jobseeker" checked={role === "jobseeker"} onChange={() => setRole("jobseeker")} />
            {" "}Job Seeker
          </label>
          <label style={{ marginLeft: "1rem" }}>
            <input type="radio" name="role" value="job_poster" checked={role === "job_poster"} onChange={() => setRole("job_poster")} />
            {" "}Job Poster
          </label>
        </div>
        <button type="submit">Create account</button>
      </form>
      <p>
        Already have an account? <Link to={ROUTES.LOGIN}>Login</Link>
      </p>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </section>
  );
}

export default Signup;