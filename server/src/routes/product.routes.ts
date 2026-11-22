import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { searchCatalog } from "../controllers/product.controller.js";

const router = Router();

router.use(auth);
router.get("/search", searchCatalog);

export default router;
