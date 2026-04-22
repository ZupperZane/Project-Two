import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getDb, hasMongoConfig } from "./mongo.js";

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

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
