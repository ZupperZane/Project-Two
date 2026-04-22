import { Link } from "react-router-dom";
import "../css/DisplayAllCompanies.css";

type Company = {
  id: number;
  name: string;
  location: string;
  industry: string;
  openJobs: number;
};

function DisplayAllCompanies() {
  const companies: Company[] = [
    {
      id: 1,
      name: "North Valley University",
      location: "California",
      industry: "Higher Education",
      openJobs: 4,
    },
    {
      id: 2,
      name: "Sunrise State College",
      location: "Florida",
      industry: "Higher Education",
      openJobs: 3,
    },
    {
      id: 3,
      name: "TechBridge Institute",
      location: "Texas",
      industry: "Research / Education",
      openJobs: 5,
    },
    {
      id: 4,
      name: "Greenfield Community College",
      location: "New York",
      industry: "Community College",
      openJobs: 2,
    },
  ];

  return (
    <section className="companies-section">
      <div className="companies-header">
        <p className="companies-subtitle">Browse institutions and employers</p>
        <h2 className="companies-title">All Companies</h2>
      </div>

      <div className="companies-grid">
        {companies.map((company) => (
          <div key={company.id} className="company-card">
            <div className="company-card-top">
              <div className="company-badge">Company</div>
              <h3 className="company-name">{company.name}</h3>
            </div>

            <div className="company-info">
              <p>
                <span>Location</span>
                {company.location}
              </p>
              <p>
                <span>Industry</span>
                {company.industry}
              </p>
              <p>
                <span>Open Jobs</span>
                {company.openJobs}
              </p>
            </div>

            <Link to="/EmployerID" className="company-button">
              View Company
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DisplayAllCompanies;