import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, hasMongoConfig } from "./mongo.js";
import { ObjectId, GridFSBucket } from "mongodb";
import multer from "multer";
import {
  getFirebaseAdminAuth,
  getFirebaseAdminInitError,
  hasFirebaseAdmin,
} from "./firebaseAdmin.js";

// Resume uploads held in memory before streaming to GridFS; 5MB cap
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
    firebaseAdminConfigured: hasFirebaseAdmin(),
    firebaseAdminError: hasFirebaseAdmin() ? null : getFirebaseAdminInitError(),
  });
});


function mapCompanyDocument(company) {
  const rawJobIds = Array.isArray(company.jobIds)
    ? company.jobIds
    : Array.isArray(company.jobs)
      ? company.jobs
      : [];
  const jobIds = rawJobIds
    .filter((jobId) => typeof jobId === "string" && jobId.trim())
    .map((jobId) => jobId.trim());
  const salaryRangeSummary =
    company.salaryRangeSummary &&
    typeof company.salaryRangeSummary === "object" &&
    !Array.isArray(company.salaryRangeSummary)
      ? company.salaryRangeSummary
      : company.salaryRange &&
          typeof company.salaryRange === "object" &&
          !Array.isArray(company.salaryRange)
        ? company.salaryRange
        : null;

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
    salaryRangeSummary,
    salaryRange: salaryRangeSummary,
    benefitsOffered: Array.isArray(company.benefitsOffered)
      ? company.benefitsOffered
      : [],
    categoriesHiringFor: Array.isArray(company.categoriesHiringFor)
      ? company.categoriesHiringFor
      : [],
    departmentsHiringFor: Array.isArray(company.departmentsHiringFor)
      ? company.departmentsHiringFor
      : [],
    recruiterIds: Array.isArray(company.recruiterIds) ? company.recruiterIds : [],
    intervalsPresent: Array.isArray(company.intervalsPresent)
      ? company.intervalsPresent
      : Array.isArray(salaryRangeSummary?.intervalsPresent)
        ? salaryRangeSummary.intervalsPresent
        : [],
    jobIds,
    jobs: jobIds,
    jobCount: Number.isFinite(company.jobCount) ? company.jobCount : jobIds.length,
  };
}

function mapJobDocument(job) {
  const details =
    job.details && typeof job.details === "object" ? job.details : {};
  const salaryRange =
    job.salaryRange && typeof job.salaryRange === "object" && !Array.isArray(job.salaryRange)
      ? job.salaryRange
      : null;
  const description =
    typeof details.description === "string" && details.description.trim()
      ? details.description
      : typeof job.jobDescription === "string"
        ? job.jobDescription
      : typeof job.description === "string"
        ? job.description
        : "";
  const benefits =
    Array.isArray(details.benefits) && details.benefits.length > 0
      ? details.benefits
      : Array.isArray(job.benefits)
        ? job.benefits
        : [];
  const employmentType =
    details.type ||
    (typeof job.employmentType === "string" ? job.employmentType : "");
  const shift = details.shift || (typeof job.shift === "string" ? job.shift : "");
  const salary =
    Number.isFinite(job.salary)
      ? job.salary
      : Number.isFinite(salaryRange?.min)
        ? Number(salaryRange.min)
        : null;
  const pay =
    details.pay ||
    (salaryRange && Number.isFinite(salaryRange.min) && Number.isFinite(salaryRange.max)
      ? `$${Number(salaryRange.min).toLocaleString()}-$${Number(
          salaryRange.max
        ).toLocaleString()}/${salaryRange.interval || "year"}`
      : "");
  const name = job.name ?? job.jobTitle ?? "";
  const company = job.company ?? job.institutionName ?? "";

  return {
    _id: job._id.toString(),
    id: job._id.toString(),
    idCode: job.idCode ?? "",
    name,
    jobTitle: job.jobTitle ?? name,
    company,
    institutionName: job.institutionName ?? company,
    companyId: job.companyId ?? "",
    category: job.category ?? "",
    department: job.department ?? "",
    location: job.location ?? "",
    salaryRange: salaryRange ?? null,
    salary,
    jobDescription: job.jobDescription ?? description,
    requiredQualifications: Array.isArray(job.requiredQualifications)
      ? job.requiredQualifications
      : [],
    applicationDeadline: job.applicationDeadline ?? "",
    expectedStartDate: job.expectedStartDate ?? "",
    recruiterId: job.recruiterId ?? "",
    employmentType: job.employmentType ?? employmentType,
    shift: job.shift ?? shift,
    benefits,
    details: {
      pay,
      type: employmentType,
      shift,
      benefits,
      description,
    },
    description,
  };
}

// All valid roles; used for access control and profile collection routing
const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYER: "employer",
  JOB_SEEKER: "job_seeker",
};

function normalizeRole(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (
    normalized === USER_ROLES.ADMIN ||
    normalized === USER_ROLES.EMPLOYER ||
    normalized === USER_ROLES.JOB_SEEKER
  ) {
    return normalized;
  }

  return null;
}

function getProfileCollectionName(role) {
  if (role === USER_ROLES.ADMIN) return "admin_profiles";
  if (role === USER_ROLES.EMPLOYER) return "employer_profiles";
  if (role === USER_ROLES.JOB_SEEKER) return "job_seeker_profiles";
  return null;
}

function getNow() {
  return new Date().toISOString();
}

function toSafeString(value, maxLength = 1000) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSafeStringArray(value, maxItems = 100, maxLength = 200) {
  if (!Array.isArray(value)) return null;
  return Array.from(
    new Set(
      value
        .map((entry) => toSafeString(entry, maxLength))
        .filter((entry) => Boolean(entry))
    )
  ).slice(0, maxItems);
}

function slugify(value) {
  if (typeof value !== "string") return "";

  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeOptionalProfile(value, depth = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const output = {};
  const entries = Object.entries(value).slice(0, 30);

  for (const [rawKey, rawValue] of entries) {
    if (typeof rawKey !== "string" || !rawKey.trim()) {
      continue;
    }

    const key = rawKey.trim().slice(0, 80);

    if (typeof rawValue === "string") {
      const normalized = toSafeString(rawValue, 500);
      if (normalized !== null) {
        output[key] = normalized;
      }
      continue;
    }

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      output[key] = rawValue;
      continue;
    }

    if (typeof rawValue === "boolean") {
      output[key] = rawValue;
      continue;
    }

    if (Array.isArray(rawValue)) {
      const normalizedArray = rawValue
        .slice(0, 30)
        .map((entry) => {
          if (typeof entry === "string") {
            return toSafeString(entry, 200);
          }
          if (typeof entry === "number" && Number.isFinite(entry)) {
            return entry;
          }
          if (typeof entry === "boolean") {
            return entry;
          }
          return null;
        })
        .filter((entry) => entry !== null);

      if (normalizedArray.length > 0) {
        output[key] = normalizedArray;
      }
      continue;
    }

    if (depth < 1) {
      const nested = sanitizeOptionalProfile(rawValue, depth + 1);
      if (nested) {
        output[key] = nested;
      }
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

function getNameFromAuthUser(authUser) {
  return (
    toSafeString(authUser?.name, 120) ||
    toSafeString(authUser?.displayName, 120) ||
    ""
  );
}

function getPublicUser(user) {
  return {
    uid: user._id,
    name: user.name ?? "",
    email: user.email ?? "",
    role: normalizeRole(user.role),
    profile: sanitizeOptionalProfile(user.profile) ?? {},
    status: user.status ?? "active",
    disabledReason: user.disabledReason ?? null,
    disabledBy: user.disabledBy ?? null,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

function parseAllowedSetFromEnv(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => Boolean(entry))
  );
}

// Populated from .env — comma-separated emails/UIDs allowed to self-bootstrap as admin
const adminEmailAllowlist = parseAllowedSetFromEnv(process.env.ADMIN_EMAILS);
const adminUidAllowlist = parseAllowedSetFromEnv(process.env.ADMIN_UIDS);

function canSelfAssignAdmin(decodedToken) {
  const email = (decodedToken.email || "").toLowerCase();
  return adminUidAllowlist.has(decodedToken.uid) || adminEmailAllowlist.has(email);
}

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

// Verifies Firebase ID token and attaches decoded token to req.authUser
async function authenticateRequest(req, res, next) {
  if (!hasFirebaseAdmin()) {
    res.status(503).json({
      error: "Firebase Admin is not configured on the server.",
      details: getFirebaseAdminInitError(),
    });
    return;
  }

  const idToken = extractBearerToken(req.headers.authorization);
  if (!idToken) {
    res.status(401).json({ error: "Missing Bearer token." });
    return;
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
    req.authUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Invalid or expired Firebase token.",
      details: error instanceof Error ? error.message : "Unknown auth error.",
    });
  }
}

// Fetches MongoDB user doc and attaches to req.currentUser; also syncs name/email from Firebase if missing
async function loadCurrentUser(req, res, next) {
  if (!hasMongoConfig()) {
    res.status(503).json({ error: "MongoDB is not configured." });
    return;
  }

  try {
    const db = await getDb();
    const uid = req.authUser.uid;

    let user = await db.collection("users").findOne({ _id: uid });

    if (!user) {
      res.status(404).json({ error: "User profile not found. Run bootstrap first." });
      return;
    }

    const authName = getNameFromAuthUser(req.authUser);
    const authEmail = req.authUser.email ?? "";
    const syncUpdates = {};

    if (!user.name && authName) {
      syncUpdates.name = authName;
    }

    if (!user.email && authEmail) {
      syncUpdates.email = authEmail;
    }

    if (!user.profile || typeof user.profile !== "object" || Array.isArray(user.profile)) {
      syncUpdates.profile = {};
    }

    if (Object.keys(syncUpdates).length > 0) {
      syncUpdates.updatedAt = getNow();
      await db.collection("users").updateOne({ _id: uid }, { $set: syncUpdates });
      user = { ...user, ...syncUpdates };
    }

    req.currentUser = user;
    req.db = db;
    next();
  } catch (error) {
    console.error("Failed to load current user:", error);
    res.status(500).json({ error: "Failed to load current user." });
  }
}

// Middleware — restricts route to given roles; also blocks disabled accounts
function requireRoles(...roles) {
  return (req, res, next) => {
    const role = normalizeRole(req.currentUser?.role);
    if (!role || !roles.includes(role)) {
      res.status(403).json({ error: "Forbidden for this role." });
      return;
    }

    if (req.currentUser?.status === "disabled") {
      res.status(403).json({
        error: "Account is disabled.",
        reason: req.currentUser.disabledReason ?? "Disabled by admin.",
      });
      return;
    }

    next();
  };
}

// Creates the role-specific profile doc if it doesn't exist yet (upsert with defaults)
async function ensureProfileDocument(db, uid, role) {
  const now = getNow();
  const collection = getProfileCollectionName(role);

  if (!collection) {
    return null;
  }

  const defaultProfile =
    role === USER_ROLES.JOB_SEEKER
      ? {
          _id: uid,
          userId: uid,
          fullName: "",
          headline: "",
          location: "",
          resumeUrl: "",
          skills: [],
          appliedJobIds: [],
          createdAt: now,
          updatedAt: now,
        }
      : role === USER_ROLES.EMPLOYER
      ? {
          _id: uid,
          userId: uid,
          companyId: "",
          companyName: "",
          companySlug: "",
          companyDescription: "",
          industry: "",
          location: "",
          website: "",
          createdAt: now,
          updatedAt: now,
        }
      : {
          _id: uid,
          userId: uid,
          scopes: ["*"],
          notes: "",
          createdAt: now,
          updatedAt: now,
        };

  await db.collection(collection).updateOne(
    { _id: uid },
    { $setOnInsert: defaultProfile },
    { upsert: true }
  );

  return db.collection(collection).findOne({ _id: uid });
}

function buildProfilePatch(role, inputProfile) {
  const updates = {};
  const profile =
    inputProfile && typeof inputProfile === "object" && !Array.isArray(inputProfile)
      ? inputProfile
      : null;

  if (!profile) {
    return { error: "profile object is required." };
  }

  if (role === USER_ROLES.JOB_SEEKER) {
    const fullName = toSafeString(profile.fullName, 120);
    const headline = toSafeString(profile.headline, 200);
    const location = toSafeString(profile.location, 120);
    const resumeUrl = toSafeString(profile.resumeUrl, 500);
    const skills = toSafeStringArray(profile.skills, 50, 60);

    if ("fullName" in profile && fullName === null) return { error: "Invalid fullName." };
    if ("headline" in profile && headline === null) return { error: "Invalid headline." };
    if ("location" in profile && location === null) return { error: "Invalid location." };
    if ("resumeUrl" in profile && resumeUrl === null) return { error: "Invalid resumeUrl." };
    if ("skills" in profile && skills === null) return { error: "Invalid skills array." };

    if (fullName !== null) updates.fullName = fullName;
    if (headline !== null) updates.headline = headline;
    if (location !== null) updates.location = location;
    if (resumeUrl !== null) updates.resumeUrl = resumeUrl;
    if (skills !== null) updates.skills = skills;
  }

  if (role === USER_ROLES.EMPLOYER) {
    const companyId = toSafeString(profile.companyId, 60);
    const companyName = toSafeString(profile.companyName, 120);
    const companyDescription = toSafeString(profile.companyDescription, 4000);
    const industry = toSafeString(profile.industry, 120);
    const location = toSafeString(profile.location, 120);
    const website = toSafeString(profile.website, 300);

    if ("companyId" in profile && companyId === null) return { error: "Invalid companyId." };
    if ("companyName" in profile && companyName === null) return { error: "Invalid companyName." };
    if ("companyDescription" in profile && companyDescription === null)
      return { error: "Invalid companyDescription." };
    if ("industry" in profile && industry === null) return { error: "Invalid industry." };
    if ("location" in profile && location === null) return { error: "Invalid location." };
    if ("website" in profile && website === null) return { error: "Invalid website." };

    if (companyId !== null) updates.companyId = companyId;
    if (companyName !== null) {
      updates.companyName = companyName;
      updates.companySlug = slugify(companyName);
    }
    if (companyDescription !== null) updates.companyDescription = companyDescription;
    if (industry !== null) updates.industry = industry;
    if (location !== null) updates.location = location;
    if (website !== null) updates.website = website;
  }

  if (role === USER_ROLES.ADMIN) {
    const notes = toSafeString(profile.notes, 1000);
    if ("notes" in profile && notes === null) return { error: "Invalid admin notes." };
    if (notes !== null) updates.notes = notes;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No valid profile fields provided." };
  }

  return { updates };
}

// Accepts multipart resume upload, stores in GridFS, saves fileId to job_seeker_profiles
app.post(
  "/api/job-seeker/resume",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  upload.single("resume"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(req.file.mimetype)) {
      res.status(400).json({ error: "Only PDF, DOC, and DOCX files are allowed." });
      return;
    }

    try {
      const db = await getDb();
      const bucket = new GridFSBucket(db, { bucketName: "resumes" });

      const existing = await db.collection("resumes.files")
        .findOne({ "metadata.uid": req.authUser.uid });
      if (existing) {
        await bucket.delete(existing._id);
      }

      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { uid: req.authUser.uid },
      });

      uploadStream.end(req.file.buffer);

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      const fileId = uploadStream.id.toString();

      await db.collection("job_seeker_profiles").updateOne(
        { _id: req.authUser.uid },
        { $set: { resumeFileId: fileId, updatedAt: getNow() } },
        { upsert: true }
      );

      res.status(201).json({ fileId });
    } catch (error) {
      console.error("Failed to upload resume:", error);
      res.status(500).json({ error: "Failed to upload resume." });
    }
  }
);

// Streams resume binary from GridFS; unauthed route — fileId (ObjectId) is the access control
app.get("/api/resume/:fileId", async (req, res) => {
  if (!ObjectId.isValid(req.params.fileId)) {
    res.status(400).json({ error: "Invalid file ID." });
    return;
  }

  try {
    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "resumes" });
    const fileId = new ObjectId(req.params.fileId);

    const files = await db.collection("resumes.files").find({ _id: fileId }).toArray();
    if (!files.length) {
      res.status(404).json({ error: "Resume not found." });
      return;
    }

    res.set("Content-Type", files[0].contentType ?? "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename="${files[0].filename}"`);
    bucket.openDownloadStream(fileId).pipe(res);
  } catch (error) {
    console.error("Failed to download resume:", error);
    res.status(500).json({ error: "Failed to download resume." });
  }
});


app.get("/api/companies", async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({ error: "MongoDB is not configured." });
    return;
  }

  try {
    const db = await getDb();
    const andFilters = [];
    const query = req.query;

    if (typeof query.search === "string" && query.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(query.search.trim()), "i");
      andFilters.push({
        $or: [
          { name: { $regex: searchRegex } },
          { slug: { $regex: searchRegex } },
          { companyId: { $regex: searchRegex } },
          { industry: { $regex: searchRegex } },
          { location: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
        ],
      });
    }

    if (typeof query.industry === "string" && query.industry.trim()) {
      const industryRegex = new RegExp(`^${escapeRegex(query.industry.trim())}$`, "i");
      andFilters.push({ industry: { $regex: industryRegex } });
    }

    if (typeof query.location === "string" && query.location.trim()) {
      const locationRegex = new RegExp(escapeRegex(query.location.trim()), "i");
      andFilters.push({ location: { $regex: locationRegex } });
    }

    const filter = andFilters.length > 0 ? { $and: andFilters } : {};
    
    console.log("search query:", req.query.search);
    console.log("filter:", JSON.stringify(filter));

    
    const companies = await db
      .collection("companies")
      .find(filter)
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

    const companyJobs = Array.isArray(company.jobIds)
      ? company.jobIds
      : Array.isArray(company.jobs)
        ? company.jobs
        : [];
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
    } else if (typeof company.companyId === "string" && company.companyId.trim()) {
      jobs = await db
        .collection("jobs")
        .find({ companyId: company.companyId.trim() })
        .toArray();
    } else if (typeof company.name === "string" && company.name.trim()) {
      jobs = await db
        .collection("jobs")
        .find({
          $or: [{ company: company.name }, { institutionName: company.name }],
        })
        .toArray();
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
    const andFilters = [];
    const query = req.query;

    if (typeof query.search === "string" && query.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(query.search.trim()), "i");
      andFilters.push({
        $or: [
          { name: { $regex: searchRegex } },
          { jobTitle: { $regex: searchRegex } },
          { company: { $regex: searchRegex } },
          { institutionName: { $regex: searchRegex } },
          { companyId: { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
          { department: { $regex: searchRegex } },
          { location: { $regex: searchRegex } },
          { idCode: { $regex: searchRegex } },
          { "details.description": { $regex: searchRegex } },
          { jobDescription: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
        ],
      });
    }

    if (typeof query.type === "string" && query.type.trim()) {
      const typeRegex = new RegExp(`^${escapeRegex(query.type.trim())}$`, "i");
      andFilters.push({
        $or: [{ "details.type": { $regex: typeRegex } }, { employmentType: { $regex: typeRegex } }],
      });
    }

    if (typeof query.company === "string" && query.company.trim()) {
      const companyRegex = new RegExp(escapeRegex(query.company.trim()), "i");
      andFilters.push({
        $or: [
          { company: { $regex: companyRegex } },
          { institutionName: { $regex: companyRegex } },
          { companyId: { $regex: companyRegex } },
        ],
      });
    }

    if (query.minSalary !== undefined || query.maxSalary !== undefined) {
      const salary = {};
      const salaryRangeMin = {};

      if (query.minSalary !== undefined) {
        const minSalary = Number(query.minSalary);
        if (Number.isFinite(minSalary)) {
          salary.$gte = minSalary;
          salaryRangeMin.$gte = minSalary;
        }
      }

      if (query.maxSalary !== undefined) {
        const maxSalary = Number(query.maxSalary);
        if (Number.isFinite(maxSalary)) {
          salary.$lte = maxSalary;
          salaryRangeMin.$lte = maxSalary;
        }
      }

      if (Object.keys(salary).length > 0 || Object.keys(salaryRangeMin).length > 0) {
        const salaryOr = [];
        if (Object.keys(salary).length > 0) {
          salaryOr.push({ salary });
        }
        if (Object.keys(salaryRangeMin).length > 0) {
          salaryOr.push({ "salaryRange.min": salaryRangeMin });
        }
        andFilters.push({ $or: salaryOr });
      }
    }

    const filter = andFilters.length > 0 ? { $and: andFilters } : {};
    const jobs = await db.collection("jobs").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(jobs.map(mapJobDocument));
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

    res.json(mapJobDocument(job));
  } catch (err) {
    console.error("Failed to fetch job:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Creates the user doc + role-specific profile on first sign-in; safe to call again (upsert)
app.post("/api/users/bootstrap", authenticateRequest, async (req, res) => {
  if (!hasMongoConfig()) {
    res.status(503).json({ error: "MongoDB is not configured." });
    return;
  }

  try {
    const db = await getDb();
    const uid = req.authUser.uid;
    const email = req.authUser.email ?? "";
    const nameFromAuth = getNameFromAuthUser(req.authUser);
    const requestedName = toSafeString(req.body?.name, 120);
    const requestedProfile = sanitizeOptionalProfile(
      req.body?.profile ?? req.body?.optionalProfile
    );

    const requestedRole =
      normalizeRole(req.body?.role) ?? USER_ROLES.JOB_SEEKER;

    if (requestedRole === USER_ROLES.ADMIN && !canSelfAssignAdmin(req.authUser)) {
      res.status(403).json({
        error:
          "Admin role cannot be self-assigned. Configure ADMIN_EMAILS/ADMIN_UIDS for approved admin bootstrap.",
      });
      return;
    }

    const now = getNow();
    const existingUser = await db.collection("users").findOne({ _id: uid });
    const existingRole = normalizeRole(existingUser?.role);
    const finalRole = existingRole ?? requestedRole;

    await db.collection("users").updateOne(
      { _id: uid },
      {
        $set: {
          name: requestedName ?? existingUser?.name ?? nameFromAuth,
          email,
          role: finalRole,
          profile: requestedProfile ?? existingUser?.profile ?? {},
          status: existingUser?.status ?? "active",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    const user = await db.collection("users").findOne({ _id: uid });
    const profile = await ensureProfileDocument(db, uid, finalRole);

    res.status(existingUser ? 200 : 201).json({
      user: getPublicUser(user),
      profile,
      roleSource: existingRole ? "existing" : "requested",
    });
  } catch (error) {
    console.error("Failed to bootstrap user:", error);
    res.status(500).json({ error: "Failed to bootstrap user." });
  }
});

app.get("/api/users/me", authenticateRequest, loadCurrentUser, async (req, res) => {
  try {
    const role = normalizeRole(req.currentUser.role);
    const profileCollection = getProfileCollectionName(role);
    const profile = profileCollection
      ? await req.db.collection(profileCollection).findOne({ _id: req.authUser.uid })
      : null;

    res.json({
      user: getPublicUser(req.currentUser),
      profile,
    });
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    res.status(500).json({ error: "Failed to fetch current user." });
  }
});

app.patch("/api/users/me", authenticateRequest, loadCurrentUser, async (req, res) => {
  try {
    const role = normalizeRole(req.currentUser.role);
    const profileCollection = getProfileCollectionName(role);
    if (!profileCollection) {
      res.status(400).json({ error: "Unknown user role." });
      return;
    }

    const userUpdates = {};

    if ("name" in (req.body ?? {})) {
      const normalizedName = toSafeString(req.body?.name, 120);
      if (normalizedName === null) {
        res.status(400).json({ error: "Invalid name." });
        return;
      }
      userUpdates.name = normalizedName;
    }

    if ("profile" in (req.body ?? {})) {
      const optionalProfile = sanitizeOptionalProfile(req.body?.profile);
      if (optionalProfile === null) {
        res.status(400).json({ error: "Invalid optional profile payload." });
        return;
      }
      userUpdates.profile = optionalProfile;
    }

    const patch = buildProfilePatch(role, req.body?.roleProfile ?? req.body?.profile ?? req.body);
    if (patch.error && patch.error !== "No valid profile fields provided.") {
      res.status(400).json({ error: patch.error });
      return;
    }

    if (Object.keys(userUpdates).length === 0 && patch.error) {
      res.status(400).json({ error: "No valid user updates provided." });
      return;
    }

    if (Object.keys(userUpdates).length > 0) {
      await req.db.collection("users").updateOne(
        { _id: req.authUser.uid },
        { $set: { ...userUpdates, updatedAt: getNow() } }
      );
      req.currentUser = {
        ...req.currentUser,
        ...userUpdates,
        updatedAt: getNow(),
      };
    }

    if (!patch.error) {
      await req.db.collection(profileCollection).updateOne(
        { _id: req.authUser.uid },
        {
          $set: {
            ...patch.updates,
            updatedAt: getNow(),
          },
          $setOnInsert: {
            _id: req.authUser.uid,
            userId: req.authUser.uid,
            createdAt: getNow(),
          },
        },
        { upsert: true }
      );
    }

    const updatedProfile = await req.db
      .collection(profileCollection)
      .findOne({ _id: req.authUser.uid });

    res.json({
      user: getPublicUser(req.currentUser),
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Failed to update current user profile:", error);
    res.status(500).json({ error: "Failed to update current user profile." });
  }
});

app.delete(
  "/api/users/me",
  authenticateRequest,
  loadCurrentUser,
  async (req, res) => {
    try {
      const uid = req.authUser.uid;

      await req.db.collection("users").deleteOne({ _id: uid });
      await req.db.collection("job_seeker_profiles").deleteOne({ _id: uid });
      await req.db.collection("employer_profiles").deleteOne({ _id: uid });
      await req.db.collection("admin_profiles").deleteOne({ _id: uid });
      await req.db
        .collection("applications")
        .deleteMany({ $or: [{ jobSeekerUid: uid }, { applicantId: uid }] });

      res.json({ deleted: true });
    } catch (error) {
      console.error("Failed to delete account data:", error);
      res.status(500).json({ error: "Failed to delete account data." });
    }
  }
);

app.get(
  "/api/admin/users",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const users = await req.db
        .collection("users")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      res.json(users.map(getPublicUser));
    } catch (error) {
      console.error("Failed to fetch users for admin:", error);
      res.status(500).json({ error: "Failed to fetch users." });
    }
  }
);

app.get(
  "/api/admin/jobs",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const jobs = await req.db.collection("jobs").find({}).sort({ createdAt: -1 }).toArray();
      res.json(jobs.map(mapJobDocument));
    } catch (error) {
      console.error("Failed to fetch jobs for admin:", error);
      res.status(500).json({ error: "Failed to fetch jobs." });
    }
  }
);

app.delete(
  "/api/admin/jobs/:id",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN),
  async (req, res) => {
    const reason = toSafeString(req.body?.reason, 500);
    const messageToUser = toSafeString(req.body?.messageToUser, 1000);

    if (!reason) {
      res.status(400).json({ error: "reason is required when deleting a job." });
      return;
    }

    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    try {
      const jobId = new ObjectId(req.params.id);
      const job = await req.db.collection("jobs").findOne({ _id: jobId });
      if (!job) {
        res.status(404).json({ error: "Job not found." });
        return;
      }

      await req.db.collection("jobs").deleteOne({ _id: jobId });
      await req.db.collection("applications").deleteMany({ jobId: req.params.id });
      await req.db
        .collection("companies")
        .updateMany(
          { $or: [{ jobs: job.idCode }, { jobIds: job.idCode }] },
          {
            $pull: { jobs: job.idCode, jobIds: job.idCode },
            $set: { updatedAt: getNow() },
            $inc: { jobCount: -1 },
          }
        );

      const employerUser = job.employerUid
        ? await req.db.collection("users").findOne({ _id: job.employerUid }, { projection: { email: 1 } })
        : null;

      await req.db.collection("moderation_logs").insertOne({
        action: "delete_job",
        targetType: "job",
        targetId: req.params.id,
        targetUid: job.employerUid ?? null,
        targetEmail: employerUser?.email ?? "",
        performedByUid: req.authUser.uid,
        performedByEmail: req.currentUser?.email ?? req.authUser.email ?? "",
        reason,
        messageToUser: messageToUser ?? "",
        createdAt: getNow(),
      });

      res.json({ deleted: true });
    } catch (error) {
      console.error("Failed to delete job as admin:", error);
      res.status(500).json({ error: "Failed to delete job." });
    }
  }
);

app.patch(
  "/api/admin/users/:uid/status",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN),
  async (req, res) => {
    const targetUid = String(req.params.uid || "").trim();
    const action = toSafeString(req.body?.action, 30);
    const reason = toSafeString(req.body?.reason, 500);
    const messageToUser = toSafeString(req.body?.messageToUser, 1000);

    if (!targetUid || !action) {
      res.status(400).json({ error: "uid and action are required." });
      return;
    }

    if (!["disable", "activate", "remove"].includes(action)) {
      res.status(400).json({ error: "action must be disable, activate, or remove." });
      return;
    }

    if ((action === "disable" || action === "remove") && !reason) {
      res.status(400).json({ error: "reason is required for disable/remove actions." });
      return;
    }

    try {
      const targetUser = await req.db.collection("users").findOne({ _id: targetUid });
      if (!targetUser) {
        res.status(404).json({ error: "User not found." });
        return;
      }

      if (action === "disable") {
        const now = getNow();
        await req.db.collection("users").updateOne(
          { _id: targetUid },
          {
            $set: {
              status: "disabled",
              disabledReason: reason,
              disabledBy: req.authUser.uid,
              updatedAt: now,
            },
          }
        );

        const targetRole = normalizeRole(targetUser.role);

        if (targetRole === USER_ROLES.JOB_SEEKER) {
          const apps = await req.db.collection("applications")
            .find({ $or: [{ jobSeekerUid: targetUid }, { applicantId: targetUid }] })
            .toArray();
          if (apps.length > 0) {
            await req.db.collection("archived_applications").insertMany(
              apps.map((a) => ({ ...a, bannedUserId: targetUid, archivedAt: now }))
            );
            await req.db.collection("applications").deleteMany({
              $or: [{ jobSeekerUid: targetUid }, { applicantId: targetUid }],
            });
          }
        }

        if (targetRole === USER_ROLES.EMPLOYER) {
          const employerJobs = await req.db.collection("jobs")
            .find({ employerUid: targetUid })
            .toArray();
          if (employerJobs.length > 0) {
            const jobIdStrings = employerJobs.map((j) => String(j._id));

            const jobApps = await req.db.collection("applications")
              .find({ jobId: { $in: jobIdStrings } })
              .toArray();
            if (jobApps.length > 0) {
              await req.db.collection("archived_applications").insertMany(
                jobApps.map((a) => ({ ...a, bannedUserId: targetUid, archivedAt: now }))
              );
              await req.db.collection("applications").deleteMany({ jobId: { $in: jobIdStrings } });
            }

            await req.db.collection("archived_jobs").insertMany(
              employerJobs.map((j) => ({ ...j, bannedUserId: targetUid, archivedAt: now }))
            );

            for (const job of employerJobs) {
              if (job.idCode) {
                await req.db.collection("companies").updateMany(
                  { $or: [{ jobs: job.idCode }, { jobIds: job.idCode }] },
                  {
                    $pull: { jobs: job.idCode, jobIds: job.idCode },
                    $set: { updatedAt: now },
                    $inc: { jobCount: -1 },
                  }
                );
              }
            }

            await req.db.collection("jobs").deleteMany({ employerUid: targetUid });
          }
        }
      }

      if (action === "activate") {
        const now = getNow();
        await req.db.collection("users").updateOne(
          { _id: targetUid },
          {
            $set: { status: "active", updatedAt: now },
            $unset: { disabledReason: "", disabledBy: "" },
          }
        );

        const targetRole = normalizeRole(targetUser.role);

        if (targetRole === USER_ROLES.JOB_SEEKER) {
          const archived = await req.db.collection("archived_applications")
            .find({ bannedUserId: targetUid })
            .toArray();
          if (archived.length > 0) {
            const restored = archived.map(({ bannedUserId, archivedAt, ...rest }) => rest);
            await req.db.collection("applications").insertMany(restored);
            await req.db.collection("archived_applications").deleteMany({ bannedUserId: targetUid });
          }
        }

        if (targetRole === USER_ROLES.EMPLOYER) {
          const archivedJobs = await req.db.collection("archived_jobs")
            .find({ bannedUserId: targetUid })
            .toArray();
          if (archivedJobs.length > 0) {
            const restoredJobs = archivedJobs.map(({ bannedUserId, archivedAt, ...rest }) => rest);
            await req.db.collection("jobs").insertMany(restoredJobs);

            for (const job of archivedJobs) {
              if (job.idCode && job.companyId) {
                await req.db.collection("companies").updateMany(
                  { companyId: job.companyId },
                  {
                    $addToSet: { jobs: job.idCode, jobIds: job.idCode },
                    $set: { updatedAt: now },
                    $inc: { jobCount: 1 },
                  }
                );
              }
            }

            await req.db.collection("archived_jobs").deleteMany({ bannedUserId: targetUid });
          }

          const archivedApps = await req.db.collection("archived_applications")
            .find({ bannedUserId: targetUid })
            .toArray();
          if (archivedApps.length > 0) {
            const restoredApps = archivedApps.map(({ bannedUserId, archivedAt, ...rest }) => rest);
            await req.db.collection("applications").insertMany(restoredApps);
            await req.db.collection("archived_applications").deleteMany({ bannedUserId: targetUid });
          }
        }
      }

      if (action === "remove") {
        await req.db.collection("users").deleteOne({ _id: targetUid });
        await req.db.collection("job_seeker_profiles").deleteOne({ _id: targetUid });
        await req.db.collection("employer_profiles").deleteOne({ _id: targetUid });
        await req.db.collection("admin_profiles").deleteOne({ _id: targetUid });
        await req.db
          .collection("applications")
          .deleteMany({ $or: [{ jobSeekerUid: targetUid }, { applicantId: targetUid }] });
        await req.db.collection("jobs").deleteMany({ employerUid: targetUid });
        await req.db.collection("archived_jobs").deleteMany({ bannedUserId: targetUid });
        await req.db.collection("archived_applications").deleteMany({ bannedUserId: targetUid });
      }

      await req.db.collection("moderation_logs").insertOne({
        action: `account_${action}`,
        targetType: "user",
        targetUid,
        targetEmail: targetUser.email ?? "",
        performedByUid: req.authUser.uid,
        performedByEmail: req.currentUser?.email ?? req.authUser.email ?? "",
        reason: reason ?? "",
        messageToUser: messageToUser ?? "",
        createdAt: getNow(),
      });

      res.json({ success: true, action });
    } catch (error) {
      console.error("Failed admin user action:", error);
      res.status(500).json({ error: "Failed admin user action." });
    }
  }
);

app.get(
  "/api/admin/moderation-logs",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const logs = await req.db
        .collection("moderation_logs")
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch moderation logs:", error);
      res.status(500).json({ error: "Failed to fetch moderation logs." });
    }
  }
);

app.post(
  "/api/employer/company-profile",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    try {
      const role = normalizeRole(req.currentUser.role);
      const uid = req.authUser.uid;
      const payload = req.body ?? {};
      const salaryRangeSource =
        payload.salaryRangeSummary &&
        typeof payload.salaryRangeSummary === "object" &&
        !Array.isArray(payload.salaryRangeSummary)
          ? payload.salaryRangeSummary
          : payload.salaryRange &&
              typeof payload.salaryRange === "object" &&
              !Array.isArray(payload.salaryRange)
            ? payload.salaryRange
            : null;

      const companyId =
        toSafeString(payload.companyId, 60) || `COMP-${uid.slice(0, 8).toUpperCase()}`;
      const name = toSafeString(payload.name ?? payload.companyName, 140);

      if (!name) {
        res.status(400).json({ error: "Company name is required." });
        return;
      }

      const company = {
        companyId,
        name,
        slug: slugify(name),
        industry: toSafeString(payload.industry, 120) ?? "",
        institutionType: toSafeString(payload.institutionType, 120) ?? "",
        location: toSafeString(payload.location, 120) ?? "",
        website: toSafeString(payload.website, 300) ?? "",
        description: toSafeString(payload.description, 4000) ?? "",
        benefitsOffered: toSafeStringArray(payload.benefitsOffered, 80, 120) ?? [],
        salaryRangeSummary: salaryRangeSource
          ? {
              min: Number.isFinite(Number(salaryRangeSource.min))
                ? Number(salaryRangeSource.min)
                : null,
              max: Number.isFinite(Number(salaryRangeSource.max))
                ? Number(salaryRangeSource.max)
                : null,
              currency: toSafeString(salaryRangeSource.currency, 10) ?? "USD",
              intervalsPresent: Array.isArray(salaryRangeSource.intervalsPresent)
                ? salaryRangeSource.intervalsPresent
                : Array.isArray(payload.intervalsPresent)
                  ? payload.intervalsPresent
                  : [],
            }
          : null,
        categoriesHiringFor: toSafeStringArray(payload.categoriesHiringFor, 100, 120) ?? [],
        departmentsHiringFor: toSafeStringArray(payload.departmentsHiringFor, 100, 120) ?? [],
        recruiterIds: toSafeStringArray(payload.recruiterIds, 100, 120) ?? [],
        ownerUid: uid,
        updatedAt: getNow(),
      };

      await req.db.collection("companies").updateOne(
        { companyId },
        {
          $set: company,
          $setOnInsert: {
            createdAt: getNow(),
            jobIds: [],
            jobs: [],
            jobCount: 0,
          },
        },
        { upsert: true }
      );

      if (role === USER_ROLES.EMPLOYER) {
        await req.db.collection("employer_profiles").updateOne(
          { _id: uid },
          {
            $set: {
              userId: uid,
              companyId,
              companyName: company.name,
              companySlug: company.slug,
              companyDescription: company.description,
              industry: company.industry,
              location: company.location,
              website: company.website,
              updatedAt: getNow(),
            },
            $setOnInsert: { createdAt: getNow() },
          },
          { upsert: true }
        );
      }

      const savedCompany = await req.db.collection("companies").findOne({ companyId });
      res.json(mapCompanyDocument(savedCompany));
    } catch (error) {
      console.error("Failed to upsert employer company profile:", error);
      res.status(500).json({ error: "Failed to upsert employer company profile." });
    }
  }
);

app.post(
  "/api/employer/select-company",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    try {
      const uid = req.authUser.uid;
      const identifier = toSafeString(req.body?.companyId ?? req.body?.identifier, 120);
      const name = toSafeString(req.body?.name, 140);

      if (!identifier && !name) {
        res.status(400).json({ error: "companyId (or identifier) or name is required." });
        return;
      }

      const companyQuery = [];

      if (identifier) {
        if (ObjectId.isValid(identifier)) {
          companyQuery.push({ _id: new ObjectId(identifier) });
        }
        companyQuery.push({ companyId: { $regex: `^${escapeRegex(identifier)}$`, $options: "i" } });
        companyQuery.push({ slug: identifier });
      }

      if (name) {
        companyQuery.push({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } });
      }

      const company = await req.db.collection("companies").findOne({
        $or: companyQuery,
      });

      if (!company) {
        res.status(404).json({ error: "Institution not found." });
        return;
      }

      await req.db.collection("employer_profiles").updateOne(
        { _id: uid },
        {
          $set: {
            userId: uid,
            companyId: toSafeString(company.companyId, 60) ?? "",
            companyName: toSafeString(company.name, 140) ?? "",
            companySlug: toSafeString(company.slug, 160) ?? "",
            companyDescription: toSafeString(company.description, 4000) ?? "",
            industry: toSafeString(company.industry, 120) ?? "",
            location: toSafeString(company.location, 120) ?? "",
            website: toSafeString(company.website, 300) ?? "",
            updatedAt: getNow(),
          },
          $setOnInsert: {
            createdAt: getNow(),
          },
        },
        { upsert: true }
      );

      res.json(mapCompanyDocument(company));
    } catch (error) {
      console.error("Failed to select employer institution:", error);
      res.status(500).json({ error: "Failed to select employer institution." });
    }
  }
);

app.get(
  "/api/employer/jobs",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    try {
      const role = normalizeRole(req.currentUser.role);
      const filter = role === USER_ROLES.ADMIN ? {} : { employerUid: req.authUser.uid };
      const jobs = await req.db
        .collection("jobs")
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();
      res.json(jobs.map(mapJobDocument));
    } catch (error) {
      console.error("Failed to fetch employer jobs:", error);
      res.status(500).json({ error: "Failed to fetch employer jobs." });
    }
  }
);

app.post(
  "/api/employer/jobs",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    try {
      const uid = req.authUser.uid;
      const payload = req.body ?? {};

      const name = toSafeString(payload.name, 200);
      const jobTitle = toSafeString(payload.jobTitle ?? payload.name, 200);
      const idCode = toSafeString(payload.idCode, 40) ?? `JOB-${Date.now()}`;
      const salary = Number(payload.salary ?? payload.salaryRange?.min);
      const details =
        payload.details && typeof payload.details === "object" ? payload.details : {};

      if (!jobTitle || !Number.isFinite(salary)) {
        res.status(400).json({ error: "jobTitle and numeric salary are required." });
        return;
      }

      const employerProfile = await req.db.collection("employer_profiles").findOne({ _id: uid });
      const companyId =
        toSafeString(payload.companyId, 60) || toSafeString(employerProfile?.companyId, 60) || "";
      const companyName =
        toSafeString(payload.institutionName, 140) ||
        toSafeString(payload.company, 140) ||
        toSafeString(employerProfile?.companyName, 140) ||
        "";

      if (!companyName) {
        res.status(400).json({
          error:
            "Company is required. Create company profile first or send company in payload.",
        });
        return;
      }

      const job = {
        idCode: idCode.toUpperCase(),
        jobTitle,
        name: jobTitle,
        institutionName: companyName,
        company: companyName,
        companyId,
        category: toSafeString(payload.category, 120) ?? "",
        department: toSafeString(payload.department, 120) ?? "",
        location: toSafeString(payload.location, 140) ?? "",
        employerUid: uid,
        salary,
        salaryRange:
          payload.salaryRange &&
          typeof payload.salaryRange === "object" &&
          !Array.isArray(payload.salaryRange)
            ? {
                min: Number.isFinite(Number(payload.salaryRange.min))
                  ? Number(payload.salaryRange.min)
                  : salary,
                max: Number.isFinite(Number(payload.salaryRange.max))
                  ? Number(payload.salaryRange.max)
                  : salary,
                currency: toSafeString(payload.salaryRange.currency, 10) ?? "USD",
                interval:
                  toSafeString(payload.salaryRange.interval, 20) ??
                  toSafeString(payload.salaryRange.intervalsPresent?.[0], 20) ??
                  "year",
              }
            : {
                min: salary,
                max: salary,
                currency: "USD",
                interval: "year",
              },
        requiredQualifications:
          toSafeStringArray(payload.requiredQualifications, 100, 300) ?? [],
        applicationDeadline: toSafeString(payload.applicationDeadline, 40) ?? "",
        expectedStartDate: toSafeString(payload.expectedStartDate, 40) ?? "",
        recruiterId:
          toSafeString(payload.recruiterId, 120) || toSafeString(payload.recruiterUid, 120) || uid,
        employmentType:
          toSafeString(payload.employmentType, 80) ?? toSafeString(details.type, 80) ?? "Full-time",
        shift: toSafeString(payload.shift, 80) ?? toSafeString(details.shift, 80) ?? "Day",
        benefits:
          toSafeStringArray(payload.benefits, 60, 120) ??
          toSafeStringArray(details.benefits, 60, 120) ??
          [],
        details: {
          pay: toSafeString(details.pay, 120) ?? `$${salary.toLocaleString()}/year`,
          type:
            toSafeString(details.type, 80) ??
            toSafeString(payload.employmentType, 80) ??
            "Full-time",
          shift: toSafeString(details.shift, 80) ?? toSafeString(payload.shift, 80) ?? "Day",
          benefits:
            toSafeStringArray(details.benefits, 60, 120) ??
            toSafeStringArray(payload.benefits, 60, 120) ??
            [],
          description:
            toSafeString(details.description, 4000) ||
            toSafeString(payload.jobDescription, 4000) ||
            toSafeString(payload.description, 4000) ||
            "",
        },
        jobDescription:
          toSafeString(details.description, 4000) ||
          toSafeString(payload.jobDescription, 4000) ||
          toSafeString(payload.description, 4000) ||
          "",
        description:
          toSafeString(details.description, 4000) ||
          toSafeString(payload.jobDescription, 4000) ||
          toSafeString(payload.description, 4000) ||
          "",
        createdAt: getNow(),
        updatedAt: getNow(),
      };

      const insertResult = await req.db.collection("jobs").insertOne(job);

      const companyLookup = [
        ...(companyId ? [{ companyId }] : []),
        ...(employerProfile?.companyId ? [{ companyId: employerProfile.companyId }] : []),
        { name: companyName },
        { slug: slugify(companyName) },
      ];
      const company = await req.db.collection("companies").findOne({
        $or: companyLookup,
      });

      if (company) {
        await req.db.collection("companies").updateOne(
          { _id: company._id },
          {
            $addToSet: { jobs: job.idCode, jobIds: job.idCode },
            $set: { updatedAt: getNow() },
            $inc: { jobCount: 1 },
          }
        );
      }

      const created = await req.db.collection("jobs").findOne({ _id: insertResult.insertedId });
      res.status(201).json(mapJobDocument(created));
    } catch (error) {
      console.error("Failed to create employer job:", error);
      res.status(500).json({ error: "Failed to create employer job." });
    }
  }
);

app.patch(
  "/api/employer/jobs/:id",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    try {
      const role = normalizeRole(req.currentUser.role);
      const jobId = new ObjectId(req.params.id);
      const existingJob = await req.db.collection("jobs").findOne({ _id: jobId });

      if (!existingJob) {
        res.status(404).json({ error: "Job not found." });
        return;
      }

      if (role === USER_ROLES.EMPLOYER && existingJob.employerUid !== req.authUser.uid) {
        res.status(403).json({ error: "You can only edit your own postings." });
        return;
      }

      const payload = req.body ?? {};
      const updates = {};

      const name = toSafeString(payload.name, 200);
      const jobTitle = toSafeString(payload.jobTitle, 200);
      const company = toSafeString(payload.company, 140);
      const institutionName = toSafeString(payload.institutionName, 140);
      const companyId = toSafeString(payload.companyId, 60);
      const category = toSafeString(payload.category, 120);
      const department = toSafeString(payload.department, 120);
      const location = toSafeString(payload.location, 140);
      const salary = payload.salary !== undefined ? Number(payload.salary) : null;
      const description = toSafeString(payload.description, 4000);
      const jobDescription = toSafeString(payload.jobDescription, 4000);
      const applicationDeadline = toSafeString(payload.applicationDeadline, 40);
      const expectedStartDate = toSafeString(payload.expectedStartDate, 40);
      const recruiterId = toSafeString(payload.recruiterId, 120);
      const employmentType = toSafeString(payload.employmentType, 80);
      const shiftValue = toSafeString(payload.shift, 80);
      const requiredQualifications = toSafeStringArray(payload.requiredQualifications, 100, 300);
      const benefits = toSafeStringArray(payload.benefits, 60, 120);
      const salaryRangeInput =
        payload.salaryRange &&
        typeof payload.salaryRange === "object" &&
        !Array.isArray(payload.salaryRange)
          ? payload.salaryRange
          : null;

      if (name !== null) updates.name = name;
      if (jobTitle !== null) {
        updates.jobTitle = jobTitle;
        updates.name = jobTitle;
      }
      if (company !== null) updates.company = company;
      if (institutionName !== null) updates.institutionName = institutionName;
      if (companyId !== null) updates.companyId = companyId;
      if (category !== null) updates.category = category;
      if (department !== null) updates.department = department;
      if (location !== null) updates.location = location;
      if (salary !== null && Number.isFinite(salary)) updates.salary = salary;
      if (salaryRangeInput) {
        const minSalary = Number(salaryRangeInput.min);
        const maxSalary = Number(salaryRangeInput.max);
        const fallbackSalary =
          salary !== null && Number.isFinite(salary)
            ? salary
            : Number.isFinite(existingJob.salary)
              ? Number(existingJob.salary)
              : 0;

        const normalizedMin = Number.isFinite(minSalary) ? minSalary : fallbackSalary;
        const normalizedMax = Number.isFinite(maxSalary) ? maxSalary : normalizedMin;

        updates.salaryRange = {
          min: normalizedMin,
          max: normalizedMax,
          currency:
            toSafeString(salaryRangeInput.currency, 10) ??
            toSafeString(existingJob.salaryRange?.currency, 10) ??
            "USD",
          interval:
            toSafeString(salaryRangeInput.interval, 20) ??
            toSafeString(salaryRangeInput.intervalsPresent?.[0], 20) ??
            toSafeString(existingJob.salaryRange?.interval, 20) ??
            "year",
        };

        if (!Number.isFinite(salary) && Number.isFinite(normalizedMin)) {
          updates.salary = normalizedMin;
        }
      }
      if (applicationDeadline !== null) updates.applicationDeadline = applicationDeadline;
      if (expectedStartDate !== null) updates.expectedStartDate = expectedStartDate;
      if (recruiterId !== null) updates.recruiterId = recruiterId;
      if (employmentType !== null) {
        updates.employmentType = employmentType;
        updates["details.type"] = employmentType;
      }
      if (shiftValue !== null) {
        updates.shift = shiftValue;
        updates["details.shift"] = shiftValue;
      }
      if (requiredQualifications !== null) updates.requiredQualifications = requiredQualifications;
      if (benefits !== null) {
        updates.benefits = benefits;
        updates["details.benefits"] = benefits;
      }
      if (description !== null) {
        updates.description = description;
        updates["details.description"] = description;
        updates.jobDescription = description;
      }
      if (jobDescription !== null) {
        updates.jobDescription = jobDescription;
        updates.description = jobDescription;
        updates["details.description"] = jobDescription;
      }

      if (payload.details && typeof payload.details === "object") {
        const pay = toSafeString(payload.details.pay, 120);
        const type = toSafeString(payload.details.type, 80);
        const shift = toSafeString(payload.details.shift, 80);
        const benefits = toSafeStringArray(payload.details.benefits, 60, 120);

        if (pay !== null) updates["details.pay"] = pay;
        if (type !== null) updates["details.type"] = type;
        if (shift !== null) updates["details.shift"] = shift;
        if (benefits !== null) updates["details.benefits"] = benefits;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: "No valid job fields to update." });
        return;
      }

      updates.updatedAt = getNow();

      await req.db.collection("jobs").updateOne({ _id: jobId }, { $set: updates });
      const updated = await req.db.collection("jobs").findOne({ _id: jobId });
      res.json(mapJobDocument(updated));
    } catch (error) {
      console.error("Failed to update employer job:", error);
      res.status(500).json({ error: "Failed to update employer job." });
    }
  }
);

app.delete(
  "/api/employer/jobs/:id",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    try {
      const role = normalizeRole(req.currentUser.role);
      const jobId = new ObjectId(req.params.id);
      const existingJob = await req.db.collection("jobs").findOne({ _id: jobId });

      if (!existingJob) {
        res.status(404).json({ error: "Job not found." });
        return;
      }

      if (role === USER_ROLES.EMPLOYER && existingJob.employerUid !== req.authUser.uid) {
        res.status(403).json({ error: "You can only delete your own postings." });
        return;
      }

      await req.db.collection("jobs").deleteOne({ _id: jobId });
      await req.db.collection("applications").deleteMany({ jobId: req.params.id });
      await req.db
        .collection("companies")
        .updateMany(
          { $or: [{ jobs: existingJob.idCode }, { jobIds: existingJob.idCode }] },
          {
            $pull: { jobs: existingJob.idCode, jobIds: existingJob.idCode },
            $set: { updatedAt: getNow() },
            $inc: { jobCount: -1 },
          }
        );

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete employer job:", error);
      res.status(500).json({ error: "Failed to delete employer job." });
    }
  }
);

// Returns applicants for a job; joins job_seeker_profiles to include resumeFileId and candidate info
app.get(
  "/api/employer/jobs/:id/applicants",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.ADMIN, USER_ROLES.EMPLOYER),
  async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    try {
      const role = normalizeRole(req.currentUser.role);
      const jobId = req.params.id;
      const job = await req.db.collection("jobs").findOne({ _id: new ObjectId(jobId) });

      if (!job) {
        res.status(404).json({ error: "Job not found." });
        return;
      }

      if (role === USER_ROLES.EMPLOYER && job.employerUid !== req.authUser.uid) {
        res.status(403).json({ error: "You can only view applicants for your own jobs." });
        return;
      }

      const applications = await req.db
        .collection("applications")
        .find({ jobId })
        .sort({ createdAt: -1 })
        .toArray();

      const seekerIds = Array.from(
        new Set(
          applications
            .map((item) => item.applicantId ?? item.jobSeekerUid)
            .filter((uid) => typeof uid === "string" && uid.trim())
        )
      );
      const seekerProfiles = await req.db
        .collection("job_seeker_profiles")
        .find({ _id: { $in: seekerIds } })
        .toArray();
      const seekerUsers = await req.db
        .collection("users")
        .find({ _id: { $in: seekerIds } })
        .toArray();

      const profileByUid = new Map(seekerProfiles.map((item) => [item._id, item]));
      const userByUid = new Map(seekerUsers.map((item) => [item._id, item]));

      res.json(
        applications.map((application) => ({
          ...application,
          candidate: {
            uid: application.applicantId ?? application.jobSeekerUid,
            email:
              userByUid.get(application.applicantId ?? application.jobSeekerUid)?.email ??
              "",
            fullName:
              profileByUid.get(application.applicantId ?? application.jobSeekerUid)
                ?.fullName ?? "",
            headline:
              profileByUid.get(application.applicantId ?? application.jobSeekerUid)
                ?.headline ?? "",
            resumeFileId:
              application.resumeFileId ||
              profileByUid.get(application.applicantId ?? application.jobSeekerUid)
                ?.resumeFileId ||
              null,
          },
        }))
      );
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
      res.status(500).json({ error: "Failed to fetch applicants." });
    }
  }
);

app.get(
  "/api/job-seeker/profile",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    try {
      const profile = await ensureProfileDocument(req.db, req.authUser.uid, USER_ROLES.JOB_SEEKER);
      res.json(profile);
    } catch (error) {
      console.error("Failed to fetch job seeker profile:", error);
      res.status(500).json({ error: "Failed to fetch job seeker profile." });
    }
  }
);

app.patch(
  "/api/job-seeker/profile",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    try {
      const patch = buildProfilePatch(USER_ROLES.JOB_SEEKER, req.body?.profile ?? req.body);
      if (patch.error) {
        res.status(400).json({ error: patch.error });
        return;
      }

      await req.db.collection("job_seeker_profiles").updateOne(
        { _id: req.authUser.uid },
        {
          $set: { ...patch.updates, updatedAt: getNow() },
          $setOnInsert: { _id: req.authUser.uid, userId: req.authUser.uid, createdAt: getNow() },
        },
        { upsert: true }
      );

      const profile = await req.db
        .collection("job_seeker_profiles")
        .findOne({ _id: req.authUser.uid });

      res.json(profile);
    } catch (error) {
      console.error("Failed to update job seeker profile:", error);
      res.status(500).json({ error: "Failed to update job seeker profile." });
    }
  }
);

// Submits an application; snapshots resumeFileId from seeker profile at apply time
app.post(
  "/api/job-seeker/applications",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    const jobId = String(req.body?.jobId || "").trim();
    const coverLetter = toSafeString(req.body?.coverLetter, 4000) ?? "";
    const documentUrlFromBody = toSafeString(req.body?.documentUrl, 500);

    if (!ObjectId.isValid(jobId)) {
      res.status(400).json({ error: "Valid jobId is required." });
      return;
    }

    try {
      const job = await req.db.collection("jobs").findOne({ _id: new ObjectId(jobId) });
      if (!job) {
        res.status(404).json({ error: "Job not found." });
        return;
      }

      const existing = await req.db.collection("applications").findOne({
        jobId,
        $or: [{ jobSeekerUid: req.authUser.uid }, { applicantId: req.authUser.uid }],
      });

      if (existing) {
        res.status(409).json({ error: "You already applied to this job." });
        return;
      }

      const seekerProfile = await req.db
        .collection("job_seeker_profiles")
        .findOne({ _id: req.authUser.uid });

      const dateApplied = getNow();
      const applicantId = req.authUser.uid;

      const application = {
        jobId,
        applicantId,
        dateApplied,
        jobCode: job.idCode ?? "",
        jobName: job.jobTitle ?? job.name ?? "",
        company: job.institutionName ?? job.company ?? "",
        employerUid: job.employerUid ?? null,
        jobSeekerUid: req.authUser.uid,
        resumeFileId: seekerProfile?.resumeFileId ?? null,
        documentUrl: documentUrlFromBody ?? "",
        coverLetter,
        status: "submitted",
        createdAt: dateApplied,
        updatedAt: dateApplied,
      };

      const result = await req.db.collection("applications").insertOne(application);

      await req.db.collection("job_seeker_profiles").updateOne(
        { _id: req.authUser.uid },
        {
          $addToSet: { appliedJobIds: jobId },
          $set: { updatedAt: getNow() },
          $setOnInsert: { _id: req.authUser.uid, userId: req.authUser.uid, createdAt: getNow() },
        },
        { upsert: true }
      );

      res.status(201).json({ id: result.insertedId.toString(), ...application });
    } catch (error) {
      console.error("Failed to submit application:", error);
      res.status(500).json({ error: "Failed to submit application." });
    }
  }
);

app.get(
  "/api/job-seeker/applications",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    try {
      const applications = await req.db
        .collection("applications")
        .find({ $or: [{ jobSeekerUid: req.authUser.uid }, { applicantId: req.authUser.uid }] })
        .sort({ createdAt: -1 })
        .toArray();

      const jobIds = applications
        .map((application) => application.jobId)
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      const jobs = await req.db
        .collection("jobs")
        .find({ _id: { $in: jobIds } })
        .toArray();
      const jobsById = new Map(jobs.map((job) => [job._id.toString(), mapJobDocument(job)]));

      res.json(
        applications.map((application) => ({
          ...application,
          job: jobsById.get(application.jobId) ?? null,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      res.status(500).json({ error: "Failed to fetch applications." });
    }
  }
);

app.get(
  "/api/job-seeker/favorites",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    try {
      const profile = await req.db
        .collection("job_seeker_profiles")
        .findOne({ _id: req.authUser.uid }, { projection: { favorites: 1 } });

      const favoriteIds = (profile?.favorites ?? [])
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (favoriteIds.length === 0) {
        res.json([]);
        return;
      }

      const jobs = await req.db
        .collection("jobs")
        .find({ _id: { $in: favoriteIds } })
        .toArray();

      res.json(jobs.map(mapJobDocument));
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites." });
    }
  }
);

app.post(
  "/api/job-seeker/favorites/:jobId",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    const { jobId } = req.params;
    if (!ObjectId.isValid(jobId)) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }
    try {
      await req.db.collection("job_seeker_profiles").updateOne(
        { _id: req.authUser.uid },
        { $addToSet: { favorites: jobId } },
        { upsert: true }
      );
      res.json({ favorited: true });
    } catch (error) {
      console.error("Failed to add favorite:", error);
      res.status(500).json({ error: "Failed to add favorite." });
    }
  }
);

app.delete(
  "/api/job-seeker/favorites/:jobId",
  authenticateRequest,
  loadCurrentUser,
  requireRoles(USER_ROLES.JOB_SEEKER),
  async (req, res) => {
    const { jobId } = req.params;
    try {
      await req.db.collection("job_seeker_profiles").updateOne(
        { _id: req.authUser.uid },
        { $pull: { favorites: jobId } }
      );
      res.json({ favorited: false });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(500).json({ error: "Failed to remove favorite." });
    }
  }
);

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
