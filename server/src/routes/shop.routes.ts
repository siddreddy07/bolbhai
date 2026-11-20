import { Router } from "express";
import { auth } from "../middleware/auth.middleware.js";
import { addShop, editShop, getShop, listShops, removeShop } from "../controllers/shop.controller.js";

const router = Router();

router.use(auth);
router.post("/", addShop);
router.get("/", listShops);
router.get("/:id", getShop);
router.put("/:id", editShop);
router.delete("/:id", removeShop);

export default router;
