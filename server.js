import express from "express";
import cors from "cors";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
app.use(express.json({ limit: "1mb" }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://3d-portfolio-ten-woad.vercel.app",
  /^https:\/\/.*\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) =>
        o instanceof RegExp ? o.test(origin) : o === origin
      );
      return ok ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.options("/*", cors());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    const developerPrompt = `
You are a helpful AI assistant for Juan Martinez's portfolio website.
Answer briefly and professionally (2-6 sentences).
If asked for contact, give: martiju2@kean.edu
LinkedIn: https://www.linkedin.com/in/juan-manuel-martinez-forero-43424b219/
GitHub: https://github.com/FenixBlame
If asked about resume, tell them to use the Download Resume button.
If asked about skills, summarize frontend + backend/CS + tools.
`.trim();

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      input: [
        { role: "developer", content: developerPrompt },
        { role: "user", content: message },
      ],
    });

    res.json({ reply: response.output_text || "No response text." });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`API running on port ${PORT}`));