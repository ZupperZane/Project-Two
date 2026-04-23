
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
    <section>
      <h1>Employers</h1>
      <p>{companies.length} compan{companies.length === 1 ? "y" : "ies"} available</p>

      {loading && <p>Loading employers...</p>}
      {!loading && error && <p>Error: {error}</p>}
      {!loading && !error && companies.length === 0 && <p>No employers found.</p>}

      {!loading && !error && companies.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {companies.map((company) => (
            <Link
              key={company._id}
              to={getCompanyPath(company)}
              style={{ border: "1px solid #ddd", borderRadius: "10px", padding: "14px" }}
            >
              <h2>{company.name}</h2>
              <p>{company.industry || company.institutionType || "Industry not listed"}</p>
              <p>{company.location || "Location not listed"}</p>
              <p>{company.jobCount ?? 0} open roles</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default DisplayAllCompanies;
