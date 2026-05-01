import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../css/Page.css";

type Job = {
  _id: string;
  idCode: string;
  name: string;
  jobTitle?: string;
  company: string;
  institutionName?: string;
  companyId?: string;
  category?: string;
  department?: string;
  location?: string;
  salary: number | null;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  } | null;
  jobDescription?: string;
  requiredQualifications?: string[];
  applicationDeadline?: string;
  expectedStartDate?: string;
  recruiterId?: string;
  employmentType?: string;
  shift?: string;
  benefits?: string[];
  details?: {
    pay?: string;
    type?: string;
    shift?: string;
    benefits?: string[];
    description?: string;
  };
};

function formatSalary(job: Job) {
  if (
    job.salaryRange &&
    Number.isFinite(job.salaryRange.min) &&
    Number.isFinite(job.salaryRange.max)
  ) {
    const currency = (job.salaryRange.currency || "USD").toUpperCase();
    const interval = job.salaryRange.interval || "year";
    return `${currency} ${Number(job.salaryRange.min).toLocaleString()}-${Number(
      job.salaryRange.max
    ).toLocaleString()}/${interval}`;
  }

  if (typeof job.salary === "number" && Number.isFinite(job.salary)) {
    return `$${job.salary.toLocaleString()}/year`;
  }

  return "Not listed";
}

type ResumeEntry = { fileId: string; label: string; filename: string };

function QuickApply({ jobId }: { jobId: string }) {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "applied" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [defaultResumeFileId, setDefaultResumeFileId] = useState<string | null>(null);
  const [selectedResumeFileId, setSelectedResumeFileId] = useState<string>("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (role !== "job_seeker" || !user) return;
    user.getIdToken().then((token) =>
      fetch("/api/job-seeker/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          const list: ResumeEntry[] = Array.isArray(data.resumes) ? data.resumes : [];
          setResumes(list);
          const def = data.defaultResumeFileId ?? null;
          setDefaultResumeFileId(def);
          setSelectedResumeFileId(def ?? list[0]?.fileId ?? "");
          setProfileLoaded(true);
        })
        .catch(() => setProfileLoaded(true))
    );
  }, [role, user]);

  if (role !== "job_seeker") return null;
  if (status === "applied") return <p style={{ fontWeight: 600, color: "var(--button-heavy)" }}>Applied ✓</p>;

  const handleApply = async () => {
    if (!user) return;
    setStatus("loading");
    const token = await user.getIdToken();
    const res = await fetch("/api/job-seeker/applications", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, resumeFileId: selectedResumeFileId || undefined }),
    });
    if (res.status === 409 || res.ok) {
      setStatus("applied");
    } else {
      const data = await res.json().catch(() => null);
      setErrorMsg(data?.error ?? "Application failed.");
      setStatus("error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {profileLoaded && resumes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-1)", opacity: 0.55 }}>
            Resume to send
          </label>
          <select
            value={selectedResumeFileId}
            onChange={(e) => setSelectedResumeFileId(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.07)",
              color: "var(--text-1)",
              fontSize: "0.88rem",
              cursor: "pointer",
            }}
          >
            {resumes.map((r) => (
              <option key={r.fileId} value={r.fileId}>
                {r.label}{r.fileId === defaultResumeFileId ? " (default)" : ""}
              </option>
            ))}
            <option value="">No resume</option>
          </select>
        </div>
      )}

      <button className="btn" onClick={handleApply} disabled={status === "loading"} style={{ color: "var(--text-2)" }}>
        {status === "loading" ? "Applying..." : "Quick Apply"}
      </button>

      {status === "error" && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--neg-secondary)" }}>{errorMsg}</p>}
    </div>
  );
}

function JobDetails({ job }: { job: Job }) {
  const title = job.jobTitle || job.name;
  const companyName = job.institutionName || job.company;
  const description = job.jobDescription || job.details?.description || "No description provided.";
  const employmentType = job.employmentType || job.details?.type || "Not listed";
  const shift = job.shift || job.details?.shift || "Not listed";
  const benefits = job.benefits?.length ? job.benefits : (job.details?.benefits ?? []);
  const qualifications = job.requiredQualifications ?? [];
  const salary = formatSalary(job);

  return (
    <div style={{ background: "var(--secondary1)", borderRadius: 16, padding: 36, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, paddingBottom: 20, borderBottom: "2px solid var(--secondary2)" }}>
        <div className="text">
          <h1>{title}</h1>
          <p style={{ color: "#00637D", fontWeight: 500, fontSize: "1.25rem" }}>{companyName}</p>
        </div>
        <QuickApply jobId={job._id} />
      </div>

      {/* Details list */}
      <div className="text" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {job.location && <p><strong>Location:</strong> {job.location}</p>}
        {employmentType && <p><strong>Employment Type:</strong> {employmentType}</p>}
        {shift && <p><strong>Shift:</strong> {shift}</p>}
        {salary && <p><strong>Salary:</strong> {salary}</p>}
        {job.category && <p><strong>Category:</strong> {job.category}</p>}
        {job.department && <p><strong>Department:</strong> {job.department}</p>}
        {job.applicationDeadline && <p><strong>Apply By:</strong> {job.applicationDeadline}</p>}
        {job.expectedStartDate && <p><strong>Expected Start:</strong> {job.expectedStartDate}</p>}
        {job.idCode && <p><strong>Job ID:</strong> {job.idCode}</p>}
      </div>

      {/* Description */}
      <div style={{ paddingTop: 8, borderTop: "2px solid var(--secondary2)" }}>
        <div className="text">
          <h2>Description</h2>
          <p>{description}</p>
        </div>
      </div>

      {/* Qualifications */}
      {qualifications.length > 0 && (
        <div style={{ paddingTop: 8, borderTop: "2px solid var(--secondary2)" }}>
          <div className="text">
            <h2>Required Qualifications</h2>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
              {qualifications.map((item) => (
                <li key={item}><p style={{ margin: 0 }}>{item}</p></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Benefits */}
      {benefits.length > 0 && (
        <div style={{ paddingTop: 8, borderTop: "2px solid var(--secondary2)" }}>
          <div className="text">
            <h2>Benefits</h2>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
              {benefits.map((item) => (
                <li key={item}><p style={{ margin: 0 }}>{item}</p></li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}

export default function SingleJobPage() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch job");
        return res.json();
      })
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="page">
      {loading && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>Loading job...</p>
        </div>
      )}
      {!loading && error && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}
      {!loading && !error && !job && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>No job found</p>
        </div>
      )}
      {!loading && !error && job && <JobDetails job={job} />}
    </div>
  );
}
