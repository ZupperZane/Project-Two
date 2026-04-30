import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";
import NavbarComponent from "../components/Navbar";
import ResumeUpload from "../components/ResumeUpload";
import EmployerJobsPanel from "../components/EmployerJobsPanel";
import "../css/Page.css";

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
  const [resumeFileId, setResumeFileId] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [modLogs, setModLogs] = useState<ModerationLog[]>([]);
  const [modLogsLoading, setModLogsLoading] = useState(false);

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
      <div className="page-center" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%", maxWidth: 600 }}>

          <div>
            <h1 style={{ margin: 0, color: "var(--text-1)" }}>Dashboard</h1>
            <p style={{ margin: "6px 0 0", color: "var(--text-1)", opacity: 0.6, fontSize: "0.9rem", paddingTop: 40 }}>
              {user?.email} · {role ?? "..."}
            </p>
          </div>

          {banned ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ margin: 0, color: "var(--neg-secondary)" }}>Account Restricted</h2>
              <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.8, fontSize: "0.95rem" }}>
                Your account has been restricted by an administrator
                {banReason ? `: ${banReason}` : "."}
              </p>
              <button className="btn" style={{ color: "var(--text-2)", marginTop: 8, alignSelf: "flex-start" }} onClick={signOutUser}>
                Sign Out
              </button>
            </div>
          ) : (
            <>
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

              {role === "admin" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h2 style={{ margin: 0, color: "var(--text-1)" }}>User Management</h2>

                  {adminActionError && (
                    <p style={{ margin: 0, color: "var(--neg-secondary)", fontWeight: 600, fontSize: "0.9rem" }}>
                      {adminActionError}
                    </p>
                  )}

                  {adminUsersLoading && (
                    <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.6 }}>Loading users...</p>
                  )}

                  {!adminUsersLoading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                      {adminUsers.map((u) => (
                        <div key={u.uid} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "14px 18px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          border: "1.5px solid rgba(255,255,255,0.1)",
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: "var(--text-1)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {u.name || u.email}
                            </p>
                            <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.5, fontSize: "0.8rem" }}>
                              {u.email} · {u.role}
                              {u.status === "disabled" && (
                                <span style={{ color: "var(--neg-secondary)", marginLeft: 6 }}>
                                  · banned{u.disabledReason ? `: ${u.disabledReason}` : ""}
                                </span>
                              )}
                            </p>
                          </div>

                          {u.uid !== user?.uid && (
                            u.status === "disabled" ? (
                              <button
                                className="btn"
                                style={{ color: "var(--text-2)", flexShrink: 0, fontSize: "0.85rem" }}
                                onClick={() => handleUnban(u.uid)}
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                className="btn"
                                style={{ color: "var(--neg-secondary)", background: "transparent", border: "1.5px solid var(--neg-secondary)", flexShrink: 0, fontSize: "0.85rem" }}
                                onClick={() => handleBan(u.uid)}
                              >
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
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h2 style={{ margin: 0, color: "var(--text-1)" }}>Moderation Log</h2>

                  {modLogsLoading && (
                    <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.6 }}>Loading logs...</p>
                  )}

                  {!modLogsLoading && modLogs.length === 0 && (
                    <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.4, fontSize: "0.9rem" }}>No actions recorded yet.</p>
                  )}

                  {!modLogsLoading && modLogs.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
                      {modLogs.map((log) => (
                        <div key={log._id} style={{
                          padding: "12px 18px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.03)",
                          border: "1.5px solid rgba(255,255,255,0.08)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: "var(--text-1)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {log.action.replace(/_/g, " ")}
                            </p>
                            <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.4, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                            </p>
                          </div>
                          {log.reason && (
                            <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.7, fontSize: "0.82rem" }}>
                              Reason: {log.reason}
                            </p>
                          )}
                          {(log.targetEmail || log.targetUid || log.targetId) && (
                            <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.5, fontSize: "0.8rem" }}>
                              Target: {log.targetEmail || log.targetUid || log.targetId}
                            </p>
                          )}
                          {(log.performedByEmail || log.performedByUid) && (
                            <p style={{ margin: 0, color: "var(--text-1)", opacity: 0.4, fontSize: "0.78rem" }}>
                              By: {log.performedByEmail || log.performedByUid}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
