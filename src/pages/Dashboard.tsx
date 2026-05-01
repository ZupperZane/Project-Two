import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import ResumeUpload from "../components/ResumeUpload";
import type { ResumeEntry } from "../components/ResumeUpload";
import EmployerJobsPanel from "../components/EmployerJobsPanel";
import "../css/Page.css";

type FavoriteJob = {
  _id: string;
  jobTitle?: string;
  name?: string;
  company?: string;
  institutionName?: string;
  location?: string;
  employmentType?: string;
  salary?: number | null;
  applicationDeadline?: string;
};

type AdminUser = {
  uid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  disabledReason: string | null;
};

type ModerationLog = {
  _id: string;
  action: string;
  targetType: string;
  targetUid?: string;
  targetId?: string;
  targetEmail?: string;
  performedByUid: string;
  performedByEmail?: string;
  reason: string;
  createdAt: string;
};

function Dashboard() {
  const { user, role, banned, banReason, signOutUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [defaultResumeFileId, setDefaultResumeFileId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteJob[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [modLogs, setModLogs] = useState<ModerationLog[]>([]);
  const [modLogsLoading, setModLogsLoading] = useState(false);

  useEffect(() => {
    if (role !== "job_seeker" || !user) return;
    user.getIdToken().then((token) => {
      fetch("/api/job-seeker/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          setResumes(Array.isArray(data.resumes) ? data.resumes : []);
          setDefaultResumeFileId(data.defaultResumeFileId ?? null);
        })
        .catch(() => null);

      fetch("/api/job-seeker/favorites", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setFavorites(Array.isArray(data) ? data : []))
        .catch(() => null);
    });
  }, [role, user]);

  useEffect(() => {
    if (role !== "admin" || !user) return;
    setAdminUsersLoading(true);
    setModLogsLoading(true);
    user.getIdToken().then((token) => {
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          setAdminUsers(Array.isArray(data) ? data : []);
          setAdminUsersLoading(false);
        })
        .catch(() => setAdminUsersLoading(false));

      fetch("/api/admin/moderation-logs", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          setModLogs(Array.isArray(data) ? data : []);
          setModLogsLoading(false);
        })
        .catch(() => setModLogsLoading(false));
    });
  }, [role, user]);

  const downloadFavoritesCSV = () => {
    const header = ["Title", "Company", "Location", "Employment Type", "Salary", "Application Deadline", "URL"];
    const rows = favorites.map((job) => [
      job.jobTitle || job.name || "",
      job.institutionName || job.company || "",
      job.location || "",
      job.employmentType || "",
      job.salary != null ? `$${job.salary.toLocaleString()}` : "",
      job.applicationDeadline || "",
      `${window.location.origin}/jobs/${job._id}`,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saved-jobs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    await deleteAccount();
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleBan = async (targetUid: string) => {
    if (!user) return;
    const reason = window.prompt("Reason for banning this user (required):");
    if (!reason?.trim()) return;
    setAdminActionError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${targetUid}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to ban user.");
      }
      setAdminUsers((current) =>
        current.map((u) =>
          u.uid === targetUid ? { ...u, status: "disabled", disabledReason: reason.trim() } : u
        )
      );
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : "Failed to ban user.");
    }
  };

  const handleUnban = async (targetUid: string) => {
    if (!user) return;
    setAdminActionError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${targetUid}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to unban user.");
      }
      setAdminUsers((current) =>
        current.map((u) =>
          u.uid === targetUid ? { ...u, status: "active", disabledReason: null } : u
        )
      );
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : "Failed to unban user.");
    }
  };

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-content narrow">
        <div className="page-header">
          <div className="page-header-copy">
            <h1>Dashboard</h1>
            <p>{user?.email} · {role ?? "..."}</p>
          </div>
          {!banned && (
            <div className="action-row">
              {role === "job_seeker" && <Link to="/jobs" className="btn">Browse Jobs</Link>}
              {role === "employer" && <Link to="/jobs/new" className="btn">Post Job</Link>}
            </div>
          )}
        </div>

        {banned ? (
          <div className="content-panel">
            <h2 style={{ color: "var(--neg-secondary)" }}>Account Restricted</h2>
            <p className="muted-text">
              Your account has been restricted by an administrator
              {banReason ? `: ${banReason}` : "."}
            </p>
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={signOutUser}>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="dashboard-grid">
            {role === "job_seeker" && (
              <>
                <div className="content-panel compact">
                  <div className="form-section-title">
                    <h2>Your Resumes</h2>
                    <p className="muted-text">Upload multiple resumes and set your default for quick apply.</p>
                  </div>
                  <ResumeUpload
                    resumes={resumes}
                    defaultResumeFileId={defaultResumeFileId}
                    onUploaded={(entry, isDefault) => {
                      setResumes((prev) => [...prev, entry]);
                      if (isDefault) setDefaultResumeFileId(entry.fileId);
                    }}
                    onDeleted={(fileId) => {
                      setResumes((prev) => prev.filter((r) => r.fileId !== fileId));
                      if (defaultResumeFileId === fileId) setDefaultResumeFileId(null);
                    }}
                    onSetDefault={(fileId) => setDefaultResumeFileId(fileId)}
                  />
                </div>

                <div className="content-panel compact">
                  <div className="action-row" style={{ justifyContent: "space-between" }}>
                    <h2 style={{ margin: 0 }}>
                      Saved Jobs
                      {favorites.length > 0 && (
                        <span style={{ fontWeight: 500, opacity: 0.6, fontSize: "0.95rem", marginLeft: 8 }}>
                          ({favorites.length})
                        </span>
                      )}
                    </h2>
                    {favorites.length > 0 && (
                      <button className="btn btn-quiet" style={{ fontSize: "0.85rem" }} onClick={downloadFavoritesCSV}>
                        Download CSV
                      </button>
                    )}
                  </div>

                  {favorites.length === 0 ? (
                    <p className="muted-text">No saved jobs yet.</p>
                  ) : (
                    <div className="stack-list" style={{ maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                      {favorites.map((job) => (
                        <div key={job._id} className="applicant-card" style={{ flexDirection: "column", gap: 2 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--text-1)", fontSize: "0.9rem" }}>
                            {job.jobTitle || job.name}
                          </p>
                          <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.82rem" }}>
                            {[job.institutionName || job.company, job.location].filter(Boolean).join(" · ")}
                          </p>
                          {job.applicationDeadline && (
                            <p style={{ margin: 0, color: "var(--neg-secondary)", fontSize: "0.78rem", fontWeight: 700 }}>
                              Apply by: {job.applicationDeadline}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {role === "employer" && (
              <>
                <div className="content-panel compact">
                  <div className="form-section-title">
                    <h2>Employer Tools</h2>
                    <p className="muted-text">Create listings and monitor candidates from one place.</p>
                  </div>
                  <div className="action-row">
                    <Link to="/jobs/new" className="btn">Create Job Posting</Link>
                    <Link to="/jobs" className="btn btn-quiet">View All Jobs</Link>
                  </div>
                </div>
                <EmployerJobsPanel />
              </>
            )}

            {role === "admin" && (
              <div className="content-panel compact">
                <h2>User Management</h2>

                {adminActionError && (
                  <p style={{ margin: 0, color: "var(--neg-secondary)", fontWeight: 700, fontSize: "0.9rem" }}>
                    {adminActionError}
                  </p>
                )}

                {adminUsersLoading && <p className="muted-text">Loading users...</p>}

                {!adminUsersLoading && (
                  <div className="admin-list" style={{ maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                    {adminUsers.map((u) => (
                      <div key={u.uid} className="admin-list-item" style={{ alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--text-1)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.name || u.email}
                          </p>
                          <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.8rem" }}>
                            {u.email} · {u.role}
                            {u.status === "disabled" && (
                              <span style={{ color: "var(--neg-secondary)", marginLeft: 6 }}>
                                · banned{u.disabledReason ? `: ${u.disabledReason}` : ""}
                              </span>
                            )}
                          </p>
                        </div>

                        {u.uid !== user?.uid && u.role !== "admin" && (
                          u.status === "disabled" ? (
                            <button className="btn" style={{ flexShrink: 0, fontSize: "0.85rem" }} onClick={() => handleUnban(u.uid)}>
                              Unban
                            </button>
                          ) : (
                            <button className="btn danger-button" style={{ flexShrink: 0, fontSize: "0.85rem" }} onClick={() => handleBan(u.uid)}>
                              Ban
                            </button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {role === "admin" && (
              <div className="content-panel compact">
                <h2>Moderation Log</h2>

                {modLogsLoading && <p className="muted-text">Loading logs...</p>}
                {!modLogsLoading && modLogs.length === 0 && <p className="muted-text">No actions recorded yet.</p>}

                {!modLogsLoading && modLogs.length > 0 && (
                  <div className="log-list" style={{ maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                    {modLogs.map((log) => (
                      <div key={log._id} className="log-item" style={{ flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "var(--text-1)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {log.action.replace(/_/g, " ")}
                          </p>
                          <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                        {log.reason && (
                          <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.82rem" }}>
                            Reason: {log.reason}
                          </p>
                        )}
                        {(log.targetEmail || log.targetUid || log.targetId) && (
                          <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.8rem" }}>
                            Target: {log.targetEmail || log.targetUid || log.targetId}
                          </p>
                        )}
                        {(log.performedByEmail || log.performedByUid) && (
                          <p style={{ margin: 0, color: "var(--muted-text)", fontSize: "0.78rem" }}>
                            By: {log.performedByEmail || log.performedByUid}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="action-row dashboard-footer">
              <button className="btn btn-quiet" onClick={signOutUser}>Sign Out</button>
              <button className="btn danger-button" onClick={handleDelete}>Delete Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
