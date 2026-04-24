import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";

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

function QuickApply({ jobId }: { jobId: string }) {
  const { user, role } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "applied" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (role !== "job_seeker") return null;

  const handleApply = async () => {
    if (!user) return;
    setStatus("loading");
    const token = await user.getIdToken();
    const res = await fetch("/api/job-seeker/applications", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (res.status === 409) {
      setStatus("applied");
    } else if (res.ok) {
      setStatus("applied");
    } else {
      const data = await res.json().catch(() => null);
      setErrorMsg(data?.error ?? "Application failed.");
      setStatus("error");
    }
  };

  if (status === "applied") return <p style={{ fontWeight: 600, color: "var(--button-heavy)" }}>Applied ✓</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button className="btn" onClick={handleApply} disabled={status === "loading"}
        style={{ color: "var(--text-2)" }}>
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

  return (
    <article>
      <h1>{title}</h1>
      <p>{companyName}</p>
      <QuickApply jobId={job._id} />

      <div>
        <p><strong>Job ID:</strong> {job.idCode || "N/A"}</p>
        <p><strong>Company ID:</strong> {job.companyId || "N/A"}</p>
        <p><strong>Category:</strong> {job.category || "N/A"}</p>
        <p><strong>Department:</strong> {job.department || "N/A"}</p>
        <p><strong>Location:</strong> {job.location || "N/A"}</p>
        <p><strong>Employment Type:</strong> {employmentType}</p>
        <p><strong>Shift:</strong> {shift}</p>
        <p><strong>Salary:</strong> {formatSalary(job)}</p>
        <p><strong>Apply By:</strong> {job.applicationDeadline || "N/A"}</p>
        <p><strong>Expected Start:</strong> {job.expectedStartDate || "N/A"}</p>
        <p><strong>Recruiter ID:</strong> {job.recruiterId || "N/A"}</p>
      </div>

      <div>
        <h2>Description</h2>
        <p>{description}</p>
      </div>

      {qualifications.length > 0 && (
        <div>
          <h2>Required Qualifications</h2>
          <ul>
            {qualifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {benefits.length > 0 && (
        <div>
          <h2>Benefits</h2>
          <ul>
            {benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
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

  if (loading) return <p>Loading job...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!job) return <p>No job found</p>;

  return <JobDetails job={job} />;
}
