import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { searchLimit } from "../middleware/rate-limit.middleware.js";
import { searchShopInventory } from "../controllers/inventory.controller.js";

const router = Router();

router.use(auth);
router.use(searchLimit);
router.get("/search", searchShopInventory);

export default router;
