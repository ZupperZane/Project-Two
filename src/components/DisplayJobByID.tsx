import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import NotificationPopup from "./NotificationPopup";

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
  salary: number | null;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  } | null;
  jobDescription?: string;
  requiredQualifications?: string[];
  applicationDeadline?: string;
  expectedStartDate?: string;
  recruiterId?: string;
  employmentType?: string;
  shift?: string;
  benefits?: string[];
  details?: {
    pay?: string;
    type?: string;
    shift?: string;
    benefits?: string[];
    description?: string;
  };
};

function formatSalary(job: Job) {
  if (
    job.salaryRange &&
    Number.isFinite(job.salaryRange.min) &&
    Number.isFinite(job.salaryRange.max)
  ) {
    const currency = (job.salaryRange.currency || "USD").toUpperCase();
    const interval = job.salaryRange.interval || "year";
    return `${currency} ${Number(job.salaryRange.min).toLocaleString()}-${Number(
      job.salaryRange.max
    ).toLocaleString()}/${interval}`;
  }

  if (typeof job.salary === "number" && Number.isFinite(job.salary)) {
    return `$${job.salary.toLocaleString()}/year`;
  }

  return "Not listed";
}

function JobDetails({ job }: { job: Job }) {
  const [notification, setNotification] = useState("");

  const title = job.jobTitle || job.name;
  const companyName = job.institutionName || job.company;
  const description =
    job.jobDescription || job.details?.description || "No description provided.";
  const employmentType = job.employmentType || job.details?.type || "Not listed";
  const shift = job.shift || job.details?.shift || "Not listed";
  const benefits = job.benefits?.length ? job.benefits : job.details?.benefits ?? [];
  const qualifications = job.requiredQualifications ?? [];

  const handleSendResume = () => {
    setNotification("Resume is being sent...");

    setTimeout(() => {
      setNotification("Resume sent successfully.");
    }, 3000);
  };

  const handleDownloadResume = () => {
    setNotification("Resume is being downloaded...");

    setTimeout(() => {
      setNotification("Resume downloaded successfully.");
    }, 3000);
  };

  return (
    <article>
      <h1>{title}</h1>
      <p>{companyName}</p>

      <div>
        <p><strong>Job ID:</strong> {job.idCode || "N/A"}</p>
        <p><strong>Company ID:</strong> {job.companyId || "N/A"}</p>
        <p><strong>Category:</strong> {job.category || "N/A"}</p>
        <p><strong>Department:</strong> {job.department || "N/A"}</p>
        <p><strong>Location:</strong> {job.location || "N/A"}</p>
        <p><strong>Employment Type:</strong> {employmentType}</p>
        <p><strong>Shift:</strong> {shift}</p>
        <p><strong>Salary:</strong> {formatSalary(job)}</p>
        <p><strong>Apply By:</strong> {job.applicationDeadline || "N/A"}</p>
        <p><strong>Expected Start:</strong> {job.expectedStartDate || "N/A"}</p>
        <p><strong>Recruiter ID:</strong> {job.recruiterId || "N/A"}</p>
      </div>

      <div>
        <h2>Description</h2>
        <p>{description}</p>
      </div>

      {qualifications.length > 0 && (
        <div>
          <h2>Required Qualifications</h2>
          <ul>
            {qualifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {benefits.length > 0 && (
        <div>
          <h2>Benefits</h2>
          <ul>
            {benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button onClick={handleSendResume}>
          Send Resume
        </button>

        <button onClick={handleDownloadResume}>
          Download Resume
        </button>
      </div>

      {notification && (
        <NotificationPopup
          message={notification}
          duration={5}
          onClose={() => setNotification("")}
        />
      )}
    </article>
  );
}

export default function SingleJobPage() {
  const { id } = useParams();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch job");
        return res.json();
      })
      .then((data) => {
        setJob(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading job...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!job) return <p>No job found</p>;

  return <JobDetails job={job} />;
}