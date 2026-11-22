import express, { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { transcribe } from "../controllers/stt.controller.js";

const router = Router();

router.use(auth);
// the browser sends the raw recording, up to 10 MB
router.post("/", express.raw({ type: () => true, limit: "10mb" }), transcribe);

export default router;
