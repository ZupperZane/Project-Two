"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

  return "Salary not listed";
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

  return (
    <Link to={`/jobs/${job._id}`}>
      <article style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "14px" }}>
        <div>
          <h2>{title}</h2>
          <p>{companyName}</p>
          {job.location && <p>{job.location}</p>}
          {categoryLine && <p>{categoryLine}</p>}
          <p>{employmentType ?? "Type not listed"}</p>
        </div>

        <div>
          <p>{formatSalary(job)}</p>
          {shift && <p>{shift}</p>}
          <p>{job.idCode}</p>
        </div>

        {description && <p>{description}</p>}
        {job.applicationDeadline && <p>Apply by: {job.applicationDeadline}</p>}

        {benefits.length > 0 && (
          <div>
            {benefits
              .slice(0, expanded ? undefined : 3)
              .map((b) => (
                <span key={b}>{b}</span>
              ))}
            {!expanded && benefits.length > 3 && (
              <span>+{benefits.length - 3} more</span>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            setExpanded((current) => !current);
          }}
        >
          {expanded ? "Show less" : "View details"}
        </button>
      </article>
    </Link>
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
    <div>
      <div>
        <h1>Job listings</h1>
        <p>{jobs.length} position{jobs.length !== 1 ? "s" : ""} available</p>
      </div>

      <div>
        {loading && <div>Loading jobs…</div>}
        {!loading && error && <div>Error: {error}</div>}
        {!loading && !error && jobs.length === 0 && <div>No jobs found.</div>}

        {!loading && !error && jobs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {jobs.slice(0, 16).map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DisplayAllJobs;
