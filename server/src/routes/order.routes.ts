import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { confirmOrder } from "../controllers/order.controller.js";

const router = Router();

router.use(auth);
router.post("/confirm", confirmOrder);

export default router;
