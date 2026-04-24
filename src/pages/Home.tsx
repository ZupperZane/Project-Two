import NavbarComponent from "../components/Navbar";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../css/Page.css";

function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center" style={{ paddingTop: 80 }}>
        <h1 style={{ color: "var(--text-1)", margin: 0 }}>Welcome</h1>
        <div style={{display: "flex", gap: 60, flexWrap: "wrap", justifyContent: "center", paddingTop: 80, }}>
          {user
            ? <Link to="/dashboard" className="btn" style={{ color: "var(--text-2)" }}>Go to Dashboard</Link>
            : <Link to="/login" className="btn" style={{ color: "var(--text-2)" }}>Login / Sign Up</Link>
          }
          <Link to="/jobs" className="btn" style={{ color: "var(--text-2)" }}>View Job Listings</Link>
          <Link to="/employers" className="btn" style={{ color: "var(--text-2)" }}>View Employers</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
