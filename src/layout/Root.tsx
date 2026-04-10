import { NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useActiveProfile } from "../hooks/useActiveProfile";
import { ROUTES, ROLES } from "../utils/constants";
import "../Root.css";

function resolveDisplayName(name: string | undefined, role: string | undefined) {
  if (name && name !== "User") return name;
  return role === ROLES.PRIMARY ? "Olivia" : "Emma";
}

function Root() {
  const { user, loading, firebaseConfigured, signOutUser } = useAuth();
  const { canToggle, isViewingLinked, linkedProfile, toggle } = useActiveProfile();
  const linkedName = resolveDisplayName(linkedProfile?.displayName, linkedProfile?.role);
  const navClass = (variant: string) =>
    ({ isActive }: { isActive: boolean }) =>
      `nav-btn ${variant}${isActive ? " nav-active" : ""}`;

  return (
    <main className="app-shell">
      <header className="root-header">
        <div>
          <h1 className="root-brand">Globo Chat</h1>
          <p className="root-subtitle">Use one large button at a time to move through the app.</p>
        </div>
        <div className="root-status-card">
          <p className="root-status-label">Account status</p>
          <p className="root-status">
            {loading ? "Loading..." : user ? `Signed in: ${user?.email ?? user?.uid}` : "Not signed in"}
          </p>
          {!firebaseConfigured ? <p className="root-warning">Firebase setup is incomplete.</p> : null}
        </div>
      </header>

      <nav className="root-nav">
        {user ? (
          <>
            <NavLink to={ROUTES.HOME} className={navClass("nav-home")}>
              <span className="nav-title">Home</span>
              <span className="nav-hint">Main menu</span>
            </NavLink>
            <NavLink to={ROUTES.CHAT} className={navClass("nav-chat")}>
              <span className="nav-title">Messages</span>
              <span className="nav-hint">Read and send chat messages</span>
            </NavLink>
            <NavLink to={ROUTES.TASKS} className={navClass("nav-tasks")}>
              <span className="nav-title">Tasks</span>
              <span className="nav-hint">View and complete to-do items</span>
            </NavLink>
            <NavLink to={ROUTES.CALENDAR} className={navClass("nav-calendar")}>
              <span className="nav-title">Calendar</span>
              <span className="nav-hint">Check and add events</span>
            </NavLink>
            <NavLink to={ROUTES.SITES} className={navClass("nav-sites")}>
              <span className="nav-title">Saved Sites</span>
              <span className="nav-hint">Open saved websites</span>
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD} className={navClass("nav-dashboard")}>
              <span className="nav-title">Account</span>
              <span className="nav-hint">See sign-in details</span>
            </NavLink>
            {canToggle && (
              <button type="button" className="nav-btn nav-dashboard" onClick={toggle}>
                <span className="nav-title">{isViewingLinked ? "Switch to Yourself" : `Switch to ${linkedName}`}</span>
                <span className="nav-hint">{isViewingLinked ? "Back to your account" : `Manage ${linkedName}'s account`}</span>
              </button>
            )}
            <button type="button" className="nav-btn nav-logout" onClick={() => void signOutUser()}>
              <span className="nav-title">Log Out</span>
              <span className="nav-hint">Return to guest mode</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to={ROUTES.LANDING} end className={navClass("nav-home")}>
              <span className="nav-title">Welcome</span>
              <span className="nav-hint">Start here</span>
            </NavLink>
            <NavLink to={ROUTES.LOGIN} className={navClass("nav-chat")}>
              <span className="nav-title">Log In</span>
              <span className="nav-hint">Use your existing account</span>
            </NavLink>
            <NavLink to={ROUTES.SIGNUP} className={navClass("nav-tasks")}>
              <span className="nav-title">Create Account</span>
              <span className="nav-hint">Sign up for a new account</span>
            </NavLink>
          </>
        )}
      </nav>

      {isViewingLinked && (
        <p style={{ background: "#fff3cd", border: "1px solid #ffc107", color: "#333", padding: "0.5rem 1rem", marginBottom: "1rem" }}>
          Managing {linkedName}&apos;s account — your changes affect their data.
        </p>
      )}

      <div className="root-content">
        <Outlet />
      </div>
    </main>
  );
}

export default Root;
