import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import SearchBar from "./SearchBar";
import "../css/Navbar.css";

function NavbarComponent() {
  const { user, role, signOutUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="navbar-shell">
      <nav className="navbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          <span>Career Compass</span>
        </div>

        <div className="nav-links">
          <NavLink to="/home" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Home</NavLink>
          <NavLink to="/jobs" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Jobs</NavLink>
          <NavLink to="/employers" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Employers</NavLink>
          {role === "employer" && (
            <NavLink to="/jobs/new" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Post Job</NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Dashboard</NavLink>
              <button className="nav-button nav-signout" onClick={signOutUser}>Sign Out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Login</NavLink>
              <NavLink to="/signup" className={({ isActive }) => `nav-button ${isActive ? "active" : ""}`}>Sign Up</NavLink>
            </>
          )}
        </div>

        <div className="nav-actions">
          <SearchBar size="compact" />
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            <span className={`theme-toggle-icon ${isDark ? "sun" : "moon"}`} aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}

export default NavbarComponent;
