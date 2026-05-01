"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import "../css/Page.css";

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
  applicationDeadline?: string;
  expectedStartDate?: string;
  salary: number | null;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
  } | null;
  employmentType?: string;
  shift?: string;
  jobDescription?: string;
  benefits?: string[];
  details: {
    pay: string;
    type: string;
    shift: string;
    benefits: string[];
    description: string;
  };
};

type EditDraft = {
  jobTitle: string;
  category: string;
  department: string;
  location: string;
  salary: string;
  employmentType: string;
  shift: string;
  applicationDeadline: string;
  expectedStartDate: string;
  jobDescription: string;
};

function formatSalary(job: Job) {
  if (
    job.salaryRange &&
    Number.isFinite(job.salaryRange.min) &&
    Number.isFinite(job.salaryRange.max)
  ) {
    const currency = job.salaryRange.currency || "USD";
    const interval = job.salaryRange.interval || "year";
    return `${currency} ${Number(job.salaryRange.min).toLocaleString()}-${Number(
      job.salaryRange.max
    ).toLocaleString()}/${interval}`;
  }

  if (typeof job.salary === "number" && Number.isFinite(job.salary)) {
    return `$${job.salary.toLocaleString()}/year`;
  }

  return null;
}

function buildDraft(job: Job): EditDraft {
  return {
    jobTitle: job.jobTitle || job.name || "",
    category: job.category || "",
    department: job.department || "",
    location: job.location || "",
    salary: typeof job.salary === "number" && Number.isFinite(job.salary) ? String(job.salary) : "",
    employmentType: job.employmentType || job.details?.type || "",
    shift: job.shift || job.details?.shift || "",
    applicationDeadline: job.applicationDeadline || "",
    expectedStartDate: job.expectedStartDate || "",
    jobDescription: job.jobDescription || job.details?.description || "",
  };
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--neg-secondary)" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function JobCard({
  job,
  isOwner,
  isAdmin,
  isJobSeeker,
  isFavorited,
  onToggleFavorite,
  isEditing,
  draft,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  saving,
  deleting,
}: {
  job: Job;
  isOwner: boolean;
  isAdmin: boolean;
  isJobSeeker: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isEditing: boolean;
  draft: EditDraft | null;
  onDraftChange: (field: keyof EditDraft, value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = job.jobTitle || job.name;
  const companyName = job.institutionName || job.company;
  const employmentType = job.employmentType || job.details?.type;
  const shift = job.shift || job.details?.shift;
  const description = job.jobDescription || job.details?.description;
  const benefits = job.benefits?.length ? job.benefits : (job.details?.benefits ?? []);
  const categoryLine = [job.category, job.department].filter(Boolean).join(" • ");
  const salary = formatSalary(job);

  return (
    <div className="job-card">
      <div className="text">
        <h2>{title}</h2>

        <p style={{ color: "#00637D", fontWeight: 500 }}>{companyName}</p>
        {job.location && <p>{job.location}</p>}
        {categoryLine && <p>{categoryLine}</p>}
        {employmentType && <p>{employmentType}</p>}
        {shift && <p>{shift}</p>}

        {isEditing && draft ? (
          <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
            <input value={draft.jobTitle} onChange={(event) => onDraftChange("jobTitle", event.target.value)} placeholder="Job title" />
            <input value={draft.category} onChange={(event) => onDraftChange("category", event.target.value)} placeholder="Category" />
            <input value={draft.department} onChange={(event) => onDraftChange("department", event.target.value)} placeholder="Department" />
            <input value={draft.location} onChange={(event) => onDraftChange("location", event.target.value)} placeholder="Location" />
            <input value={draft.salary} onChange={(event) => onDraftChange("salary", event.target.value)} placeholder="Salary" type="number" />
            <input value={draft.employmentType} onChange={(event) => onDraftChange("employmentType", event.target.value)} placeholder="Employment type" />
            <input value={draft.shift} onChange={(event) => onDraftChange("shift", event.target.value)} placeholder="Shift" />
            <label>
              Application deadline
              <input value={draft.applicationDeadline} onChange={(event) => onDraftChange("applicationDeadline", event.target.value)} type="date" />
            </label>
            <label>
              Expected start date
              <input value={draft.expectedStartDate} onChange={(event) => onDraftChange("expectedStartDate", event.target.value)} type="date" />
            </label>
            <textarea
              value={draft.jobDescription}
              onChange={(event) => onDraftChange("jobDescription", event.target.value)}
              placeholder="Job description"
              rows={4}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" style={{ color: "var(--text-2)" }} onClick={onSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn" onClick={onCancelEdit} disabled={saving}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {description && <p style={{ paddingBottom: "20px" }}>{description}</p>}

            {benefits.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 12 }}>
                {benefits.slice(0, expanded ? undefined : 3).map((b) => (
                  <div key={b} style={{ fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "var(--secondary2)", color: "var(--text-1)" }}>
                    {b}
                  </div>
                ))}
                {!expanded && benefits.length > 3 && (
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "var(--secondary2)", color: "var(--text-1)", opacity: 0.6 }}>
                    +{benefits.length - 3} more
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "2px solid var(--text-1)" }}>
          <div className="text" style={{ display: "flex", flexDirection: "column" }}>
            {salary && <p style={{ margin: 0 }}>{salary}</p>}
            {job.applicationDeadline && (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--neg-secondary)", fontWeight: 600 }}>
                Apply by: {job.applicationDeadline}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isJobSeeker && (
                <button
                  onClick={onToggleFavorite}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--text-1)", opacity: isFavorited ? 1 : 0.45, lineHeight: 0 }}
                  title={isFavorited ? "Remove from saved" : "Save job"}
                >
                  <HeartIcon filled={isFavorited} />
                </button>
              )}
              <Link to={`/jobs/${job._id}`}>
                <button className="btn" style={{ padding: "12px 20px", color: "var(--text-2)" }}>
                  View Details
                </button>
              </Link>
            </div>

            {(isOwner || isAdmin) && !isEditing && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={onStartEdit}>Edit</button>
                <button className="btn" onClick={onDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}

            {!isEditing && benefits.length > 3 && (
              <button
                onClick={() => setExpanded((current) => !current)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--button-mid)" }}
              >
                {expanded ? "Show less" : "Show all benefits"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisplayAllJobs() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const isJobSeeker = role === "job_seeker";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerJobIds, setOwnerJobIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({});
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/jobs")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setJobs(Array.isArray(data) ? (data as Job[]) : []);
        setLoading(false);
      })
      .catch((requestError) => {
        setError(requestError.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (role !== "employer" || !user) {
      setOwnerJobIds(new Set());
      return;
    }

    user.getIdToken()
      .then((token) =>
        fetch("/api/employer/jobs", {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const ids = Array.isArray(data)
          ? data
              .map((item) => (item && typeof item === "object" ? String((item as { _id?: string })._id || "") : ""))
              .filter((id) => Boolean(id))
          : [];

        setOwnerJobIds(new Set(ids));
      })
      .catch(() => {
        setOwnerJobIds(new Set());
      });
  }, [role, user]);

  useEffect(() => {
    if (role !== "job_seeker" || !user) {
      setFavoriteIds(new Set());
      return;
    }
    user.getIdToken()
      .then((token) => fetch("/api/job-seeker/favorites", { headers: { Authorization: `Bearer ${token}` } }))
      .then((r) => r.json())
      .then((data: Job[]) => setFavoriteIds(new Set(Array.isArray(data) ? data.map((j) => j._id) : [])))
      .catch(() => setFavoriteIds(new Set()));
  }, [role, user]);

  const toggleFavorite = async (jobId: string) => {
    if (!user) return;
    const isFav = favoriteIds.has(jobId);
    const token = await user.getIdToken();
    const method = isFav ? "DELETE" : "POST";
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(jobId) : next.add(jobId);
      return next;
    });
    fetch(`/api/job-seeker/favorites/${jobId}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(jobId) : next.delete(jobId);
        return next;
      });
    });
  };

  const sortedJobs = useMemo(() => jobs, [jobs]);

  const startEdit = (job: Job) => {
    setActionError(null);
    setEditingJobId(job._id);
    setEditDrafts((current) => ({
      ...current,
      [job._id]: buildDraft(job),
    }));
  };

  const updateDraft = (jobId: string, field: keyof EditDraft, value: string) => {
    setEditDrafts((current) => ({
      ...current,
      [jobId]: {
        ...current[jobId],
        [field]: value,
      },
    }));
  };

  const cancelEdit = () => {
    setEditingJobId(null);
  };

  const saveEdit = async (jobId: string) => {
    if (!user) {
      setActionError("You must be signed in.");
      return;
    }

    const draft = editDrafts[jobId];
    if (!draft) {
      setActionError("No edit draft found.");
      return;
    }

    const salaryValue = Number(draft.salary);
    if (!draft.jobTitle.trim()) {
      setActionError("Job title is required.");
      return;
    }

    if (!Number.isFinite(salaryValue) || salaryValue <= 0) {
      setActionError("Salary must be a valid positive number.");
      return;
    }

    try {
      setSavingJobId(jobId);
      setActionError(null);
      const token = await user.getIdToken();
      const payload = {
        jobTitle: draft.jobTitle.trim(),
        category: draft.category.trim(),
        department: draft.department.trim(),
        location: draft.location.trim(),
        salary: salaryValue,
        employmentType: draft.employmentType.trim(),
        shift: draft.shift.trim(),
        applicationDeadline: draft.applicationDeadline,
        expectedStartDate: draft.expectedStartDate,
        jobDescription: draft.jobDescription.trim(),
        description: draft.jobDescription.trim(),
        details: {
          type: draft.employmentType.trim(),
          shift: draft.shift.trim(),
          description: draft.jobDescription.trim(),
        },
      };

      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const bodyText = await response.text();
      const body = bodyText ? JSON.parse(bodyText) : null;

      if (!response.ok) {
        throw new Error(body?.error || "Failed to update job.");
      }

      const updatedJob = body as Job;
      setJobs((current) => current.map((job) => (job._id === jobId ? updatedJob : job)));
      setEditingJobId(null);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Failed to update job.");
    } finally {
      setSavingJobId(null);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!user) {
      setActionError("You must be signed in.");
      return;
    }

    setActionError(null);

    if (isAdmin) {
      const reason = window.prompt("Reason for removing this posting (required):");
      if (!reason?.trim()) return;
      try {
        setDeletingJobId(jobId);
        const token = await user.getIdToken();
        const response = await fetch(`/api/admin/jobs/${jobId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "Failed to delete job.");
        }
        setJobs((current) => current.filter((job) => job._id !== jobId));
        if (editingJobId === jobId) setEditingJobId(null);
      } catch (deleteError) {
        setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete job.");
      } finally {
        setDeletingJobId(null);
      }
      return;
    }

    const confirmed = window.confirm("Delete this job posting?");
    if (!confirmed) return;

    try {
      setDeletingJobId(jobId);
      const token = await user.getIdToken();
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const bodyText = await response.text();
        const body = bodyText ? JSON.parse(bodyText) : null;
        throw new Error(body?.error || "Failed to delete job.");
      }

      setJobs((current) => current.filter((job) => job._id !== jobId));
      setOwnerJobIds((current) => {
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
      if (editingJobId === jobId) setEditingJobId(null);
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Failed to delete job.");
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div className="page">
      <div className="text">
        <h1>Job Listings</h1>
        <p style={{ paddingBottom: "40px" }}>{jobs.length} position{jobs.length !== 1 ? "s" : ""} available</p>
      </div>

      {actionError && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "var(--neg-secondary)", fontWeight: 600 }}>{actionError}</p>
        </div>
      )}

      {loading && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>Loading jobs. Please wait...</p>
        </div>
      )}

      {!loading && error && (
        <div className="page-center">
          <p style={{ color: "var(--neg-secondary)", fontSize: "2.5rem", fontWeight: 500 }}>Error: {error}</p>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="page-center">
          <p style={{ color: "var(--button-mid)", fontSize: "2.5rem", fontWeight: 500 }}>No jobs found</p>
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="job-grid">
          {sortedJobs.map((job) => {
            const isOwner = ownerJobIds.has(job._id);
            const isEditing = editingJobId === job._id;

            return (
              <JobCard
                key={job._id}
                job={job}
                isOwner={isOwner}
                isAdmin={isAdmin}
                isJobSeeker={isJobSeeker}
                isFavorited={favoriteIds.has(job._id)}
                onToggleFavorite={() => toggleFavorite(job._id)}
                isEditing={isEditing}
                draft={editDrafts[job._id] ?? null}
                onDraftChange={(field, value) => updateDraft(job._id, field, value)}
                onStartEdit={() => startEdit(job)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => saveEdit(job._id)}
                onDelete={() => deleteJob(job._id)}
                saving={savingJobId === job._id}
                deleting={deletingJobId === job._id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DisplayAllJobs;
