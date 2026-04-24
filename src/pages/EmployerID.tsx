import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavbarComponent from "../components/Navbar";
import "../css/Page.css";

type Company = {
  _id: string;
  companyId: string;
  name: string;
  slug: string;
  industry: string;
  institutionType: string;
  location: string;
  website: string;
  description: string;
  salaryRange?: {
    min?: number;
    max?: number;
  } | null;
  benefitsOffered: string[];
  categoriesHiringFor?: string[];
  departmentsHiringFor?: string[];
  recruiterIds?: string[];
  jobs: string[];
  jobCount: number;
};

type Job = {
  _id: string;
  idCode: string;
  name: string;
  jobTitle?: string;
  company: string;
  institutionName?: string;
  salary: number | null;
  category?: string;
  department?: string;
  location?: string;
  applicationDeadline?: string;
  employmentType?: string;
  details?: {
    pay?: string;
    type?: string;
    shift?: string;
  };
};

type CompanyDetailResponse = {
  company: Company;
  jobs: Job[];
};

function EmployerID() {
  const { id } = useParams();
  const [companyCache, setCompanyCache] = useState<
    Record<string, CompanyDetailResponse>
  >({});
  const [errorCache, setErrorCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    if (companyCache[id] || errorCache[id]) return;

    fetch(`/api/companies/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((payload: CompanyDetailResponse) => {
        setCompanyCache((current) => ({ ...current, [id]: payload }));
      })
      .catch((err: Error) => {
        setErrorCache((current) => ({ ...current, [id]: err.message }));
      });
  }, [id, companyCache, errorCache]);

  const data = id ? companyCache[id] : null;
  const error = id ? errorCache[id] : null;
  const loading = Boolean(id) && !data && !error;

  return (
    <div className="page">
      <NavbarComponent />

      <div style={{paddingTop: 40}}></div>

      {!id && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: missing company id.</p>
        </div>
      )}
      {id && loading && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>Loading employer...</p>
        </div>
      )}
      {id && !loading && error && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}

      {id && !loading && !error && data && (
        <div style={{ background: "var(--secondary1)", borderRadius: 16, padding: 36, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header */}
          <div style={{ paddingBottom: 20, borderBottom: "2px solid var(--secondary2)" }}>
            <div className="text">
              <h1>{data.company.name}</h1>
              <p style={{ color: "#00637D", fontWeight: 500, fontSize: "1.25rem" }}>
                {data.company.industry || data.company.institutionType}
              </p>
            </div>
          </div>

          {/* Details list */}
          <div className="text" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.company.location && <p><strong>Location:</strong> {data.company.location}</p>}
            {data.company.website && (
              <p>
                <strong>Website:</strong>{" "}
                <a href={data.company.website} target="_blank" rel="noreferrer" style={{ color: "var(--button-mid)", fontWeight: 500 }}>
                  {data.company.website}
                </a>
              </p>
            )}
            {data.company.recruiterIds && data.company.recruiterIds.length > 0 && (
              <p><strong>Recruiters:</strong> {data.company.recruiterIds.length}</p>
            )}
            {data.company.salaryRange &&
              Number.isFinite(data.company.salaryRange.min) &&
              Number.isFinite(data.company.salaryRange.max) && (
              <p><strong>Typical Salary Range:</strong> ${data.company.salaryRange.min?.toLocaleString()} – ${data.company.salaryRange.max?.toLocaleString()}</p>
            )}
            {data.company.categoriesHiringFor && data.company.categoriesHiringFor.length > 0 && (
              <p><strong>Hiring Categories:</strong> {data.company.categoriesHiringFor.join(", ")}</p>
            )}
            {data.company.departmentsHiringFor && data.company.departmentsHiringFor.length > 0 && (
              <p><strong>Hiring Departments:</strong> {data.company.departmentsHiringFor.join(", ")}</p>
            )}
          </div>

          {/* Description */}
          {data.company.description && (
            <div style={{ paddingTop: 8, borderTop: "2px solid var(--secondary2)" }}>
              <div className="text">
                <h2>About</h2>
                <p>{data.company.description}</p>
              </div>
            </div>
          )}

          {/* Benefits */}
          {data.company.benefitsOffered?.length > 0 && (
            <div style={{ paddingTop: 8, borderTop: "2px solid var(--secondary2)" }}>
              <div className="text">
                <h2>Benefits Offered</h2>
                <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.company.benefitsOffered.map((benefit) => (
                    <li key={benefit}><p style={{ margin: 0 }}>{benefit}</p></li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Job listings */}
          <div style={{ paddingTop: 8, borderTop: "2px solid var(--secondary2)" }}>
            <div className="text">
              <h2>Job Listings</h2>
              {data.jobs.length === 0 && <p>No job listings found for this employer.</p>}
            </div>
            {data.jobs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
                {data.jobs.map((job) => (
                  <div key={job._id} style={{ background: "var(--secondary2)", borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <div className="text" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <h2 style={{ margin: 0 }}>{job.jobTitle || job.name}</h2>
                      <p style={{ margin: 0 }}>{job.employmentType || job.details?.type || "Type not listed"}</p>
                      <p style={{ margin: 0 }}>{job.location || "Location not listed"}</p>
                      {job.applicationDeadline && (
                        <p style={{ margin: 0, color: "var(--neg-secondary)", fontWeight: 600 }}>Apply by: {job.applicationDeadline}</p>
                      )}
                    </div>
                    <Link to={`/jobs/${job._id}`}>
                      <button className="btn" style={{ padding: "10px 20px", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                        View Job
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default EmployerID;
