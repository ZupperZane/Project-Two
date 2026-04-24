import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  categoriesHiringFor?: string[];
  departmentsHiringFor?: string[];
  recruiterIds?: string[];
  salaryRangeSummary?: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
  jobCount: number;
};

function getCompanyPath(company: Company) {
  const identifier = company.slug || company.companyId || company._id;
  return `/employer/${encodeURIComponent(identifier)}`;
}

function DisplayAllCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data: Company[]) => {
        setCompanies(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <div className="text">
        <h1>Employers</h1>
        <p style={{paddingBottom: "40px"}}>{companies.length} compan{companies.length === 1 ? "y" : "ies"} available</p>
      </div>

      {loading && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>Loading employers. Please wait...</p>
        </div>
      )}

      {!loading && error && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>No employers found</p>
        </div>
      )}

      {/* Could find and load companies */}
      {!loading && !error && companies.length > 0 && (
        <div className="company-grid">
          {companies.map((company) => (
            <div key={company._id} className="company-card">
              <div className="text">
                <h2>
                  {company.name}
                </h2>

              {/* Industry */}
              <p style={{ color: "#00637D", fontWeight: 500 }}>{company.industry || company.institutionType || "Industry not listed"}</p>

              {/* Location */}
              <p>{company.location || "Location not listed"}</p>

              {/* Recruiters */}
              {company.recruiterIds && company.recruiterIds.length > 0 && (
                <p>
                  {company.recruiterIds.length} recruiter{company.recruiterIds.length === 1 ? "" : "s"}
                </p>
              )}

              {/* Website */}
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" style={{ color: "var(--button-mid)", fontWeight: 500 }}>
                  {company.website}
                </a>
              )}
 
              {/* Description */}
              {company.description && (
                <p style={{ paddingBottom: "20px" }}>{company.description}</p>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "2px solid var(--text-1)"}}>

                <div className="text" style={{ display: "flex", flexDirection: "column"}}>
                  {/* Salary */}
                    {company.salaryRangeSummary && (company.salaryRangeSummary.min != null || company.salaryRangeSummary.max != null) && (
                      <p>
                        {company.salaryRangeSummary.currency ?? "$"}{company.salaryRangeSummary.min?.toLocaleString()} – 
                        {company.salaryRangeSummary.currency ?? "$"}{company.salaryRangeSummary.max?.toLocaleString()}
                      </p>
                    )}
 
                  {/* Positions Available */}
                  <div style={{ fontWeight: 700, color: company.jobCount > 0 ? "var(--pos-tertiary)" : "var(--neg-secondary)" }}>
                    {company.jobCount ?? 0} open role{company.jobCount === 1 ? "" : "s"}
                  </div>
                </div>
 
                <Link to={getCompanyPath(company)}>
                  <button className="btn" style={{ padding: "12px 20px", color: "var(--text-2)" }}>
                    View
                  </button>
                </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DisplayAllCompanies;
