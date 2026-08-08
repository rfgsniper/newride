import { Router, type IRouter } from "express";
import { db, listingsTable } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_TOKEN = process.env.ADMIN_INGEST_TOKEN;

// Reuse the same ingestion logic as the CLI script, but callable over HTTP.
// Protected by a secret token so only your cron job can trigger it.
router.post("/admin/ingest-marketcheck", async (req, res) => {
  if (!ADMIN_TOKEN || req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Dynamically import and run the same script logic used by the CLI.
    const { runIngestion } = await import(
      "../scripts/ingest-marketcheck-lib.js"
    );
    const result = await runIngestion();
    res.json({ success: true, ...result });
  } catch (err) {
    req.log.error(err, "Ingestion failed");
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
