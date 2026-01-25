import { Router } from "express";
import type { Request, Response } from "express";
import { addJob } from "../../../../shared/queue/queue.js";
import db from "../../../../shared/db/client.js";

const router = Router();

// test job
router.post("/test-job", async (req: Request, res: Response) => {
  try {
    const message = req.body.message || "hello world"; // allow custom messages
    await addJob(message); // use the helper

    res.json({ status: "job enqueued" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to enqueue job" });
  }
});

// Fetch processed jobs from DB
router.get("/test-results", async (req: Request, res: Response) => {
  try {
    const rows = await db.query(
      `SELECT id, message, created_at
       FROM test_jobs
       ORDER BY created_at DESC
       LIMIT 10;`,
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

export default router;
