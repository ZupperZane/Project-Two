import NavbarComponent from "../components/Navbar";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SearchBar from "../components/SearchBar";
import "../css/Page.css";

function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center" style={{ paddingTop: 80, gap: 48 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "var(--text-1)", margin: 0 }}>Find Your Next Opportunity</h1>
          <p style={{ color: "var(--text-1)", opacity: 0.6, marginTop: 12, fontSize: "1.05rem" }}>
            Search thousands of jobs and employers in one place.
          </p>
        </div>

        <SearchBar size="hero" />

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {user
            ? <Link to="/dashboard" className="btn" style={{ color: "var(--text-2)" }}>Go to Dashboard</Link>
            : <Link to="/login" className="btn" style={{ color: "var(--text-2)" }}>Login / Sign Up</Link>
          }
          <Link to="/jobs" className="btn" style={{ color: "var(--text-2)" }}>Browse Jobs</Link>
          <Link to="/employers" className="btn" style={{ color: "var(--text-2)" }}>Browse Employers</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
