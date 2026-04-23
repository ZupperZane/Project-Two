"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
 <Link to={`/jobs/${job._id}`}>
    <article>
      <div>
        <h2>{job.name}</h2>
        <p>{job.company}</p>
        <span>{job.details?.type ?? "—"}</span>
      </div>

      <div>
        <span>${job.salary?.toLocaleString()}</span>
        <span>/yr</span>
        {job.details?.shift && <span>{job.details.shift}</span>}
        <span>{job.idCode}</span>
      </div>

      {job.details?.description && <p>{job.details.description}</p>}

      {job.details?.benefits?.length > 0 && (
        <div>
          {job.details.benefits
            .slice(0, expanded ? undefined : 3)
            .map((b) => (
              <span key={b}>{b}</span>
            ))}
          {!expanded && job.details.benefits.length > 3 && (
            <span>+{job.details.benefits.length - 3} more</span>
          )}
        </div>
      )}

        <button
          onClick={(e) => {
            e.preventDefault(); // stops navigation
            setExpanded((e) => !e);
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