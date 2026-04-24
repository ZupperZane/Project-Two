"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  applicationDeadline?: string;
  salary: number | null;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  } | null;
  employmentType?: string;
  shift?: string;
  jobDescription?: string;
  benefits?: string[];
  details: {
    pay: string;
    type: string;
    shift: string;
    benefits: string[];
    description: string;
  };
};

function formatSalary(job: Job) {
  if (
    job.salaryRange &&
    Number.isFinite(job.salaryRange.min) &&
    Number.isFinite(job.salaryRange.max)
  ) {
    const currency = job.salaryRange.currency || "USD";
    const interval = job.salaryRange.interval || "year";
    return `${currency} ${Number(job.salaryRange.min).toLocaleString()}-${Number(
      job.salaryRange.max
    ).toLocaleString()}/${interval}`;
  }

  if (typeof job.salary === "number" && Number.isFinite(job.salary)) {
    return `$${job.salary.toLocaleString()}/year`;
  }

  return null;
}

function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const title = job.jobTitle || job.name;
  const companyName = job.institutionName || job.company;
  const employmentType = job.employmentType || job.details?.type;
  const shift = job.shift || job.details?.shift;
  const description = job.jobDescription || job.details?.description;
  const benefits = job.benefits?.length ? job.benefits : (job.details?.benefits ?? []);
  const categoryLine = [job.category, job.department].filter(Boolean).join(" • ");
  const salary = formatSalary(job);

  return (
    <div className="job-card">
      <div className="text">
        <h2>{title}</h2>

        {/* Company */}
        <p style={{ color: "#00637D", fontWeight: 500 }}>{companyName}</p>

        {/* Location */}
        {job.location && <p>{job.location}</p>}

        {/* Category / Department */}
        {categoryLine && <p>{categoryLine}</p>}

        {/* Employment Type */}
        {employmentType && <p>{employmentType}</p>}

        {/* Shift */}
        {shift && <p>{shift}</p>}

        {/* Description */}
        {description && <p style={{ paddingBottom: "20px" }}>{description}</p>}

        {/* Benefits */}
        {benefits.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 12 }}>
            {benefits.slice(0, expanded ? undefined : 3).map((b) => (
              <div key={b} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "var(--secondary2)", color: "var(--text-1)" }}>
                {b}
              </div>
            ))}
            {/* Displays how many more benefits */}
            {!expanded && benefits.length > 3 && (
              <div style={{ fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "var(--secondary2)", color: "var(--text-1)", opacity: 0.6 }}>
                +{benefits.length - 3} more
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "2px solid var(--text-1)" }}>
          <div className="text" style={{ display: "flex", flexDirection: "column" }}>

            {/* Salary */}
            {salary && <p style={{ margin: 0 }}>{salary}</p>}

            {/* Deadline */}
            {job.applicationDeadline && (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--neg-secondary)", fontWeight: 600 }}>
                Apply by: {job.applicationDeadline}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <Link to={`/jobs/${job._id}`}>
              <button className="btn" style={{ padding: "12px 20px", color: "var(--text-2)" }}>
                Apply
              </button>
            </Link>
            {benefits.length > 3 && (
              <button
                onClick={() => setExpanded((current) => !current)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--button-mid)" }}
              >
                {expanded ? "Show less" : "Show all benefits"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisplayAllJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="text">
        <h1>Job Listings</h1>
        <p style={{ paddingBottom: "40px" }}>{jobs.length} position{jobs.length !== 1 ? "s" : ""} available</p>
      </div>

      {loading && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>Loading jobs. Please wait...</p>
        </div>
      )}

      {!loading && error && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>No jobs found</p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="job-grid">
          {jobs.slice(0, 16).map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

export default DisplayAllJobs;
