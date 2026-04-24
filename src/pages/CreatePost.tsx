import { useState } from "react";
import type { FormEvent } from "react";
import NavbarComponent from "../components/Navbar";

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

  return (
    <section>
      <NavbarComponent />
      <h2>Create Job Posting</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "480px" }}>

        <input
          type="text"
          placeholder="Job Title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />

        {/* Pay */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="number"
            placeholder={pay === "hourly" ? "Hourly rate ($)" : "Annual salary ($)"}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <select value={pay} onChange={(e) => setPay(e.target.value as PayType)}>
            <option value="hourly">Hourly</option>
            <option value="salary">Salary</option>
          </select>
        </div>

        {/* Employment Type */}
        <div>
          <label>Employment Type</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            {TIME_TYPES.map((type) => (
              <label key={type}>
                <input
                  type="radio"
                  name="timeType"
                  value={type}
                  checked={timeType === type}
                  onChange={() => setTimeType(type)}
                />
                {" "}{type}
              </label>
            ))}
          </div>
        </div>

        {/* Shift */}
        <div>
          <label>Shift</label>
          <select value={shift} onChange={(e) => setShift(e.target.value as Shift)} style={{ display: "block", marginTop: "0.25rem" }}>
            {SHIFTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Benefits */}
        <div>
          <label>Benefits</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            {BENEFIT_OPTIONS.map((benefit) => (
              <label key={benefit}>
                <input
                  type="checkbox"
                  checked={benefits.includes(benefit)}
                  onChange={() => toggleBenefit(benefit)}
                />
                {" "}{benefit}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <textarea
          placeholder="Job description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          required
        />

        <button type="submit">Post Job</button>
      </form>
    </section>
  );
}

export default CreatePostPage;