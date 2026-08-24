// This file acts as the Vercel serverless function entrypoint.
// Include dynamically required files for Vercel's NFT bundler so Pino works!
import { fileURLToPath } from "node:url";
fileURLToPath(new URL("../dist/pino-worker.mjs", import.meta.url));
fileURLToPath(new URL("../dist/pino-file.mjs", import.meta.url));
fileURLToPath(new URL("../dist/pino-pretty.mjs", import.meta.url));
fileURLToPath(new URL("../dist/thread-stream-worker.mjs", import.meta.url));

let app;

export default async (req, res) => {
  try {
    if (!app) {
      const module = await import("../dist/app.mjs");
      app = module.default;
    }
    return app(req, res);
  } catch (err) {
    console.error("Initialization error:", err);
    res.status(500).json({
      error: "FUNCTION_INVOCATION_FAILED",
      details: err.message,
      stack: err.stack,
    });
  }
};
