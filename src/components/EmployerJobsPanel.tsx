import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import "../css/Page.css";

type Applicant = {
  _id: string;
  dateApplied: string;
  status: string;
  candidate: {
    uid: string;
    email: string;
    fullName: string;
    headline: string;
    resumeFileId: string | null;
  };
};

type Job = {
  _id: string;
  name: string;
  jobTitle?: string;
};

export default function EmployerJobsPanel() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/employer/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { setJobs(data); setLoadingJobs(false); })
        .catch(() => { setError("Failed to load jobs."); setLoadingJobs(false); })
    );
  }, [user]);

  useEffect(() => {
    if (!selectedJobId || !user) return;

    let active = true;
    const currentUser = user;

    async function loadApplicants() {
      setLoadingApplicants(true);
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/employer/jobs/${selectedJobId}/applicants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!active) return;
        setApplicants(data);
      } catch {
        if (active) setError("Failed to load applicants.");
      } finally {
        if (active) setLoadingApplicants(false);
      }
    }

    void loadApplicants();

    return () => {
      active = false;
    };
  }, [selectedJobId, user]);

  const deleteJob = async (job: Job) => {
    if (!user) {
      setActionError("You must be signed in to delete a posting.");
      return;
    }

    const title = job.jobTitle ?? job.name;
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionError(null);
    setDeletingJobId(job._id);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/employer/jobs/${job._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete job posting.");
      }

      setJobs((current) => current.filter((item) => item._id !== job._id));
      if (selectedJobId === job._id) {
        setSelectedJobId(null);
        setApplicants([]);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete job posting.");
    } finally {
      setDeletingJobId(null);
    }
  };

  if (loadingJobs) return <p className="muted-text">Loading jobs...</p>;
  if (error) return <p style={{ color: "var(--neg-secondary)" }}>{error}</p>;

  return (
    <div className="content-panel compact">
      <div className="form-section-title">
        <h2>Your Job Postings</h2>
        <p className="muted-text">Select a posting to review applicants.</p>
      </div>

      {jobs.length === 0 ? (
        <p className="muted-text">No jobs posted yet.</p>
      ) : (
        <div className="stack-list">
          {jobs.map((job) => (
            <div key={job._id} className="posting-row">
              <button
                className={selectedJobId === job._id ? "btn posting-select" : "btn btn-quiet posting-select"}
                onClick={() => setSelectedJobId(job._id === selectedJobId ? null : job._id)}
                type="button"
              >
                {job.jobTitle ?? job.name}
              </button>
              <button
                className="btn danger-button posting-delete"
                disabled={deletingJobId === job._id}
                onClick={() => deleteJob(job)}
                type="button"
              >
                {deletingJobId === job._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}

      {actionError && (
        <p style={{ color: "var(--neg-secondary)", fontWeight: 700 }}>{actionError}</p>
      )}

      {selectedJobId && (
        <div className="form-section">
          <h3 style={{ margin: 0, color: "var(--text-1)" }}>Applicants</h3>
          {loadingApplicants ? (
            <p className="muted-text">Loading...</p>
          ) : applicants.length === 0 ? (
            <p className="muted-text">No applicants yet.</p>
          ) : (
            applicants.map((app) => (
              <div
                key={app._id}
                className="applicant-card"
                style={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "var(--text-1)" }}>
                    {app.candidate.fullName || app.candidate.email}
                  </p>
                  {app.candidate.headline && (
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-1)", opacity: 0.65 }}>
                      {app.candidate.headline}
                    </p>
                  )}
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-1)", opacity: 0.5 }}>
                    Applied {new Date(app.dateApplied).toLocaleDateString()}
                  </p>
                </div>
                {app.candidate.resumeFileId ? (
                  <a
                    href={`/api/resume/${app.candidate.resumeFileId}`}
                    className="btn"
                    style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}
                  >
                    Download Resume
                  </a>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-1)", opacity: 0.4 }}>
                    No resume
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
