import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import "../css/Login.css"

function Login() {
  const { signInUser, signInWithGoogle, firebaseConfigured } = useAuth();
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

  if (!firebaseConfigured) {
    return (
      <section>
        <h2>Login</h2>
        <p>Firebase is not configured. Set VITE_FIREBASE_* variables.</p>
      </section>
    );
  }

  return (

    <div className="flex justify-center items-center">
     <NavbarComponent/>
      <div className="login-card">
        <div className="card-body gap-5">

          <h2 className="card-title text-3xl font-bold justify-center">Login</h2>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email *</legend>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Password *</legend>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </fieldset>

            <button type="submit" className="btn btn-primary w-full text-lg mt-2">
              Sign in
            </button>
          </form>

          <p className="text-center text-base">
            Forgot your password?{" "}
            <Link className="font-semibold underline" to={ROUTES.RESET_PASSWORD}>
              Reset it here
            </Link>
          </p>

          <p className="text-center text-base">
            No Account? 
            <Link className="font-semibold underline" to={ROUTES.SIGNUP}>
              Sign up!
            </Link>
          </p>

          <button
            onClick={handleGoogleLogin}
            className="btn bg-white text-black border-[#e5e5e5] w-full"
          >
            <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
            Login with Google
          </button>

          {error ? <p className="text-error text-center">{error}</p> : null}

        </div>
      </div>
    </div>
  );
}

export default Login;