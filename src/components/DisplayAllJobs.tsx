"use client";

import { useEffect, useState } from "react";
import "../css/DisplayAllJobs.css";

type Job = {
  _id: string;
  idCode: string;
  name: string;
  company: string;
  salary: number;
  details: {
    pay: string;
    type: string;
    shift: string;
    benefits: string[];
    description: string;
  };
};

function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="job-card">
      <div className="job-top">
        <h2>{job.name}</h2>
        <p className="job-company">{job.company}</p>
        <span className="job-type">{job.details?.type ?? "—"}</span>
      </div>

      <div className="job-meta">
        <span><strong>${job.salary?.toLocaleString()}</strong></span>
        <span>/yr</span>
        {job.details?.shift && <span>{job.details.shift}</span>}
        <span>{job.idCode}</span>
      </div>

      {job.details?.description && (
        <p className="job-description">
          {expanded
            ? job.details.description
            : `${job.details.description.slice(0, 120)}${job.details.description.length > 120 ? "..." : ""}`}
        </p>
      )}

      {job.details?.benefits?.length > 0 && (
        <div className="job-benefits">
          {job.details.benefits
            .slice(0, expanded ? undefined : 3)
            .map((b) => (
              <span key={b} className="benefit-tag">{b}</span>
            ))}
          {!expanded && job.details.benefits.length > 3 && (
            <span className="benefit-tag more-tag">+{job.details.benefits.length - 3} more</span>
          )}
        </div>
      )}

      <button className="job-button" onClick={() => setExpanded((e) => !e)}>
        {expanded ? "Show less" : "View details"}
      </button>
    </article>
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
    <div className="jobs-container">
      <div className="jobs-header">
        <h1>Job listings</h1>
        <p>{jobs.length} position{jobs.length !== 1 ? "s" : ""} available</p>
      </div>

      <div>
        {loading && <div className="jobs-message">Loading jobs...</div>}
        {error && <div className="jobs-message error-message">Error: {error}</div>}
        {!loading && !error && jobs.length === 0 && (
          <div className="jobs-message">No jobs found.</div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div className="jobs-grid">
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