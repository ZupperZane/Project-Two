import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavbarComponent from "../components/Navbar";
import useAuth from "../hooks/useAuth";
import "../css/Page.css";

type PayType = "hourly" | "salary";
type TimeType = "full-time" | "part-time" | "contract" | "internship";
type Shift = "morning" | "afternoon" | "evening" | "overnight" | "flexible";
type InstitutionMode = "existing" | "new";

type Company = {
  _id: string;
  companyId: string;
  name: string;
  location: string;
};

async function readJsonSafely(response: Response) {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function CreatePostPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const [institutionMode, setInstitutionMode] = useState<InstitutionMode>("existing");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedInstitutionKey, setSelectedInstitutionKey] = useState("");

  const [newInstitutionName, setNewInstitutionName] = useState("");
  const [newInstitutionIndustry, setNewInstitutionIndustry] = useState("");
  const [newInstitutionLocation, setNewInstitutionLocation] = useState("");
  const [newInstitutionWebsite, setNewInstitutionWebsite] = useState("");
  const [newInstitutionDescription, setNewInstitutionDescription] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [pay, setPay] = useState<PayType>("hourly");
  const [timeType, setTimeType] = useState<TimeType>("full-time");
  const [shift, setShift] = useState<Shift>("flexible");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [qualificationsText, setQualificationsText] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BENEFIT_OPTIONS = ["Health Insurance", "Dental", "Vision", "401k", "PTO", "Remote", "Bonuses"];
  const TIME_TYPES: TimeType[] = ["full-time", "part-time", "contract", "internship"];
  const SHIFTS: Shift[] = ["morning", "afternoon", "evening", "overnight", "flexible"];

  useEffect(() => {
    fetch("/api/companies")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load institutions: HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data as Company[];
          setCompanies(mapped);
          if (mapped.length > 0) {
            setSelectedInstitutionKey(mapped[0].companyId || mapped[0]._id);
          }
        } else {
          setCompanies([]);
        }
        setLoadingCompanies(false);
      })
      .catch(() => {
        setCompanies([]);
        setLoadingCompanies(false);
      });
  }, []);

  const toggleBenefit = (benefit: string) => {
    setBenefits((prev) =>
      prev.includes(benefit) ? prev.filter((b) => b !== benefit) : [...prev, benefit]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in.");
      return;
    }

    if (role !== "employer") {
      setError("Only employers can create job listings.");
      return;
    }

    const numericSalary = Number(salary);
    if (!Number.isFinite(numericSalary) || numericSalary <= 0) {
      setError("Salary must be a valid number greater than 0.");
      return;
    }

    const normalizedType = timeType
      .split("-")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join("-");

    const normalizedShift = shift
      .split("-")
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(" ");

    const interval = pay === "hourly" ? "hour" : "year";
    const currency = "USD";
    const qualifications = qualificationsText
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => Boolean(item));

    let institutionName = "";
    let companyId = "";

    try {
      setSubmitting(true);
      const idToken = await user.getIdToken();

      if (institutionMode === "existing") {
        const selected = companies.find(
          (company) => (company.companyId || company._id) === selectedInstitutionKey
        );

        if (!selected) {
          throw new Error("Please select an institution.");
        }

        const selectResponse = await fetch("/api/employer/select-company", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyId: selected.companyId || selected._id,
            name: selected.name,
          }),
        });

        const selectedCompanyPayload = await readJsonSafely(selectResponse);
        if (!selectResponse.ok) {
          throw new Error(
            (selectedCompanyPayload as { error?: string } | null)?.error ||
              "Failed to select institution."
          );
        }

        institutionName =
          (selectedCompanyPayload as { name?: string } | null)?.name || selected.name;
        companyId =
          (selectedCompanyPayload as { companyId?: string } | null)?.companyId ||
          selected.companyId ||
          "";
      } else {
        if (!newInstitutionName.trim()) {
          throw new Error("Institution name is required when registering a new institution.");
        }

        const registerResponse = await fetch("/api/employer/company-profile", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newInstitutionName.trim(),
            industry: newInstitutionIndustry.trim(),
            location: newInstitutionLocation.trim(),
            website: newInstitutionWebsite.trim(),
            description: newInstitutionDescription.trim(),
          }),
        });

        const registeredCompanyPayload = await readJsonSafely(registerResponse);
        if (!registerResponse.ok) {
          throw new Error(
            (registeredCompanyPayload as { error?: string } | null)?.error ||
              "Failed to register institution."
          );
        }

        institutionName =
          (registeredCompanyPayload as { name?: string } | null)?.name || newInstitutionName.trim();
        companyId =
          (registeredCompanyPayload as { companyId?: string } | null)?.companyId || "";
      }

      const payload = {
        jobTitle: name.trim(),
        institutionName,
        companyId,
        category: category.trim(),
        department: department.trim(),
        location: jobLocation.trim(),
        salary: numericSalary,
        salaryRange: {
          min: numericSalary,
          max: numericSalary,
          currency,
          interval,
        },
        requiredQualifications: qualifications,
        applicationDeadline: applicationDeadline.trim(),
        expectedStartDate: expectedStartDate.trim(),
        recruiterId: recruiterId.trim(),
        employmentType: normalizedType,
        shift: normalizedShift,
        benefits,
        jobDescription: description.trim(),
        description: description.trim(),
        details: {
          pay: `${currency} ${numericSalary.toLocaleString()}/${interval}`,
          type: normalizedType,
          shift: normalizedShift,
          benefits,
          description: description.trim(),
        },
      };

      const response = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(
          (data as { error?: string } | null)?.error ||
            "Failed to publish job listing."
        );
      }

      const createdId = (data as { _id?: string; id?: string } | null)?._id ??
        (data as { _id?: string; id?: string } | null)?.id;

      if (createdId) {
        navigate(`/jobs/${createdId}`);
      } else {
        navigate("/jobs");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to publish job listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <NavbarComponent />
        <div className="page-center">
          <p className="muted-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <NavbarComponent />
        <div className="page-content narrow">
          <div className="content-panel">
            <h2>Create Job Posting</h2>
            <p className="muted-text">You need to sign in first.</p>
            <Link to="/login" className="btn">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (role !== "employer") {
    return (
      <div className="page">
        <NavbarComponent />
        <div className="page-content narrow">
          <div className="content-panel">
            <h2>Create Job Posting</h2>
            <p className="muted-text">Only employer accounts can create job listings.</p>
            <Link to="/dashboard" className="btn btn-quiet">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <NavbarComponent />
      <div className="page-content narrow">
        <div className="page-header">
          <div className="page-header-copy">
            <h1>Create Job Posting</h1>
            <p>Publish a role, connect it to an institution, and collect applicants from your dashboard.</p>
          </div>
          <div className="action-row">
            <Link to="/dashboard" className="btn btn-quiet">Dashboard</Link>
            <Link to="/jobs" className="btn btn-quiet">All Jobs</Link>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="content-panel form-grid">
        <div className="form-section">
          <div className="form-section-title">
            <h2>Institution</h2>
            <p className="muted-text">Choose an existing institution or register a new one.</p>
          </div>
          <div className="segmented-options">
          <label className={`choice-card ${institutionMode === "existing" ? "selected" : ""}`}>
            <input
              type="radio"
              name="institutionMode"
              checked={institutionMode === "existing"}
              onChange={() => setInstitutionMode("existing")}
            />
            Use existing institution
          </label>
          <label className={`choice-card ${institutionMode === "new" ? "selected" : ""}`}>
            <input
              type="radio"
              name="institutionMode"
              checked={institutionMode === "new"}
              onChange={() => setInstitutionMode("new")}
            />
            Register new institution
          </label>
          </div>
        </div>

        {institutionMode === "existing" ? (
          <div className="field">
            <label className="form-label">Institution</label>
            <select
              className="form-input"
              value={selectedInstitutionKey}
              onChange={(event) => setSelectedInstitutionKey(event.target.value)}
              disabled={loadingCompanies || companies.length === 0}
            >
              {loadingCompanies && <option>Loading institutions...</option>}
              {!loadingCompanies && companies.length === 0 && (
                <option value="">No institutions found. Register one below.</option>
              )}
              {!loadingCompanies &&
                companies.map((company) => {
                  const key = company.companyId || company._id;
                  return (
                    <option key={key} value={key}>
                      {company.name}
                      {company.location ? ` (${company.location})` : ""}
                    </option>
                  );
                })}
            </select>
          </div>
        ) : (
          <div className="form-section">
            <div className="field">
              <label className="form-label">Institution Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Institution Name"
              value={newInstitutionName}
              onChange={(event) => setNewInstitutionName(event.target.value)}
              required={institutionMode === "new"}
            />
            </div>
            <div className="field-row">
              <div className="field">
                <label className="form-label">Industry</label>
            <input
              className="form-input"
              type="text"
              placeholder="Institution Industry (optional)"
              value={newInstitutionIndustry}
              onChange={(event) => setNewInstitutionIndustry(event.target.value)}
            />
              </div>
              <div className="field">
                <label className="form-label">Location</label>
            <input
              className="form-input"
              type="text"
              placeholder="Institution Location (optional)"
              value={newInstitutionLocation}
              onChange={(event) => setNewInstitutionLocation(event.target.value)}
            />
              </div>
            </div>
            <div className="field">
              <label className="form-label">Website</label>
            <input
              className="form-input"
              type="url"
              placeholder="Institution Website (optional)"
              value={newInstitutionWebsite}
              onChange={(event) => setNewInstitutionWebsite(event.target.value)}
            />
            </div>
            <div className="field">
              <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Institution Description (optional)"
              value={newInstitutionDescription}
              onChange={(event) => setNewInstitutionDescription(event.target.value)}
              rows={3}
            />
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="form-section-title">
            <h2>Role Details</h2>
            <p className="muted-text">Add the core information applicants will scan first.</p>
          </div>
          <div className="field">
            <label className="form-label">Job Title</label>
        <input
          className="form-input"
          type="text"
          placeholder="Job Title"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="form-label">Category</label>
        <input
          className="form-input"
          type="text"
          placeholder="Category (e.g. Faculty)"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
            </div>

            <div className="field">
              <label className="form-label">Department</label>
        <input
          className="form-input"
          type="text"
          placeholder="Department (e.g. Computer Science)"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        />
            </div>
          </div>

          <div className="field">
            <label className="form-label">Location</label>
        <input
          className="form-input"
          type="text"
          placeholder="Job Location (e.g. Riverton, NY)"
          value={jobLocation}
          onChange={(event) => setJobLocation(event.target.value)}
        />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <h2>Compensation and Schedule</h2>
          </div>
          <div className="field-row">
          <div className="field">
            <label className="form-label">Pay</label>
          <input
            className="form-input"
            type="number"
            placeholder={pay === "hourly" ? "Hourly rate ($)" : "Annual salary ($)"}
            value={salary}
            onChange={(event) => setSalary(event.target.value)}
            required
          />
          </div>
          <div className="field">
            <label className="form-label">Pay Type</label>
          <select className="form-input" value={pay} onChange={(event) => setPay(event.target.value as PayType)}>
            <option value="hourly">Hourly</option>
            <option value="salary">Salary</option>
          </select>
          </div>
        </div>

        <div className="field">
          <label className="form-label">Employment Type</label>
          <div className="segmented-options">
            {TIME_TYPES.map((type) => (
              <label key={type} className={`checkbox-chip ${timeType === type ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="timeType"
                  value={type}
                  checked={timeType === type}
                  onChange={() => setTimeType(type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div className="field-row">
        <div className="field">
          <label className="form-label">Shift</label>
          <select className="form-input" value={shift} onChange={(event) => setShift(event.target.value as Shift)}>
            {SHIFTS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="form-label">Application Deadline</label>
          <input
            className="form-input"
            type="date"
            value={applicationDeadline}
            onChange={(event) => setApplicationDeadline(event.target.value)}
          />
        </div>
        </div>

        <div className="field-row">
        <div className="field">
          <label className="form-label">Expected Start Date</label>
          <input
            className="form-input"
            type="date"
            value={expectedStartDate}
            onChange={(event) => setExpectedStartDate(event.target.value)}
          />
        </div>

        <div className="field">
          <label className="form-label">Recruiter ID</label>
        <input
          className="form-input"
          type="text"
          placeholder="Recruiter ID (optional)"
          value={recruiterId}
          onChange={(event) => setRecruiterId(event.target.value)}
        />
        </div>
        </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <h2>Benefits and Description</h2>
          </div>
        <div className="field">
          <label className="form-label">Benefits</label>
          <div className="chip-options">
            {BENEFIT_OPTIONS.map((benefit) => (
              <label key={benefit} className={`checkbox-chip ${benefits.includes(benefit) ? "selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={benefits.includes(benefit)}
                  onChange={() => toggleBenefit(benefit)}
                />
                {benefit}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="form-label">Job Description</label>
        <textarea
          className="form-input"
          placeholder="Job description..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={5}
          required
        />
        </div>

        <div className="field">
          <label className="form-label">Required Qualifications</label>
        <textarea
          className="form-input"
          placeholder="Required qualifications (one per line)"
          value={qualificationsText}
          onChange={(event) => setQualificationsText(event.target.value)}
          rows={4}
        />
        </div>
        </div>

        <div className="action-row">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Publishing..." : "Post Job"}
        </button>
        <Link to="/dashboard" className="btn btn-quiet">Cancel</Link>
        </div>
        {error && <p style={{ color: "var(--neg-secondary)", fontWeight: 700 }}>{error}</p>}
      </form>
      </div>
    </div>
  );
}

export default CreatePostPage;
