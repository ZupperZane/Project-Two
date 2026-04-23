import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavbarComponent from "../components/Navbar";

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
    <div>
      <NavbarComponent />

      {!id && <p>Error: missing company id.</p>}
      {id && loading && <p>Loading employer...</p>}
      {id && !loading && error && <p>Error: {error}</p>}

      {id && !loading && !error && data && (
        <section>
          <h1>{data.company.name}</h1>
          <p>{data.company.industry || data.company.institutionType}</p>
          <p>{data.company.location}</p>
          {data.company.website && (
            <p>
              <a href={data.company.website} target="_blank" rel="noreferrer">
                {data.company.website}
              </a>
            </p>
          )}
          {data.company.description && <p>{data.company.description}</p>}
          {data.company.categoriesHiringFor && data.company.categoriesHiringFor.length > 0 && (
            <p>Hiring categories: {data.company.categoriesHiringFor.join(", ")}</p>
          )}
          {data.company.departmentsHiringFor && data.company.departmentsHiringFor.length > 0 && (
            <p>Hiring departments: {data.company.departmentsHiringFor.join(", ")}</p>
          )}
          {data.company.recruiterIds && data.company.recruiterIds.length > 0 && (
            <p>{data.company.recruiterIds.length} recruiter account(s)</p>
          )}

          {data.company.salaryRange &&
          Number.isFinite(data.company.salaryRange.min) &&
          Number.isFinite(data.company.salaryRange.max) ? (
            <p>
              Typical salary range: ${data.company.salaryRange.min?.toLocaleString()} - $
              {data.company.salaryRange.max?.toLocaleString()}
            </p>
          ) : null}

          {data.company.benefitsOffered?.length > 0 && (
            <div>
              <h2>Benefits</h2>
              <ul>
                {data.company.benefitsOffered.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2>Job listings</h2>
            {data.jobs.length === 0 && <p>No job listings found for this employer.</p>}
            {data.jobs.length > 0 && (
              <ul>
                {data.jobs.map((job) => (
                  <li key={job._id} style={{ marginBottom: "12px" }}>
                    <Link to={`/jobs/${job._id}`}>{job.jobTitle || job.name}</Link>
                    <div><strong>Job ID:</strong> {job.idCode}</div>
                    <div><strong>Type:</strong> {job.employmentType || job.details?.type || "N/A"}</div>
                    <div><strong>Location:</strong> {job.location || "N/A"}</div>
                    <div>
                      <strong>Category / Department:</strong>{" "}
                      {[job.category, job.department].filter(Boolean).join(" / ") || "N/A"}
                    </div>
                    <div>
                      <strong>Salary:</strong>{" "}
                      {job.salary !== null ? `$${job.salary.toLocaleString()}` : "N/A"}
                    </div>
                    <div><strong>Apply by:</strong> {job.applicationDeadline || "N/A"}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default EmployerID;
