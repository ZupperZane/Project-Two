
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
  return (
    <article>
      <h1>{job.name}</h1>
      <p>{job.company}</p>

      <div>
        <span>{job.details?.type}</span>
        <span>${job.salary?.toLocaleString()}/yr</span>
        <span>{job.details?.shift}</span>
        <span>{job.idCode}</span>
      </div>

      <p>{job.details?.description}</p>

      {job.details?.benefits?.length > 0 && (
        <ul>
          {job.details.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
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

  return <JobCard job={job} />;
}