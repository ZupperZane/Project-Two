import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import NavbarComponent from "../components/Navbar";
import "../css/Page.css";

type Job = {
  _id: string;
  idCode: string;
  jobTitle?: string;
  name: string;
  company: string;
  institutionName?: string;
  location?: string;
  employmentType?: string;
  salary: number | null;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  } | null;
  details: {
    pay: string;
    type: string;
    shift: string;
    benefits: string[];
    description: string;
  };
};

type Employer = {
  _id: string;
  name: string;
  slug: string;
  industry?: string;
  location?: string;
  description?: string;
  jobCount?: number;
};

function SearchPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "jobs";
  const query = searchParams.get("q") ?? "";

  const [jobResults, setJobResults] = useState<Job[]>([]);
  const [employerResults, setEmployerResults] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);

    const url =
      type === "jobs"
        ? `/api/jobs?search=${encodeURIComponent(query)}`
        : `/api/companies?search=${encodeURIComponent(query)}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (type === "jobs") setJobResults(data);
        else setEmployerResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [query, type]);

  const resultCount = type === "jobs" ? jobResults.length : employerResults.length;

  return (
    <div className="page">
      <NavbarComponent />

      <div className="text">
        <h1>Results for "{query}"</h1>
        <p style={{ paddingBottom: 40 }}>{resultCount} {type} found</p>
      </div>

      {loading && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>Searching...</p>
        </div>
      )}

      {!loading && error && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && resultCount === 0 && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>No {type} found for "{query}"</p>
        </div>
      )}

      {/* Job Results */}
      {type === "jobs" && !loading && !error && jobResults.length > 0 && (
        <div className="search-grid">
          {jobResults.map((job) => (
            <div key={job._id} className="search-card">
              <div className="text">
                <h2>{job.jobTitle ?? job.name}</h2>
                <p style={{ color: "#00637D", fontWeight: 500 }}>{job.institutionName ?? job.company}</p>
                {job.location && <p>{job.location}</p>}
                {job.employmentType && <p>{job.employmentType}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "2px solid var(--secondary2)", marginTop: 10 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-1)" }}>
                  {job.details?.pay || "Salary not listed"}
                </div>
                <Link to={`/jobs/${job._id}`}>
                  <button className="btn" style={{ padding: "9px 18px", fontSize: "0.88rem", color: "var(--text-2)" }}>
                    View
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Employer Results */}
      {type === "employers" && !loading && !error && employerResults.length > 0 && (
        <div className="search-grid">
          {employerResults.map((employer) => (
            <div key={employer._id} className="search-card">
              <div className="text">
                <h2>{employer.name}</h2>
                {employer.industry && <p style={{ color: "#00637D", fontWeight: 500 }}>{employer.industry}</p>}
                {employer.location && <p>{employer.location}</p>}
                {employer.description && <p>{employer.description}</p>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "2px solid var(--secondary2)", marginTop: 10 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: employer.jobCount ?? 0 > 0 ? "var(--pos-tertiary)" : "var(--neg-secondary)" }}>
                  {employer.jobCount ?? 0} open role{employer.jobCount === 1 ? "" : "s"}
                </div>
                <Link to={`/employer/${employer.slug || employer._id}`}>
                  <button className="btn" style={{ padding: "9px 18px", fontSize: "0.88rem", color: "var(--text-2)" }}>
                    View
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default SearchPage;
