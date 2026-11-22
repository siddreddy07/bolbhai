import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { searchShopInventory } from "../controllers/inventory.controller.js";

const router = Router();

router.use(auth);
router.get("/search", searchShopInventory);

export default router;
