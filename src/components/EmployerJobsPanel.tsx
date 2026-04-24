import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

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
  const [error, setError] = useState<string | null>(null);

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
    setLoadingApplicants(true);
    user.getIdToken().then((token) =>
      fetch(`/api/employer/jobs/${selectedJobId}/applicants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => { setApplicants(data); setLoadingApplicants(false); })
        .catch(() => { setError("Failed to load applicants."); setLoadingApplicants(false); })
    );
  }, [selectedJobId, user]);

  if (loadingJobs) return <p style={{ color: "var(--text-1)" }}>Loading jobs...</p>;
  if (error) return <p style={{ color: "var(--neg-secondary)" }}>{error}</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 600 }}>
      <h2 style={{ margin: 0, color: "var(--text-1)" }}>Your Job Postings</h2>

      {jobs.length === 0 ? (
        <p style={{ color: "var(--text-1)", opacity: 0.6 }}>No jobs posted yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {jobs.map((job) => (
            <button
              key={job._id}
              className="btn"
              onClick={() => setSelectedJobId(job._id === selectedJobId ? null : job._id)}
              style={{
                color: "var(--text-2)",
                opacity: selectedJobId === job._id ? 1 : 0.75,
                textAlign: "left",
              }}
            >
              {job.jobTitle ?? job.name}
            </button>
          ))}
        </div>
      )}

      {selectedJobId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ margin: 0, color: "var(--text-1)" }}>Applicants</h3>
          {loadingApplicants ? (
            <p style={{ color: "var(--text-1)" }}>Loading...</p>
          ) : applicants.length === 0 ? (
            <p style={{ color: "var(--text-1)", opacity: 0.6 }}>No applicants yet.</p>
          ) : (
            applicants.map((app) => (
              <div
                key={app._id}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
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
                    style={{ color: "var(--text-2)", fontSize: "0.85rem", whiteSpace: "nowrap" }}
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
