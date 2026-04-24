import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import ResumeUpload from "../components/ResumeUpload";
import EmployerJobsPanel from "../components/EmployerJobsPanel";
import "../css/Page.css";

function Dashboard() {
  const { user, role, signOutUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [resumeFileId, setResumeFileId] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "job_seeker" || !user) return;
    user.getIdToken().then((token) =>
      fetch("/api/job-seeker/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setResumeFileId(data.resumeFileId ?? null))
        .catch(() => null)
    );
  }, [role, user]);

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    await deleteAccount();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-center" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", maxWidth: 600 }}>

          <div>
            <h1 style={{ margin: 0, color: "var(--text-1)" }}>Dashboard</h1>
            <p style={{ margin: "6px 0 0", color: "var(--text-1)", opacity: 0.6, fontSize: "0.9rem", paddingTop: 40}}>
              {user?.email} · {role ?? "..."}
            </p>
          </div>

          {role === "job_seeker" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ margin: 0, color: "var(--text-1)" }}>Your Resume</h2>
              <ResumeUpload currentFileId={resumeFileId} onUploaded={setResumeFileId} />
            </div>
          )}

          {role === "employer" && (
            <>
              <Link to="/createPost" className="btn" style={{ color: "var(--text-2)", textAlign: "center" }}>
                Create Job Posting
              </Link>
              <EmployerJobsPanel />
            </>
          )}

          <div style={{ display: "flex", gap: 12, paddingTop: 12 }}>
            <button className="btn" style={{ color: "var(--text-2)" }} onClick={signOutUser}>
              Sign Out
            </button>
            <button
              className="btn"
              style={{ color: "var(--neg-secondary)", background: "transparent", border: "1.5px solid var(--neg-secondary)" }}
              onClick={handleDelete}
            >
              Delete Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
