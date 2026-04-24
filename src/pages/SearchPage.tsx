import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import NavbarComponent from "../components/Navbar";

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
    <div className="flex flex-col items-center min-h-screen gap-6">
      <NavbarComponent />

      <div className="w-full max-w-5xl px-4">
        <h1 className="text-2xl font-bold mb-1">
          Search results for "{query}"
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {resultCount} {type} found
        </p>

        {loading && <p>Searching...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {!loading && !error && resultCount === 0 && (
          <p>No {type} found for "{query}".</p>
        )}

        {type === "jobs" && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobResults.map((job) => (
              <Link to={`/jobs/${job._id}`} key={job._id}>
                <div className="border rounded-lg p-4 hover:shadow-md transition">
                  <h2 className="font-semibold text-lg">{job.jobTitle ?? job.name}</h2>
                  <p className="text-gray-600">{job.institutionName ?? job.company}</p>
                  {job.location && <p className="text-sm">{job.location}</p>}
                  {job.employmentType && <p className="text-sm">{job.employmentType}</p>}
                  <p className="text-sm font-medium mt-2">{job.details?.pay ?? "Salary not listed"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {type === "employers" && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employerResults.map((employer) => (
              <Link to={`/employers/${employer.slug || employer._id}`} key={employer._id}>
                <div className="border rounded-lg p-4 hover:shadow-md transition">
                  <h2 className="font-semibold text-lg">{employer.name}</h2>
                  {employer.industry && <p className="text-gray-600">{employer.industry}</p>}
                  {employer.location && <p className="text-sm">{employer.location}</p>}
                  {employer.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{employer.description}</p>
                  )}
                  <p className="text-sm mt-2">{employer.jobCount ?? 0} open positions</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;