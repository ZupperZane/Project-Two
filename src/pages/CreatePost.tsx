import { useState } from "react";
import type { FormEvent } from "react";
import NavbarComponent from "../components/Navbar";
import "../css/Page.css";

type PayType = "hourly" | "salary";
type TimeType = "full-time" | "part-time" | "contract" | "internship";
type Shift = "morning" | "afternoon" | "evening" | "overnight" | "flexible";

function CreatePostPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [salary, setSalary] = useState("");
  const [pay, setPay] = useState<PayType>("hourly");
  const [timeType, setTimeType] = useState<TimeType>("full-time");
  const [shift, setShift] = useState<Shift>("flexible");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const BENEFIT_OPTIONS = ["Health Insurance", "Dental", "Vision", "401k", "PTO", "Remote", "Bonuses"];
  const TIME_TYPES: TimeType[] = ["full-time", "part-time", "contract", "internship"];
  const SHIFTS: Shift[] = ["morning", "afternoon", "evening", "overnight", "flexible"];

  const toggleBenefit = (benefit: string) => {
    setBenefits((prev) =>
      prev.includes(benefit) ? prev.filter((b) => b !== benefit) : [...prev, benefit]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { name, company, salary, pay, timeType, shift, benefits, description };
    console.log("Submitting job post:", payload);
    // TODO: POST to /api/jobs
  };

  const toggleStyle = (active: boolean) => ({
    flex: 1,
    padding: "9px 14px",
    borderRadius: 9,
    border: `1.5px solid ${active ? "var(--button-mid)" : "var(--secondary2)"}`,
    background: active ? "var(--text-2)" : "var(--secondary2)", opacity: active ? 1: 0.6,
    color: "var(--text-1)",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  });

  return (
    <div className="page">
      <NavbarComponent />

      <div style={{ maxWidth: 800, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 0 }}>
        <div className="text" style={{ paddingBottom: 24 }}>
          <h1>Create Job Posting</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "var(--secondary1)", borderRadius: 16, padding: 36, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Job Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Job Title</label>
            <input
              type="text"
              placeholder="Job Title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {/* Company */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="form-label">Company Name</label>
            <input
              type="text"
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {/* Pay */}
          <div className="section-divider">
            <label className="form-label">Pay</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="number"
                placeholder={pay === "hourly" ? "Hourly rate ($)" : "Annual salary ($)"}
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
                className="form-input"
              />
              <select
                value={pay}
                onChange={(e) => setPay(e.target.value as PayType)}
                className="form-input"
                style={{ width: "auto", cursor: "pointer" }}
              >
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>

          {/* Employment Type */}
          <div className="section-divider">
            <label className="form-label">Employment Type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TIME_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTimeType(type)}
                  style={toggleStyle(timeType === type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Shift */}
          <div className="section-divider">
            <label className="form-label">Shift</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SHIFTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShift(s)}
                  style={toggleStyle(shift === s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="section-divider">
            <label className="form-label">Benefits</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BENEFIT_OPTIONS.map((benefit) => (
                <button
                  key={benefit}
                  type="button"
                  onClick={() => toggleBenefit(benefit)}
                  style={toggleStyle(benefits.includes(benefit))}
                >
                  {benefit}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="section-divider">
            <label className="form-label">Job Description</label>
            <textarea
              placeholder="Job Description goes here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              className="form-input"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <button type="submit" className="btn" style={{ color: "var(--text-2)", marginTop: 8 }}>
            Post Job
          </button>

        </form>
      </div>
    </div>
  );
}

export default CreatePostPage;