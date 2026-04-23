import NavbarComponent from "../components/Navbar";
import { Link } from "react-router-dom";
import "../css/Page.css";

function Home() {
  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center" style={{ paddingTop: 80 }}>
        <h1 style={{ color: "var(--text-1)", margin: 0 }}>Welcome</h1>
        <div style={{display: "flex", gap: 60, flexWrap: "wrap", justifyContent: "center", paddingTop: 80, }}>
          <Link to="/login" className="btn" style={{ color: "var(--text-2)" }}>Login / Sign Up</Link>
          <Link to="/jobs" className="btn" style={{ color: "var(--text-2)" }}>View Job Listings</Link>
          <Link to="/employers" className="btn" style={{ color: "var(--text-2)" }}>View Employers</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
