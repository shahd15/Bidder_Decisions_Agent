import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { POST as extractTenderHandler } from "./app/api/extract-tender/route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

// Setup multer for in-memory file uploads (max 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// JSON and URL-encoded body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side API Route: POST /api/extract-tender
app.post("/api/extract-tender", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No PDF file provided in request." });
    }

    // Construct a standard Web API Request to invoke app/api/extract-tender/route.ts
    const formData = new FormData();
    const uint8 = new Uint8Array(file.buffer);
    const blob = new Blob([uint8], { type: file.mimetype });
    formData.append("file", blob, file.originalname);

    const webReq = new globalThis.Request("http://localhost:3000/api/extract-tender", {
      method: "POST",
      body: formData,
    });

    const webRes = await extractTenderHandler(webReq);
    const json = await webRes.json();
    return res.status(webRes.status).json(json);
  } catch (err: any) {
    console.error("Server API error /api/extract-tender:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during PDF extraction." });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Vite Middleware Setup
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`BidderDecisions Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
