import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import SearchBar from "./SearchBar";
import "../css/Navbar.css";
import "../css/index.css"

function NavbarComponent(){
  const { user, signOutUser } = useAuth();

  return (
    <div className="w-full flex flex-col items-center gap-10">
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/home" className="nav-button">Home</Link>
          <Link to="/jobs" className="nav-button">Jobs</Link>
          <Link to="/employers" className="nav-button">Employers</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-button">Dashboard</Link>
              <button className="nav-button" onClick={signOutUser}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="nav-button">Login</Link>
          )}
        </div>

        <SearchBar size="compact" />

      </nav>
    </div>
  );
}

export default NavbarComponent;
