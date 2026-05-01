import NavbarComponent from "../components/Navbar";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SearchBar from "../components/SearchBar";
import "../css/Page.css";
import "../css/Home.css";

function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center home-hero">
        <div className="home-copy">
          <p className="home-chip">Career Platform</p>
          <h1>Find Your Next Opportunity</h1>
          <p className="home-subcopy">
            Search thousands of jobs and employers in one place.
          </p>
        </div>

        <SearchBar size="hero" />

        <div className="home-cta-row">
          {user
            ? <Link to="/dashboard" className="btn">Go to Dashboard</Link>
            : (
              <>
                <Link to="/signup?role=job_seeker" className="btn">Find Work</Link>
                <Link to="/signup?role=employer" className="btn btn-secondary">Post a Job</Link>
                <Link to="/login" className="btn btn-quiet">Login</Link>
              </>
            )
          }
          <Link to="/jobs" className="btn">Browse Jobs</Link>
          <Link to="/employers" className="btn">Browse Employers</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
