import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, hasMongoConfig } from "./mongo.js";
import { ObjectId } from "mongodb";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    mongoConfigured: hasMongoConfig(),
  });
});

app.get("/api/messages", async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({
      error:
        "MongoDB is not configured. Add MONGODB_URI in your environment.",
    });
    return;
  }

  try {
    const db = await getDb();
    const messages = await db
      .collection("messages")
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    res.json(
      messages.map((message) => ({
        id: message._id.toString(),
        text: message.text,
        createdAt: message.createdAt,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

app.post("/api/messages", async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({
      error:
        "MongoDB is not configured. Add MONGODB_URI in your environment.",
    });
    return;
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (!text) {
    res.status(400).json({ error: "Message text is required." });
    return;
  }

  if (text.length > 500) {
    res
      .status(400)
      .json({ error: "Message text cannot exceed 500 characters." });
    return;
  }

  try {
    const db = await getDb();
    const createdAt = new Date().toISOString();
    const result = await db.collection("messages").insertOne({
      text,
      createdAt,
    });

    res.status(201).json({
      id: result.insertedId.toString(),
      text,
      createdAt,
    });
  } catch (error) {
    console.error("Failed to create message:", error);
    res.status(500).json({ error: "Failed to create message." });
  }
});

function mapCompanyDocument(company) {
  const jobs = Array.isArray(company.jobs) ? company.jobs : [];

  return {
    _id: company._id.toString(),
    id: company._id.toString(),
    companyId: company.companyId ?? "",
    name: company.name ?? "",
    slug: company.slug ?? "",
    industry: company.industry ?? "",
    institutionType: company.institutionType ?? "",
    location: company.location ?? "",
    website: company.website ?? "",
    description: company.description ?? "",
    salaryRange: company.salaryRange ?? null,
    benefitsOffered: Array.isArray(company.benefitsOffered)
      ? company.benefitsOffered
      : [],
    jobs,
    jobCount: Number.isFinite(company.jobCount) ? company.jobCount : jobs.length,
  };
}

function mapJobDocument(job) {
  const details =
    job.details && typeof job.details === "object" ? job.details : {};
  const description =
    typeof details.description === "string" && details.description.trim()
      ? details.description
      : typeof job.description === "string"
      ? job.description
      : "";

  return {
    _id: job._id.toString(),
    id: job._id.toString(),
    idCode: job.idCode ?? "",
    name: job.name ?? "",
    company: job.company ?? "",
    salary: Number.isFinite(job.salary) ? job.salary : null,
    details: {
      pay: details.pay ?? "",
      type: details.type ?? "",
      shift: details.shift ?? "",
      benefits: Array.isArray(details.benefits) ? details.benefits : [],
      description,
    },
    description,
  };
}

app.get("/api/companies", async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({ error: "MongoDB is not configured." });
    return;
  }

  try {
    const db = await getDb();
    const companies = await db
      .collection("companies")
      .find({})
      .sort({ name: 1 })
      .toArray();

    res.json(companies.map(mapCompanyDocument));
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    res.status(500).json({ error: "Failed to fetch companies." });
  }
});

app.get("/api/companies/:id", async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({ error: "MongoDB is not configured." });
    return;
  }

  const identifier = String(req.params.id || "").trim();
  if (!identifier) {
    res.status(400).json({ error: "Company identifier is required." });
    return;
  }

  try {
    const db = await getDb();
    const companiesCollection = db.collection("companies");

    let company = null;

    if (ObjectId.isValid(identifier)) {
      company = await companiesCollection.findOne({ _id: new ObjectId(identifier) });
    }

    if (!company) {
      company = await companiesCollection.findOne({ slug: identifier });
    }

    if (!company) {
      company = await companiesCollection.findOne({
        companyId: { $regex: `^${identifier}$`, $options: "i" },
      });
    }

    if (!company) {
      res.status(404).json({ error: "Company not found." });
      return;
    }

    const companyJobs = Array.isArray(company.jobs) ? company.jobs : [];
    let jobs = [];

    if (companyJobs.length > 0) {
      jobs = await db
        .collection("jobs")
        .find({ idCode: { $in: companyJobs } })
        .toArray();

      const ordered = new Map(jobs.map((job) => [job.idCode, job]));
      jobs = companyJobs
        .map((jobCode) => ordered.get(jobCode))
        .filter((job) => Boolean(job));
    } else if (typeof company.name === "string" && company.name.trim()) {
      jobs = await db.collection("jobs").find({ company: company.name }).toArray();
    }

    res.json({
      company: mapCompanyDocument(company),
      jobs: jobs.map(mapJobDocument),
    });
  } catch (error) {
    console.error("Failed to fetch company detail:", error);
    res.status(500).json({ error: "Failed to fetch company detail." });
  }
});
//Get All jobs
app.get("/api/jobs", async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({ error: "MongoDB is not configured." });
    return;
  }

  try {
    const db = await getDb();
    const jobs = await db.collection("jobs").find({}).toArray();
    res.json(jobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});
//Get Job by ID
app.get("/api/jobs/:id", async (req, res) => {
  if (!hasMongoConfig()) {
    return res.status(503).json({ error: "MongoDB is not configured." });
  }

  try {
    const db = await getDb();

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid job id" });
    }

    const job = await db.collection("jobs").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json({ ...job, id: job._id.toString(), _id: undefined });
  } catch (err) {
    console.error("Failed to fetch job:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// creates a jobseeker or job_poster document in MongoDB after Firebase signup
// _id is the Firebase UID so we can look them up by UID later
app.post("/api/users", async (req, res) => {
  const { uid, role, email } = req.body;

  if (!uid || !role || !["jobseeker", "job_poster"].includes(role)) {
    return res.status(400).json({ error: "uid and valid role are required." });
  }

  if (!hasMongoConfig()) {
    return res.status(503).json({ error: "MongoDB is not configured." });
  }

  try {
    const db = await getDb();
    const collection = role === "jobseeker" ? "jobseekers" : "job_posters";
    const doc = role === "jobseeker"
      ? { _id: uid, email, resume: null, appliedJobs: [] }
      : { _id: uid, email, listedJobs: [] };

    await db.collection(collection).insertOne(doc);
    res.status(201).json({ uid, role });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "User already exists." }); // duplicate signup
    }
    console.error("Failed to create user:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
});

// fetches a user's profile and role by Firebase UID
// checks jobseekers first, then job_posters — returns 404 if neither found
app.get("/api/users/:uid", async (req, res) => {
  const { uid } = req.params;

  if (!hasMongoConfig()) {
    return res.status(503).json({ error: "MongoDB is not configured." });
  }

  try {
    const db = await getDb();
    const jobseeker = await db.collection("jobseekers").findOne({ _id: uid });
    if (jobseeker) return res.json({ ...jobseeker, role: "jobseeker" });

    const jobPoster = await db.collection("job_posters").findOne({ _id: uid });
    if (jobPoster) return res.json({ ...jobPoster, role: "job_poster" });

    res.status(404).json({ error: "User not found." });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    res.status(500).json({ error: "Failed to fetch user." });
  }
});

// deletes the user's document from whichever collection they're in, if MongoDB is available
app.delete("/api/users/:uid", async (req, res) => {
  const { uid } = req.params;

  if (!hasMongoConfig()) {
    return res.status(503).json({ error: "MongoDB is not configured." });
  }

  try {
    const db = await getDb();
    const seekerResult = await db.collection("jobseekers").deleteOne({ _id: uid });
    if (seekerResult.deletedCount > 0) return res.json({ deleted: true });

    const posterResult = await db.collection("job_posters").deleteOne({ _id: uid });
    if (posterResult.deletedCount > 0) return res.json({ deleted: true });

    res.status(404).json({ error: "User not found." });
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
